"use client";

import styles from "../page.module.css";
import StudyMovie from "@/app/components/studyMovie/StudyMovie";
import { studyMovieArray } from "@/app/lib/studyMovieArray";
import type { StudyMovieType } from "@/app/type/StudyMovieType";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import { addFavorite, removeFavorite } from "@/app/lib/favorites";

type ModalState = {
    modalFlg: boolean;
    clickMovie: StudyMovieType | null;
};

const initialState: ModalState = {
    modalFlg: false,
    clickMovie: null,
};

function Modal({
    state,
    onClose,
}: {
    state: ModalState;
    onClose: () => void;
}) {
    const movie = state.clickMovie;
    if (!state.modalFlg || !movie) return null;

    return (
        <div className={styles.modal} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <h2>{movie.title}</h2>

                <iframe
                    className={styles.modalVideo}
                    src={`https://www.youtube.com/embed/${movie.videoId}`}
                    title={movie.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />

                <p>{movie.about}</p>

                <button type="button" onClick={onClose}>
                    閉じる
                </button>
            </div>
        </div>
    );
}

export default function Page() {
    const [modal, setModal] = useState<ModalState>(initialState);

    // uid
    const [uid, setUid] = useState<string | null>(null);

    // favorites set
    const [favoriteSet, setFavoriteSet] = useState<Set<string>>(new Set());

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
        return () => unsub();
    }, []);

    // Firestore から favorites を取得
    useEffect(() => {
        (async () => {
            if (!uid) {
                setFavoriteSet(new Set());
                return;
            }
            const snap = await getDocs(collection(db, "users", uid, "favorites"));
            const set = new Set<string>();
            snap.forEach((d) => {
                const data = d.data() as any;
                if (data?.videoId) set.add(data.videoId);
                else set.add(d.id); // 念のため
            });
            setFavoriteSet(set);
        })();
    }, [uid]);

    const beginner = useMemo(
        () => studyMovieArray.filter((m) => m.level === "beginner"),
        []
    );
    const intermediate = useMemo(
        () => studyMovieArray.filter((m) => m.level === "intermediate"),
        []
    );
    const advanced = useMemo(
        () => studyMovieArray.filter((m) => m.level === "advanced"),
        []
    );

    const toggleFavorite = async (movie: StudyMovieType) => {
        if (!uid) return;

        const isFav = favoriteSet.has(movie.videoId);

        // ✅ UIは先に反映（押した瞬間に色が変わる）
        setFavoriteSet((prev) => {
            const next = new Set(prev);
            if (isFav) next.delete(movie.videoId);
            else next.add(movie.videoId);
            return next;
        });

        try {
            if (isFav) {
                await removeFavorite(uid, movie.videoId);
            } else {
                await addFavorite(uid, movie);
            }
        } catch (e) {
            console.error(e);

            // 失敗したら元に戻す
            setFavoriteSet((prev) => {
                const next = new Set(prev);
                if (isFav) next.add(movie.videoId);
                else next.delete(movie.videoId);
                return next;
            });
        }
    };

    return (
        <div className={styles.container}>
            <Modal state={modal} onClose={() => setModal(initialState)} />

            <div className={styles.movieWrap}>
                <div className={styles.Beginnermovie}>
                    <h2 className={styles.title}>初心者</h2>
                    <div className={styles.contents}>
                        {beginner.map((m, i) => (
                            <StudyMovie
                                key={i}
                                title={m.title}
                                text={m.text}
                                videoId={m.videoId}
                                about={m.about}
                                onClick={() => setModal({ modalFlg: true, clickMovie: m })}
                                isFavorite={favoriteSet.has(m.videoId)}
                                onToggleFavorite={() => toggleFavorite(m)}
                            />
                        ))}
                    </div>
                </div>

                <div className={styles.Beginnermovie}>
                    <h2 className={styles.title}>中級者</h2>
                    <div className={styles.contents}>
                        {intermediate.map((m, i) => (
                            <StudyMovie
                                key={i}
                                title={m.title}
                                text={m.text}
                                videoId={m.videoId}
                                about={m.about}
                                onClick={() => setModal({ modalFlg: true, clickMovie: m })}
                                isFavorite={favoriteSet.has(m.videoId)}
                                onToggleFavorite={() => toggleFavorite(m)}
                            />
                        ))}
                    </div>
                </div>

                <div className={styles.Beginnermovie}>
                    <h2 className={styles.title}>上級者</h2>
                    <div className={styles.contents}>
                        {advanced.map((m, i) => (
                            <StudyMovie
                                key={i}
                                title={m.title}
                                text={m.text}
                                videoId={m.videoId}
                                about={m.about}
                                onClick={() => setModal({ modalFlg: true, clickMovie: m })}
                                isFavorite={favoriteSet.has(m.videoId)}
                                onToggleFavorite={() => toggleFavorite(m)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
