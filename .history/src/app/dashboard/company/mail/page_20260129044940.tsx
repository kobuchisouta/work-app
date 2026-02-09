"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

import {
    listenConversations,
    listenMessages,
    sendMessage,
} from "@/app/lib/chat";

/* =====================
  型定義
===================== */

type Conversation = {
    id: string;
    members: string[];
    lastMessage?: string;
};

type Message = {
    id: string;
    sender: string;
    text: string;
    createdAt?: any;
};

export default function CompanyMailPage() {
    const [uid, setUid] = useState<string | null>(null);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConv, setActiveConv] = useState<Conversation | null>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState("");

    /* =====================
      ログイン中の企業UID取得
    ===================== */
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            setUid(user?.uid ?? null);
        });
        return () => unsub();
    }, []);

    /* =====================
      会話一覧を購読
    ===================== */
    useEffect(() => {
        if (!uid) return;

        const unsub = listenConversations(uid, (list) => {
            setConversations(list);
            if (!activeConv && list.length > 0) {
                setActiveConv(list[0]);
            }
        });

        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid]);

    /* =====================
      メッセージを購読
    ===================== */
    useEffect(() => {
        if (!activeConv) {
            setMessages([]);
            return;
        }

        const unsub = listenMessages(activeConv.id, (list) => {
            setMessages(list);
        });

        return () => unsub();
    }, [activeConv]);

    /* =====================
      メッセージ送信
    ===================== */
    const handleSend = async () => {
        if (!uid || !activeConv || !text.trim()) return;

        try {
            await sendMessage({
                conversationId: activeConv.id,
                sender: uid,
                text,
            });
            setText("");
        } catch (e) {
            console.error(e);
            alert("送信に失敗しました");
        }
    };

    /* =====================
      UI
    ===================== */
    return (
        <div className={styles.container}>
            {/* 左：会話一覧 */}
            <div className={styles.sidebar}>
                {conversations.length === 0 && (
                    <div className={styles.empty}>まだ会話がありません</div>
                )}

                {conversations.map((c) => (
                    <div
                        key={c.id}
                        className={`${styles.thread} ${activeConv?.id === c.id ? styles.active : ""
                            }`}
                        onClick={() => setActiveConv(c)}
                    >
                        <div className={styles.threadTitle}>
                            生徒UID: {c.members.find((m) => m !== uid)}
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                            {c.lastMessage ?? ""}
                        </div>
                    </div>
                ))}
            </div>

            {/* 右：メッセージ */}
            <div className={styles.main}>
                <div className={styles.messages}>
                    {!activeConv ? (
                        <div className={styles.empty}>会話を選択してください</div>
                    ) : (
                        messages.map((m) => (
                            <div
                                key={m.id}
                                className={`${styles.message} ${m.sender === uid ? styles.mine : styles.other
                                    }`}
                            >
                                {m.text}
                            </div>
                        ))
                    )}
                </div>

                {/* 入力欄 */}
                {activeConv && (
                    <div className={styles.inputArea}>
                        <input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="メッセージを入力"
                        />
                        <button onClick={handleSend}>送信</button>
                    </div>
                )}
            </div>
        </div>
    );
}
