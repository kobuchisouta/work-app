"use client";

import styles from ".page.module.css";
import StudyMovie from "@/app/components/studyMovie/StudyMovie";
import { studyMovieArray } from "@/app/lib/studyMovieArray";
import {
    type Dispatch,
    type SetStateAction,
    useEffect,
    useRef,
    useState,
} from "react";

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

    // ✅ studyMovieArray 側に追加している想定（なくてもOK）
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

// ✅ Firestoreに学習ログを保存する関数（失敗したらthrowする）
async function saveWatchedVideo(params: {
    uid: string;
    movie: StudyMovieProps;
    progress: number; // 0〜1
    durationSec?: number;
}) {
    const { uid, movie, progress, durationSec } = params;

    if (!movie.videoId) return;

    try {
        await setDoc(
            doc(db, "users", uid, "watchedVideos", movie.videoId),
            {
                videoId: movie.videoId,
                title: movie.title,
                skillTags:
                    movie.skillTags && movie.skillTags.length > 0 ? movie.skillTags : ["React"],
                durationSec: typeof durationSec === "number" ? durationSec : movie.durationSec ?? null,
                progress: Math.max(0, Math.min(1, progress)),
                lastWatchedAt: serverTimestamp(),
            },
            { merge: true }
        );
    } catch (e) {
        throw e;
    }
}

function Modal(props: ModalProps) {
    const movie = props.state.clickMovie;

    const playerRef = useRef<YouTubePlayer | null>(null);
    const intervalRef = useRef<number | null>(null);
    const lastSentProgressRef = useRef<number>(-1);

    // ✅ 追加：保存ステータス表示
    const [saveMsg, setSaveMsg] = useState<string>("");

    const stopAutoSave = () => {
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const tickSave = async () => {
        // uidがない＝未ログイン
        if (!props.uid) {
            setSaveMsg("保存NG: uid がありません（未ログイン）");
            return;
        }

        const player = playerRef.current;
        if (!player) {
            setSaveMsg("保存NG: player がまだ準備できていません");
            return;
        }

        const current = await player.getCurrentTime(); // 秒
        const duration = await player.getDuration(); // 秒
        if (!duration || duration <= 0) return;

        const raw = current / duration;
        const progress = Math.max(0, Math.min(1, raw));

        // Firestore節約：進捗が1%未満しか変わってないなら送らない
        if (Math.abs(progress - lastSentProgressRef.current) < 0.01 && progress < 0.99) return;
        lastSentProgressRef.current = progress;

        // ほぼ最後まで行ったら完了扱い
        const normalized = progress >= 0.99 ? 1 : progress;

        try {
            await saveWatchedVideo({
                uid: props.uid,
                movie,
                progress: normalized,
                durationSec: Math.round(duration),
            });

            setSaveMsg(
                `保存OK progress=${Math.round(normalized * 100)}% (uid=${props.uid.slice(0, 6)}...)`
            );
        } catch (e: any) {
            console.error("自動保存に失敗", e);
            setSaveMsg(`保存NG: ${e?.message ?? "エラー"}`);
        }
    };

    const startAutoSave = () => {
        if (intervalRef.current) return; // 二重起動防止
        intervalRef.current = window.setInterval(() => {
            tickSave();
        }, 5000); // 5秒ごと
    };

    // モーダル開閉に合わせてタイマー停止・初期化
    useEffect(() => {
        if (!props.state.modalFlg) {
            stopAutoSave();
            playerRef.current = null;
            lastSentProgressRef.current = -1;
            setSaveMsg("");
        }
        return () => stopAutoSave();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.state.modalFlg]);

    // 閉じる＝最後に保存して閉じる
    const closeWithSave = async () => {
        try {
            await tickSave();
        } catch (e) {
            console.error("閉じる直前の保存に失敗", e);
        } finally {
            stopAutoSave();
            props.setState(initialState);
        }
    };

    if (!props.state.modalFlg) return null;

    return (
        <div className={styles.modal} onClick={closeWithSave}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h2>{movie.title}</h2>

                <YouTube
                    videoId={movie.videoId}
                    className={styles.modalVideo}
                    onReady={(e) => {
                        playerRef.current = e.target;
                        startAutoSave();
                        tickSave(); // 初回保存（0%でもOK）
                    }}
                    onPlay={startAutoSave}
                    onPause={tickSave}
                    onEnd={async () => {
                        if (props.uid) {
                            try {
                                await saveWatchedVideo({
                                    uid: props.uid,
                                    movie,
                                    progress: 1,
                                });
                                setSaveMsg(`保存OK progress=100% (uid=${props.uid.slice(0, 6)}...)`);
                            } catch (e: any) {
                                console.error("終了時の保存に失敗", e);
                                setSaveMsg(`保存NG: ${e?.message ?? "エラー"}`);
                            }
                        }
                        stopAutoSave();
                        props.setState(initialState);
                    }}
                    opts={{
                        width: "100%",
                        height: "100%",
                        playerVars: {
                            rel: 0,
                        },
                    }}
                />

                <p>{movie.about}</p>

                {/* ✅ 追加：保存ステータス表示 */}
                {saveMsg && (
                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
                        {saveMsg}
                    </div>
                )}

                {/* ボタンは「閉じる」だけ */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
                    <button
                        type="button"
                        onClick={closeWithSave}
                        style={{
                            padding: "10px 18px",
                            borderRadius: 8,
                            border: "none",
                            cursor: "pointer",
                            background: "#2563eb",
                            color: "#fff",
                            fontWeight: 600,
                        }}
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function Page() {
    const [state, setState] = useState<State>(initialState);

    // ログインユーザーUIDを取得
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
