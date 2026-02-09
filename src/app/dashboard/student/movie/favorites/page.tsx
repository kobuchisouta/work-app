"use client";

import styles from "../page.module.css";
import StudyMovie from "@/app/components/studyMovie/StudyMovie";
import { studyMovieArray } from "@/app/lib/studyMovieArray";
import { useEffect, useMemo, useState } from "react";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";

import { listenFavoriteIds, toggleFavoriteByUid } from "@/app/lib/favorites";
import { type Dispatch, type SetStateAction } from "react";

type StudyMovieProps = {
    title: string;
    text: string;
    videoId: string;
    about: string;
    onClick?: () => void;

    // ⭐追加（StudyMovie側が受け取る）
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
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
};

function Modal(props: ModalProps) {
    return (
        <>
            {props.state.modalFlg && (
                <div className={styles.modal} onClick={() => props.setState(initialState)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h2>{props.state.clickMovie.title}</h2>

                        <iframe
                            className={styles.modalVideo}
                            src={`https://www.youtube.com/embed/${props.state.clickMovie.videoId}`}
                            title={props.state.clickMovie.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />

                        <p>{props.state.clickMovie.about}</p>

                        <button type="button" onClick={() => props.setState(initialState)}>
                            閉じる
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default function Page() {
    const [state, setState] = useState<State>(initialState);

    // ✅ ログインUID
    const [uid, setUid] = useState<string | null>(null);

    // ✅ お気に入りID一覧（videoId）
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // ✅ 表示用メッセージ（デバッグにも便利）
    const [status, setStatus] = useState("");

    // 1) Auth監視
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUid(u?.uid ?? null);
        });
        return () => unsub();
    }, []);

    // 2) Firestore favorites を購読
    useEffect(() => {
        if (!uid) {
            setFavoriteIds([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsub = listenFavoriteIds(
            uid,
            (ids) => {
                setFavoriteIds(ids);
                setLoading(false);
            },
            (e) => {
                console.error(e);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [uid]);

    // 3) favoritesだけ表示
    const favoriteMovies = useMemo(() => {
        const set = new Set(favoriteIds);
        return studyMovieArray.filter((m) => set.has(m.videoId));
    }, [favoriteIds]);

    const handleToggleFavorite = async (videoId: string) => {
        if (!uid) {
            setStatus("未ログインです");
            return;
        }

        const isFav = favoriteIds.includes(videoId);

        // ✅ まずUIを即時更新
        setFavoriteIds((prev) =>
            isFav ? prev.filter((id) => id !== videoId) : [...prev, videoId]
        );

        try {
            await toggleFavoriteByUid({ uid, videoId, isFav });
            setStatus(isFav ? "お気に入りを解除しました" : "お気に入りに追加しました");
            setTimeout(() => setStatus(""), 1200);
        } catch (e: any) {
            console.error(e);

            // 失敗したらUIを戻す
            setFavoriteIds((prev) =>
                isFav ? [...prev, videoId] : prev.filter((id) => id !== videoId)
            );

            setStatus(e?.message ?? "保存に失敗しました");
        }
    };


    return (
        <div className={styles.container}>
            <Modal state={state} setState={setState} />

            <div className={styles.movieWrap}>
                <div className={styles.Beginnermovie}>
                    <h2 className={styles.title}>お気に入り</h2>

                    {status && (
                        <p style={{ padding: "8px 10px", fontSize: 12, opacity: 0.8 }}>
                            {status}
                        </p>
                    )}

                    <div className={styles.contents}>
                        {!uid ? (
                            <p style={{ padding: 10 }}>ログインしてください</p>
                        ) : loading ? (
                            <p style={{ padding: 10 }}>読み込み中...</p>
                        ) : favoriteMovies.length === 0 ? (
                            <p style={{ padding: 10 }}>
                                まだお気に入りがありません（level/listで☆を押すと追加されます）
                            </p>
                        ) : (
                            favoriteMovies.map((e, i) => (
                                <StudyMovie
                                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                    key={i}
                                    onClick={() => setState({ modalFlg: true, clickMovie: e })}
                                    title={e.title}
                                    text={e.text}
                                    videoId={e.videoId}
                                    about={e.about}
                                    isFavorite={favoriteIds.includes(e.videoId)}
                                    onToggleFavorite={() => handleToggleFavorite(e.videoId)}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
