


type StudyMovieProps = {
    title: string;
    text: string;
    videoId: string;
    about: string;
    onClick?: () => void;
}

import style from "./page.module.css";

export default function StudyMovie(props: StudyMovieProps) {
    return (
        // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
        <div className={style.studyMovieWrap} onClick={props.onClick}>
            <div className={style.videoContainer}>
                <div className={style.thumbnail}>
                    <Image

                        className={style.thumbnailImg}
                        src={`https://img.youtube.com/vi/${props.videoId}/maxresdefault.jpg`}
                        alt={props.title}
                    />

                </div>
                {/* <iframe
                        width="560"
                        height="315"
                        src={`https://www.youtube.com/embed/${props.videoId}`}
                        title={props.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    /> */}
            </div>
            <h3 className={style.title}>{props.title}</h3>
            <p className={style.text}>{props.text}</p>
        </div>
    );
}

