"use client";

import styles from "../page.module.css";
import StudyMovie from "@/app/components/studyMovie/StudyMovie";
import { studyMovieArray } from "@/app/lib/studyMovieArray";
import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";

import YouTube, { type YouTubePlayer } from "react-youtube";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

type SkillTag = "React" | "Next" | "Firebase" | "HTML" | "CSS" | "JavaScript";

type StudyMovieProps = {
    title: string;
    text: string;
    videoId: string;
    about: string;

    // ✅ studyMovieArray に追加したもの（なければOK）
    skillTags?: SkillTag[];
    durationSec?: number;

    onClick?: () => void;
};

type State = {
    modalFlg: boolean;
    clickMovie: StudyMovieProps;
};

const initialState: State = {
    modalFlg: false,
    clickMovie: {
        title: "",
        text: "",
        videoId: "",
        about: "",
        skillTags: [],
        durationSec: undefined,
    },
};

type ModalProps = {
    state: State;
    setState: Dispatch<SetStateAction<State>>;
    uid: string | null;
};

// ✅ Firestoreに学習ログを保存する関数（progress + durationSec を保存）
async function saveWatchedVideo(params: {
    uid: string;
    movie: StudyMovieProps;
    progress: number; // 0〜1
    durationSec?: number; // optional
}) {
    const { uid, movie, progress, durationSec } = params;
    if (!movie.videoId) return;

    await setDoc(
        doc(db, "users", uid, "watchedVideos", movie.videoId),
        {
            videoId: movie.videoId,
            title: movie.title,
            // ✅ 動画ごとのタグ（なければ最低限Reactにする）
            skillTags: movie.skillTags && movie.skillTags.length > 0 ? movie.skillTags : ["React"],
            // ✅ APIから取れたdurationがあればそれを優先
            durationSec: typeof durationSec === "number" ? durationSec : movie.durationSec ?? null,
            progress: Math.max(0, Math.min(1, progress)),
            lastWatchedAt: serverTimestamp(),
        },
        { merge: true }
    );
}

