"use client";

import styles from "./StudyMovie.module.css";

type Props = {
    title: string;
    text: string;
    videoId: string;
    about: string;
    onClick?: () => void;

    // ⭐ 追加
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
        <div className={styles.card}>
            {/* クリックでモーダル開く */}
            <button type="button" className={styles.thumbBtn} onClick={onClick}>
                {/* YouTube サムネ */}
                <img
                    className={styles.thumb}
                    src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                    alt={title}
                />
            </button>

            <div className={styles.meta}>
                <div className={styles.titleRow}>
                    <h3 className={styles.title}>{title}</h3>

                    {/* ⭐ お気に入り */}
                    <button
                        type="button"
                        className={styles.favBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite?.();
                        }}
                        aria-label="favorite"
                    >
                        {isFavorite ? "★" : "☆"}
                    </button>
                </div>

                <p className={styles.text}>{text}</p>
            </div>
        </div>
    );
}
