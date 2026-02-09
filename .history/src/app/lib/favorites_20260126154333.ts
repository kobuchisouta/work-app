"use client";

import { db } from "@/firebase";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import type { StudyMovieType } from "@/app/type/StudyMovieType";

/* =========================================================
 * お気に入りIDをリアルタイム購読（★色切り替え用）
 * ========================================================= */
export function listenFavoriteIds(
  uid: string,
  onChange: (ids: string[]) => void,
  onError?: (e: any) => void
) {
  const colRef = collection(db, "users", uid, "favorites");

  return onSnapshot(
    colRef,
    (snap) => {
      // docId = videoId として扱う
      const ids = snap.docs.map((d) => d.id);
      onChange(ids);
    },
    (e) => onError?.(e)
  );
}

/* =========================================================
 * ★ ON / OFF を切り替える（最低限版）
 * ========================================================= */
export async function toggleFavoriteByUid(params: {
  uid: string;
  videoId: string;
  isFav: boolean;
}) {
  const { uid, videoId, isFav } = params;
  const ref = doc(db, "users", uid, "favorites", videoId);

  if (isFav) {
    // ★ OFF
    await deleteDoc(ref);
  } else {
    // ★ ON（最低限の情報）
    await setDoc(
      ref,
      {
        videoId,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

/* =========================================================
 * ★ 動画情報込みでお気に入り保存したい場合（拡張版）
 * （お気に入り一覧ページで使う）
 * ========================================================= */
export async function addFavoriteWithMovie(
  uid: string,
  movie: StudyMovieType
) {
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

/* =========================================================
 * ★ 明示的に削除したい場合
 * ========================================================= */
export async function removeFavoriteByUid(params: {
  uid: string;
  videoId: string;
}) {
  const { uid, videoId } = params;
  const ref = doc(db, "users", uid, "favorites", videoId);
  await deleteDoc(ref);
}
