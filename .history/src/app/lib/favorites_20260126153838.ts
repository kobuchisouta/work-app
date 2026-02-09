import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import type { StudyMovieType } from "@/app/type/StudyMovieType";

export async function addFavorite(uid: string, movie: StudyMovieType) {
  const ref = doc(db, "users", uid, "favorites", movie.videoId);
  await setDoc(
    ref,
    {
      videoId: movie.videoId,
      title: movie.title,
      text: movie.text,
      about: movie.about,
      level: movie.level,
      skillTags: movie.skillTags,
      durationSec: movie.durationSec,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function removeFavorite(uid: string, videoId: string) {
  const ref = doc(db, "users", uid, "favorites", videoId);
  await deleteDoc(ref);
}
