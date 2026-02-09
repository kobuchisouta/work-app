"use client";

import styles from "../page.module.css";
import StudyMovie from "@/app/components/studyMovie/StudyMovie";
import { studyMovieArray } from "@/app/lib/studyMovieArray";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

type StudyMovieProps = {
    title: string;
    text: string;
    videoId: string;
    about: string;
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
    },
};

type ModalProps = {
    state: State;
    setState: Dispatch<SetStateAction<State>>;
    uid: string | null;
};

// ✅ Firestoreに学習ログを保存する関数
async function saveWatchedVideo(params: {
    uid: string;
    movie: StudyMovieProps;
    progress: number; // 0〜1
}) {
    const { uid, movie, progress } = params;

    // videoId がない場合は保存しない
    if (!movie.videoId) return;

    await setDoc(
        doc(db, "users", uid, "watchedVideos", movie.videoId),
        {
            videoId: movie.videoId,
            title: movie.title,
            // durationSec は今ないので一旦 null でもOK（あとで追加できます）
            durationSec: null,
            // ✅ 今は固定。あとで movie側に skillTags を持たせて自動化できます
            skillTags: ["React"],
            progress: Math.max(0, Math.min(1, progress)),
            lastWatchedAt: serverTimestamp(),
        },
        { merge: true }
    );
}

function Modal(props: ModalProps) {
    const movie = props.state.clickMovie;

    return (
        <>
            {props.state.modalFlg && (
                <div
                    className={styles.modal}
                    onClick={async () => {
                        // ✅ 背景クリックで閉じる＝途中まで見た扱い
                        if (props.uid) {
                            try {
                                await saveWatchedVideo({
                                    uid: props.uid,
                                    movie,
                                    progress: 0.3,
                                });
                            } catch (e) {
                                console.error("途中保存に失敗", e);
                            }
                        }
                        props.setState(initialState);
                    }}
                >
                    <div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>{movie.title}</h2>

                        <iframe
                            className={styles.modalVideo}
                            src={`https://www.youtube.com/embed/${movie.videoId}`}
                            title={movie.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />

                        <p>{movie.about}</p>

                        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                            {/* ✅ 途中保存 */}
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!props.uid) return;
                                    try {
                                        await saveWatchedVideo({
                                            uid: props.uid,
                                            movie,
                                            progress: 0.3,
                                        });
                                        props.setState(initialState);
                                    } catch (e) {
                                        console.error("途中保存に失敗", e);
                                    }
                                }}
                            >
                                途中で閉じる（30%保存）
                            </button>

                            {/* ✅ 完了保存 */}
                            <button
                                type="button"
                                onClick={async () => {
                                    if (!props.uid) return;
                                    try {
                                        await saveWatchedVideo({
                                            uid: props.uid,
                                            movie,
                                            progress: 1,
                                        });
                                        props.setState(initialState);
                                    } catch (e) {
                                        console.error("完了保存に失敗", e);
                                    }
                                }}
                            >
                                視聴完了（100%保存）
                            </button>

                            {/* 閉じる（保存しない） */}
                            <button type="button" onClick={() => props.setState(initialState)}>
                                閉じる（保存しない）
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
