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

export function listenFavoriteIds(
  uid: string,
  onChange: (ids: string[]) => void,
  onError?: (e: any) => void
) {
  const colRef = collection(db, "users", uid, "favorites");

  return onSnapshot(
    colRef,
    (snap) => {
      const ids = snap.docs.map((d) => d.id); // docId = videoId
      onChange(ids);
    },
    (e) => onError?.(e)
  );
}

// ✅ auth.currentUser を使わない（uidを必ず渡す）
export async function toggleFavoriteByUid(params: {
  uid: string;
  videoId: string;
  isFav: boolean;
}) {
  const { uid, videoId, isFav } = params;

  const ref = doc(db, "users", uid, "favorites", videoId);

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
