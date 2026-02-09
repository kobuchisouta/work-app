"use client";

import styles from "./page.module.css";

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
    about,
    onClick,
    isFavorite = false,
    onToggleFavorite,
}: Props) {
    return (
        <div className={styles.studyMovieWrap}>
            {/* ⭐ お気に入り */}
            <button
                type="button"
                className={styles.favBtn}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleFavorite?.();
                }}
                aria-label="favorite"
            >
                {isFavorite ? "★" : "☆"}
            </button>

            {/* サムネ（モーダルを開く） */}
            <button
                type="button"
                className={styles.thumbnail}
                onClick={(e) => {
                    e.preventDefault();
                    onClick?.();
                }}
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
