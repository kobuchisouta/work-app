"use client";

import { auth, db } from "@/firebase";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

// users/{uid}/favorites を購読して「お気に入りvideoId一覧」を返す
export function listenFavoriteIds(
  uid: string,
  onChange: (ids: string[]) => void,
  onError?: (e: any) => void
) {
  const colRef = collection(db, "users", uid, "favorites");

  return onSnapshot(
    colRef,
    (snap) => {
      // docId = videoId で運用しているので id を集める
      const ids = snap.docs.map((d) => d.id);
      onChange(ids);
    },
    (e) => onError?.(e)
  );
}

// お気に入りON/OFF
export async function toggleFavorite(videoId: string, isFav: boolean) {
  const user = auth.currentUser;
  if (!user) throw new Error("未ログインです");

  const ref = doc(db, "users", user.uid, "favorites", videoId);

  if (isFav) {
    await deleteDoc(ref);
  } else {
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
