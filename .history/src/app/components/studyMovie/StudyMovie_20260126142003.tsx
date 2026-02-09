"use client";

import styles from "./StudyMovie.module.css";

type StudyMovieProps = {
    title: string;
    text: string;
    videoId: string;
    about: string;
    onClick?: () => void;

    // ⭐追加
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
};

export default function StudyMovie(props: StudyMovieProps) {
    const {
        title,
        text,
        videoId,
        onClick,
        isFavorite = false,
        onToggleFavorite,
    } = props;

    return (
        <div className={styles.studyMovieWrap}>
            {/* ⭐お気に入り */}
            <button
                type="button"
                className={styles.favBtn}
                onClick={(e) => {
                    e.stopPropagation(); // 親のクリック（モーダル表示）を防ぐ
                    onToggleFavorite?.();
                }}
                aria-label="favorite"
                title={isFavorite ? "お気に入り解除" : "お気に入り追加"}
            >
                {isFavorite ? "★" : "☆"}
            </button>

            {/* サムネ（クリックでモーダル） */}
            <div className={styles.thumbnail} onClick={onClick}>
                <img
                    className={styles.thumbnailImg}
                    src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                    alt={title}
                />
            </div>

            <p className={styles.title}>{title}</p>
            <p className={styles.text}>{text}</p>
        </div>
    );
}
