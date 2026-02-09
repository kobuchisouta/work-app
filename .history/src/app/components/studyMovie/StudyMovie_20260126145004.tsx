"use client";

import styles from "./StudyMovie.module.css";

type Props = {
    title: string;
    text: string;
    videoId: string;
    about: string;
    onClick?: () => void;

    isFavorite?: boolean;
    onToggleFavorite?: () => void;
};

export default function StudyMovie({
    title,
    text,
    videoId,
    onClick,
    isFavorite = false,
    onToggleFavorite,
}: Props) {
    return (
        <div className={styles.studyMovieWrap}>
            {/* ⭐お気に入り */}
            <button
                type="button"
                className={styles.favBtn}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("⭐ clicked:", videoId);
                    onToggleFavorite?.();
                }}
                aria-label="favorite"
                title={isFavorite ? "お気に入り解除" : "お気に入り追加"}
            >
                {isFavorite ? "★" : "☆"}
            </button>

            {/* サムネ（モーダルを開く） */}
            <button
                type="button"
                className={styles.thumbnail}
                onClick={() => onClick?.()}
            >
                <img
                    className={styles.thumbnailImg}
                    src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                    alt={title}
                />
            </button>

            <p className={styles.title}>{title}</p>
            <p className={styles.text}>{text}</p>
        </div>
    );
}
