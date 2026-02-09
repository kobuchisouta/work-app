"use client";

import { db } from "@/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

/**
 * 会話IDを安定して作る（順序関係なし）
 */
export function makeConversationId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_");
}

/**
 * 会話がなければ作成
 */
export async function ensureConversation(
  conversationId: string,
  members: string[]
) {
  const ref = doc(db, "conversations", conversationId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      members,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: "",
    });
  }
}

/**
 * メッセージ送信
 */
export async function sendMessage(params: {
  conversationId: string;
  senderUid: string;
  text: string;
}) {
  const { conversationId, senderUid, text } = params;

  const msgRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );

  await addDoc(msgRef, {
    senderUid,
    text,
    createdAt: serverTimestamp(),
  });

  // 会話側も更新
  await setDoc(
    doc(db, "conversations", conversationId),
    {
      lastMessage: text,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
