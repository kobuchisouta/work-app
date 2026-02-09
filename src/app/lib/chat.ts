"use client";

import { db } from "@/firebase";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

export type Role = "student" | "company";

export type ConversationDoc = {
  members: string[];
  lastMessage?: string;
  lastMessageAt?: any;
  memberRoles?: Record<string, Role>;
  createdAt?: any;
};

export type MessageDoc = {
  senderId: string;
  senderRole: Role;
  text: string;
  createdAt?: any;
};

export function makeConversationId(a: string, b: string) {
  return [a, b].sort().join("_");
}

// ✅ 会話が無ければ作成（companyUid/studentUid を渡す）
export async function ensureConversation(params: {
  companyUid: string;
  studentUid: string;
}) {
  const { companyUid, studentUid } = params;
  const conversationId = makeConversationId(companyUid, studentUid);

  await setDoc(
    doc(db, "conversations", conversationId),
    {
      members: [companyUid, studentUid],
      memberRoles: {
        [companyUid]: "company",
        [studentUid]: "student",
      },
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
    } satisfies ConversationDoc,
    { merge: true }
  );

  return conversationId;
}

// ✅ 自分が参加している会話一覧を購読
export function listenMyConversations(
  uid: string,
  onChange: (items: { id: string; data: ConversationDoc }[]) => void,
  onError?: (e: any) => void
) {
  const q = query(
    collection(db, "conversations"),
    where("members", "array-contains", uid),
    orderBy("lastMessageAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, data: d.data() as ConversationDoc }));
      onChange(list);
    },
    (e) => onError?.(e)
  );
}

// ✅ 企業側ページで呼んでも同じ（エイリアス）
export function listenConversations(
  uid: string,
  onChange: (items: { id: string; data: ConversationDoc }[]) => void,
  onError?: (e: any) => void
) {
  return listenMyConversations(uid, onChange, onError);
}

// ✅ メッセージ購読
export function listenMessages(
  conversationId: string,
  onChange: (items: MessageDoc[]) => void,
  onError?: (e: any) => void
) {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as MessageDoc);
      onChange(list);
    },
    (e) => onError?.(e)
  );
}

// ✅ 送信（messages追加 + conversations更新）
export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  senderRole: Role;
  text: string;
}) {
  const { conversationId, senderId, senderRole, text } = params;

  // messagesに追加
  await addDoc(collection(db, "conversations", conversationId, "messages"), {
    senderId,
    senderRole,
    text,
    createdAt: serverTimestamp(),
  } satisfies MessageDoc);

  // 会話の最終更新
  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
  });
}
