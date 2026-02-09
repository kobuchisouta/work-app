// src/app/lib/chat.ts
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
  updateDoc,
  where,
} from "firebase/firestore";

/* =====================
  型
===================== */

export type Conversation = {
  id: string;
  members: string[]; // [companyUid, studentUid] など
  lastMessage?: string;
  updatedAt?: any;
};

export type Message = {
  id: string;
  sender: string; // uid
  text: string;
  createdAt?: any;
};

/* =====================
  会話ID生成（順番ブレ防止）
===================== */
export function conversationIdOf(a: string, b: string) {
  return [a, b].sort().join("_");
}

/* =====================
  ✅ 企業/生徒共通：自分が含まれる会話一覧を購読
===================== */
export function listenConversations(
  uid: string,
  onChange: (list: Conversation[]) => void,
  onError?: (e: any) => void
) {
  const q = query(
    collection(db, "conversations"),
    where("members", "array-contains", uid),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: Conversation[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      onChange(list);
    },
    (e) => onError?.(e)
  );
}

/* =====================
  ✅ 生徒側用の別名（あなたの既存コード互換）
===================== */
export const listenMyConversations = listenConversations;

/* =====================
  ✅ 会話を作る（存在しない場合だけ）
===================== */
export async function ensureConversation(params: {
  memberA: string;
  memberB: string;
}) {
  const { memberA, memberB } = params;

  const id = conversationIdOf(memberA, memberB);
  const ref = doc(db, "conversations", id);

  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        members: [memberA, memberB],
        lastMessage: "",
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  return id;
}

/* =====================
  ✅ メッセージ購読
===================== */
export function listenMessages(
  conversationId: string,
  onChange: (list: Message[]) => void,
  onError?: (e: any) => void
) {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const list: Message[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      onChange(list);
    },
    (e) => onError?.(e)
  );
}

/* =====================
  ✅ 送信
  - messages に追加
  - conversations の lastMessage / updatedAt 更新
===================== */
export async function sendMessage(params: {
  conversationId: string;
  sender: string;
  text: string;
}) {
  const { conversationId, sender, text } = params;

  // 1) messages に追加
  await addDoc(collection(db, "conversations", conversationId, "messages"), {
    sender,
    text,
    createdAt: serverTimestamp(),
  });

  // 2) 会話のサマリ更新
  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: text,
    updatedAt: serverTimestamp(),
  });
}
