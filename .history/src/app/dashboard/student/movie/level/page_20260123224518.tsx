"use client";

import styles from "../page.module.css";
import StudyMovie from "@/app/components/studyMovie/StudyMovie";
import { studyMovieArray } from "@/app/lib/studyMovieArray";
import { type Dispatch, type SetStateAction, useEffect, useMemo, useRef, useState } from "react";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import YouTube, { type YouTubePlayer } from "react-youtube";

type StudyMovieProps = {
    title: string;
    text: string;
    videoId: string;
    about: string;
    durationSec: number;      // ✅ 追加
    skillTags: string[];      // ✅ 追加
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
        durationSec: 0,
        skillTags: [],
    },
};

type ModalProps = {
    state: State;
    setState: Dispatch<SetStateAction<State>>;
    uid: string | null;
};

// ✅ Firestoreに学習ログを保存（users/{uid}/watchedVideos/{videoId}）
async function saveWatchedVideo(params: {
    uid: string;
    movie: StudyMovieProps;
    progress: number; // 0〜1
    durationSec: number; // 実測を優先
}) {
    const { uid, movie, progress, durationSec } = params;
    if (!movie.videoId) return;

    await setDoc(
        doc(db, "users", uid, "watchedVideos", movie.videoId),
        {
            videoId: movie.videoId,
            title: movie.title,
            durationSec: durationSec || movie.durationSec || null,
            skillTags: movie.skillTags ?? [],
            progress: Math.max(0, Math.min(1, progress)),
            lastWatchedAt: serverTimestamp(),
        },
        { merge: true }
    );
}

function Modal(props: ModalProps) {
    const movie = props.state.clickMovie;

    const playerRef = useRef<YouTubePlayer | null>(null);
    const timerRef = useRef<number | null>(null);

    const [currentSec, setCurrentSec] = useState(0);
    const [durationSec, setDurationSec] = useState(movie.durationSec || 0);

    // ✅ 保存ステータス表示
    const [saveStatus, setSaveStatus] = useState<string>("");

    const isOpen = props.state.modalFlg;

    const progress = useMemo(() => {
        const d = durationSec || movie.durationSec || 0;
        if (!d) return 0;
        return Math.min(1, Math.max(0, currentSec / d));
    }, [currentSec, durationSec, movie.durationSec]);

    const stopTimer = () => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startTimer = () => {
        stopTimer();
        timerRef.current = window.setInterval(async () => {
            try {
                const p = playerRef.current;
                if (!p) return;

                const sec = await p.getCurrentTime();
                setCurrentSec(Math.floor(sec));
            } catch {
                // noop
            }
        }, 1000);
    };

    const handleCloseAndSave = async () => {
        stopTimer();

        // ✅ 未ログインなら保存せず閉じる
        if (!props.uid) {
            props.setState(initialState);
            return;
        }

        try {
            const d = durationSec || movie.durationSec || 0;
            const p = d ? Math.min(1, Math.max(0, currentSec / d)) : 0;

            setSaveStatus(`保存中... progress=${Math.round(p * 100)}%`);

            await saveWatchedVideo({
                uid: props.uid,
                movie,
                progress: p,
                durationSec: d,
            });

            setSaveStatus(`保存OK progress=${Math.round(p * 100)}% (uid=${props.uid.slice(0, 6)}...)`);
            // 少し表示してから閉じる（すぐ閉じたいならこの2行を消してOK）
            setTimeout(() => {
                setSaveStatus("");
                props.setState(initialState);
            }, 600);
        } catch (e) {
            console.error("自動保存に失敗", e);
            setSaveStatus("保存に失敗しました（Firestore接続/権限を確認）");
        }
    };

    // モーダルが開いたら初期化
    useEffect(() => {
        if (!isOpen) return;
        setCurrentSec(0);
        setDurationSec(movie.durationSec || 0);
        setSaveStatus("");
        stopTimer();
        playerRef.current = null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, movie.videoId]);

    if (!isOpen) return null;

    return (
        <div
            className={styles.modal}
            onClick={async () => {
                // 背景クリック = 閉じる(=自動保存)
                await handleCloseAndSave();
            }}
        >
            <div
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
            >
                <h2>{movie.title}</h2>

                {/* ✅ react-youtubeで再生位置を取得 */}
                <YouTube
                    videoId={movie.videoId}
                    className={styles.modalVideo}
                    opts={{
                        width: "100%",
                        height: "100%",
                        playerVars: {
                            autoplay: 0,
                        },
                    }}
                    onReady={(e) => {
                        playerRef.current = e.target;
                        try {
                            const d = e.target.getDuration();
                            if (d) setDurationSec(Math.floor(d));
                        } catch {
                            // noop
                        }
                    }}
                    onPlay={() => startTimer()}
                    onPause={() => stopTimer()}
                    onEnd={() => stopTimer()}
                />

                <p>{movie.about}</p>

                {/* ✅ 保存ステータス */}
                {saveStatus && (
                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
                        {saveStatus}
                    </div>
                )}

                {/* ✅ ボタンは「閉じる」だけ */}
                <button
                    type="button"
                    onClick={async () => {
                        await handleCloseAndSave();
                    }}
                >
                    閉じる
                </button>
            </div>
        </div>
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
                        {studyMovieArray.map((e, i) => (
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
                        {studyMovieArray.map((e, i) => (
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
                        {studyMovieArray.map((e, i) => (
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
            </div>

            {/* デバッグ（不要なら削除OK） */}
            <div style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
                uid: {uid ?? "未ログイン"}
            </div>
        </div>
    );
}