function Modal(props: ModalProps) {
    const movie = props.state.clickMovie;

    const playerRef = useRef<YouTubePlayer | null>(null);
    const intervalRef = useRef<number | null>(null);
    const lastSentProgressRef = useRef<number>(-1);

    const stopAutoSave = () => {
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const tickSave = async () => {
        if (!props.uid) return;
        const player = playerRef.current;
        if (!player) return;

        // 秒数取得
        const current = await player.getCurrentTime();
        const duration = await player.getDuration();

        if (!duration || duration <= 0) return;

        const raw = current / duration;
        const progress = Math.max(0, Math.min(1, raw));

        // ✅ Firestore節約：進捗が1%未満しか変わってないなら送らない
        if (Math.abs(progress - lastSentProgressRef.current) < 0.01 && progress < 0.99) return;
        lastSentProgressRef.current = progress;

        // ✅ ほぼ最後まで行ったら完了扱い
        const normalized = progress >= 0.99 ? 1 : progress;

        try {
            await saveWatchedVideo({
                uid: props.uid,
                movie,
                progress: normalized,
                durationSec: Math.round(duration),
            });
        } catch (e) {
            console.error("自動保存に失敗", e);
        }
    };

    const startAutoSave = () => {
        if (intervalRef.current) return; // 二重起動防止
        intervalRef.current = window.setInterval(() => {
            tickSave();
        }, 5000); // 5秒ごと
    };

    // ✅ モーダルが閉じたらタイマー停止（念のため）
    useEffect(() => {
        if (!props.state.modalFlg) {
            stopAutoSave();
            playerRef.current = null;
            lastSentProgressRef.current = -1;
        }
        return () => stopAutoSave();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.state.modalFlg]);

    // ✅ 背景クリックで閉じる時：最後に1回保存して閉じる
    const closeWithSave = async () => {
        try {
            await tickSave(); // 最後の進捗を保存
        } catch (e) {
            console.error("閉じる直前の保存に失敗", e);
        } finally {
            stopAutoSave();
            props.setState(initialState);
        }
    };

    return (
        <>
            {props.state.modalFlg && (
                <div className={styles.modal} onClick={closeWithSave}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h2>{movie.title}</h2>

                        {/* ✅ iframe → YouTube Player（再生秒数を取れる） */}
                        <YouTube
                            videoId={movie.videoId}
                            className={styles.modalVideo}
                            onReady={(e) => {
                                playerRef.current = e.target;
                                startAutoSave();
                                // 準備できたら一度保存（0%でもOK）
                                tickSave();
                            }}
                            onPlay={() => {
                                startAutoSave();
                            }}
                            onPause={() => {
                                // 一旦止めたタイミングでも保存
                                tickSave();
                            }}
                            onEnd={async () => {
                                // ✅ 終了＝完了保存して閉じる
                                if (props.uid) {
                                    try {
                                        await saveWatchedVideo({
                                            uid: props.uid,
                                            movie,
                                            progress: 1,
                                        });
                                    } catch (e) {
                                        console.error("終了時の完了保存に失敗", e);
                                    }
                                }
                                stopAutoSave();
                                props.setState(initialState);
                            }}
                            opts={{
                                width: "100%",
                                height: "100%",
                                playerVars: {
                                    // 余計な関連動画などを減らしたい場合はここを調整
                                    rel: 0,
                                },
                            }}
                        />

                        <p>{movie.about}</p>

                        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                            {/* ✅ 手動ボタンは残してもOK（デバッグ用） */}
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!props.uid) return;
                                    await saveWatchedVideo({ uid: props.uid, movie, progress: 0.3 });
                                    props.setState(initialState);
                                }}
                            >
                                途中で閉じる（30%保存）
                            </button>

                            <button
                                type="button"
                                onClick={async () => {
                                    if (!props.uid) return;
                                    await saveWatchedVideo({ uid: props.uid, movie, progress: 1 });
                                    props.setState(initialState);
                                }}
                            >
                                視聴完了（100%保存）
                            </button>

                            <button type="button" onClick={closeWithSave}>
                                閉じる（自動進捗保存）
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function Page() {
    const [state, setState] = useState<State>(initialState);

    // ✅ ログインユーザーUIDを取得
    const [uid, setUid] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
        return () => unsub();
    }, []);

    return (
        <div className={styles.container}>
            <Modal state={state} setState={setState} uid={uid} />

            <div className={styles.movieWrap}>
                <div className={styles.Beginnermovie}>
                    <h2 className={styles.title}>初心者</h2>
                    <div className={styles.contents}>
                        {studyMovieArray.map((e: any, i: number) => (
                            <StudyMovie
                                onClick={() => setState({ modalFlg: true, clickMovie: e })}
                                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                key={i}
                                title={e.title}
                                text={e.text}
                                videoId={e.videoId}
                                about={e.about}
                            />
                        ))}
                    </div>
                </div>

                <div className={styles.Beginnermovie}>
                    <h2 className={styles.title}>中級者</h2>
                    <div className={styles.contents}>
                        {studyMovieArray.map((e: any, i: number) => (
                            <StudyMovie
                                onClick={() => setState({ modalFlg: true, clickMovie: e })}
                                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                key={i}
                                title={e.title}
                                text={e.text}
                                videoId={e.videoId}
                                about={e.about}
                            />
                        ))}
                    </div>
                </div>

                <div className={styles.Beginnermovie}>
                    <h2 className={styles.title}>上級者</h2>
                    <div className={styles.contents}>
                        {studyMovieArray.map((e: any, i: number) => (
                            <StudyMovie
                                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                key={i}
                                title={e.title}
                                text={e.text}
                                videoId={e.videoId}
                                about={e.about}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* デバッグ表示（不要なら消してOK） */}
            <div style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
                uid: {uid ?? "未ログイン"}
            </div>
        </div>
    );
}
