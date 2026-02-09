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
  limit,
} from "firebase/firestore";

export type Conversation = {
  id: string;
  members: string[]; // [studentUid, companyUid] など
  updatedAt?: any;
  lastMessage?: string;
};

export type Message = {
  id: string;
  conversationId: string;
  senderUid: string;
  text: string;
  createdAt?: any;
};

// ------------------------------------
// 会話IDを安定して作る（uid順で固定）
// ------------------------------------
export function conversationIdOf(a: string, b: string) {
  return [a, b].sort().join("_");
}

// ------------------------------------
// 会話を作成（なければ作る）
// conversations/{conversationId}
// ------------------------------------
export async function ensureConversation(params: {
  uidA: string;
  uidB: string;
}) {
  const { uidA, uidB } = params;
  const id = conversationIdOf(uidA, uidB);

  const ref = doc(db, "conversations", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        members: [uidA, uidB],
        updatedAt: serverTimestamp(),
        lastMessage: "",
      },
      { merge: true }
    );
  }

  return id;
}

// ------------------------------------
// 自分が参加している会話一覧を購読
// conversations where members array-contains uid
// ------------------------------------
export function listenMyConversations(
  uid: string,
  onChange: (items: Conversation[]) => void,
  onError?: (e: any) => void
) {
  const q = query(
    collection(db, "conversations"),
    where("members", "array-contains", uid),
    orderBy("updatedAt", "desc"),
    limit(50)
  );

  return onSnapshot(
    q,
    (snap) => {
      const items: Conversation[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      onChange(items);
    },
    (e) => onError?.(e)
  );
}

// ------------------------------------
// 特定会話のメッセージ一覧を購読
// conversations/{id}/messages
// ------------------------------------
export function listenMessages(
  conversationId: string,
  onChange: (items: Message[]) => void,
  onError?: (e: any) => void
) {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc"),
    limit(200)
  );

  return onSnapshot(
    q,
    (snap) => {
      const items: Message[] = snap.docs.map((d) => ({
        id: d.id,
        conversationId,
        ...(d.data() as any),
      }));
      onChange(items);
    },
    (e) => onError?.(e)
  );
}

// ------------------------------------
// メッセージ送信
// conversations/{id}/messages に追加
// conversations/{id} の updatedAt/lastMessage も更新
// ------------------------------------
export async function sendMessage(params: {
  conversationId: string;
  senderUid: string;
  text: string;
}) {
  const { conversationId, senderUid, text } = params;

  if (!text.trim()) return;

  await addDoc(collection(db, "conversations", conversationId, "messages"), {
    conversationId,
    senderUid,
    text,
    createdAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, "conversations", conversationId),
    {
      updatedAt: serverTimestamp(),
      lastMessage: text.slice(0, 60),
    },
    { merge: true }
  );
}
