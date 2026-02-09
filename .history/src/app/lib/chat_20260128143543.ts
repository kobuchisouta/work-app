"use client";

import { db } from "@/firebase";
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

/**
 * メッセージ送信
 * conversations/{conversationId}/messages/{autoId}
 */
export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  senderRole: "student" | "company";
  text: string;
}) {
  const { conversationId, senderId, senderRole, text } = params;

  if (!conversationId || !senderId || !text) {
    throw new Error("sendMessage: missing params");
  }

  // messages コレクション
  const msgRef = doc(collection(db, "conversations", conversationId, "messages"));

  // メッセージ保存
  await setDoc(msgRef, {
    senderId,
    senderRole,
    text,
    createdAt: serverTimestamp(),
  });

  // 会話の最終メッセージ情報を更新（一覧表示用）
  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
  });
}
