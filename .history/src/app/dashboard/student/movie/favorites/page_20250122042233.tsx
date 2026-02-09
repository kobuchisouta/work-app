"use client";
import styles from "../page.module.css";
import StudyMovie from "@/app/components/studyMovie/StudyMovie";
import { studyMovieArray } from "@/app/lib/studyMovieArray";
import { type Dispatch, type SetStateAction, useState } from "react";

type State = {
    modalFlg: boolean,
    clickMovie: StudyMovieProps,
}


const initialState: State = {
    modalFlg: false,
    clickMovie: {
        title: "",
        text: "",
        videoId: "",
        about: "",
    }
}
type StudyMovieProps = {
    title: string;
    text: string;
    videoId: string;
    about: string;
    onClick?: () => void;
}
type ModalProps = {
    state: State,
    setState: Dispatch<SetStateAction<State>>,
}

function Modal(props: ModalProps) {
    return (
        <>
            {props.state.modalFlg &&
                // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                <div className={styles.modal}
                    onClick={() => props.setState(initialState)}
                >
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                    <div className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>{props.state.clickMovie.title}</h2>
                        <iframe
                            className={styles.modalVideo}
                            src={`https://www.youtube.com/embed/${props.state.clickMovie.videoId}`}
                            title={props.state.clickMovie.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                        <p>{props.state.clickMovie.about}</p>
                        <button type="button" onClick={() => props.setState(initialState)}>閉じる</button>
                    </div>
                </div>}
        </>
    )
}

export default function Page() {
    const [state, setState] = useState<State>(initialState);


    return (
        <div className={styles.container}>
            <Modal state={state} setState={setState} />
            {/* /* <NewLogin /> */}
            {/* <Login /> */}
            <div className={styles.movieWrap}>
                <div className={styles.Beginnermovie}>
                    <h2 className={styles.title}>お気に入り</h2>
                    <div className={styles.contents}>
                        {studyMovieArray.map((e, i) =>
                            <StudyMovie
                                onClick={() => setState({ modalFlg: true, clickMovie: e })}
                                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                key={i}
                                title={e.title}
                                text={e.text}
                                videoId={e.videoId}
                                about={e.about}
                            />)}
                    </div>
                </div>
            </div>
        </div>
    )
}
