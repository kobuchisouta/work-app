"use client";

import { db } from "@/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

export type ConversationDoc = {
  members: string[];
  createdAt?: any;
  updatedAt?: any;
  lastMessage?: string;
};

export type MessageDoc = {
  senderUid: string;
  text: string;
  createdAt?: any;
};

export function makeConversationId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_");
}

export async function ensureConversation(conversationId: string, members: string[]) {
  const ref = doc(db, "conversations", conversationId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      members,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "",
    } satisfies ConversationDoc);
  }
}

export async function sendMessage(params: {
  conversationId: string;
  senderUid: string;
  text: string;
}) {
  const { conversationId, senderUid, text } = params;

  const msgCol = collection(db, "conversations", conversationId, "messages");

  await addDoc(msgCol, {
    senderUid,
    text,
    createdAt: serverTimestamp(),
  } satisfies MessageDoc);

  await setDoc(
    doc(db, "conversations", conversationId),
    {
      updatedAt: serverTimestamp(),
      lastMessage: text,
    },
    { merge: true }
  );
}

/**
 * 自分が参加している会話を監視（orderByなし＝複合index回避）
 * 取得後にJSでupdatedAt降順に並び替えます
 */
export function listenMyConversations(
  uid: string,
  onChange: (items: { id: string; data: ConversationDoc }[]) => void,
  onError?: (e: any) => void
) {
  const q = query(collection(db, "conversations"), where("members", "array-contains", uid));

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        data: d.data() as ConversationDoc,
      }));

      items.sort((a, b) => {
        const at = a.data.updatedAt?.seconds ?? 0;
        const bt = b.data.updatedAt?.seconds ?? 0;
        return bt - at;
      });

      onChange(items);
    },
    (e) => onError?.(e)
  );
}

export function listenMessages(
  conversationId: string,
  onChange: (msgs: { id: string; data: MessageDoc }[]) => void,
  onError?: (e: any) => void
) {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snap) => {
      onChange(
        snap.docs.map((d) => ({
          id: d.id,
          data: d.data() as MessageDoc,
        }))
      );
    },
    (e) => onError?.(e)
  );
}
