"use client";

import { db } from "@/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

/**
 * messages/{conversationId}
 *   - members: string[]  (uidの配列)
 *   - createdAt, updatedAt
 *   - lastText, lastSenderId
 *
 * messages/{conversationId}/items/{messageId}
 *   - senderId
 *   - text
 *   - createdAt
 */

export type ConversationDoc = {
  members: string[];
  createdAt?: any;
  updatedAt?: any;
  lastText?: string;
  lastSenderId?: string;
};

export type MessageDoc = {
  senderId: string;
  text: string;
  createdAt?: any;
};

function stableConversationId(a: string, b: string) {
  // uidの大小で固定（同じ2人なら必ず同じID）
  return [a, b].sort().join("__");
}

export async function ensureConversation(params: {
  uidA: string;
  uidB: string;
}) {
  const { uidA, uidB } = params;
  const cid = stableConversationId(uidA, uidB);

  const ref = doc(db, "messages", cid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const payload: ConversationDoc = {
      members: [uidA, uidB],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastText: "",
      lastSenderId: "",
    };
    await setDoc(ref, payload, { merge: true });
  }

  return { conversationId: cid };
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  text: string;
}) {
  const { conversationId, senderId, text } = params;

  const convRef = doc(db, "messages", conversationId);
  const itemsRef = collection(db, "messages", conversationId, "items");

  // メッセージ追加
  await addDoc(itemsRef, {
    senderId,
    text,
    createdAt: serverTimestamp(),
  } satisfies MessageDoc);

  // 会話の更新（一覧用）
  await setDoc(
    convRef,
    {
      updatedAt: serverTimestamp(),
      lastText: text,
      lastSenderId: senderId,
    },
    { merge: true }
  );
}

export function listenConversations(
  uid: string,
  onChange: (list: Array<{ id: string; data: ConversationDoc }>) => void,
  onError?: (e: any) => void
) {
  // where + orderBy を避ける（インデックス要求を回避しやすい）
  const q = query(collection(db, "messages"), where("members", "array-contains", uid));

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        data: d.data() as ConversationDoc,
      }));

      // updatedAtでクライアントソート（undefinedは最後）
      list.sort((a, b) => {
        const at = a.data.updatedAt?.seconds ?? 0;
        const bt = b.data.updatedAt?.seconds ?? 0;
        return bt - at;
      });

      onChange(list);
    },
    (e) => onError?.(e)
  );
}

export function listenMessages(
  conversationId: string,
  onChange: (list: Array<{ id: string; data: MessageDoc }>) => void,
  onError?: (e: any) => void
) {
  // items は orderBy(createdAt) してOK（通常は単一フィールドで自動インデックス）
  const q = query(
    collection(db, "messages", conversationId, "items"),
    orderBy("createdAt", "asc"),
    limit(300)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        data: d.data() as MessageDoc,
      }));
      onChange(list);
    },
    (e) => onError?.(e)
  );
}

// 企業が「生徒一覧」を出す用（role==student）
export async function fetchStudentsLite() {
  const q = query(collection(db, "users"), where("role", "==", "student"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as any;
    return {
      uid: d.id,
      email: data.email ?? "",
      displayName: data.displayName ?? "",
      schoolName: data.schoolName ?? "",
    };
  });
}
