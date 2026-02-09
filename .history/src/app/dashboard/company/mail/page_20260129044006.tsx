"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

import {
    listenMyConversations,
    listenMessages,
    sendMessage,
} from "@/app/lib/chat";

type Conversation = {
    id: string;
    members: string[];
    lastMessage?: string;
    updatedAt?: any;
};

type Message = {
    id: string;
    senderId: string;
    text: string;
    createdAt?: any;
};

export default function CompanyMailPage() {
    const [uid, setUid] = useState<string | null>(null);
    const [convList, setConvList] = useState<Conversation[]>([]);
    const [currentConv, setCurrentConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState("");

    // ログインユーザー取得
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUid(u?.uid ?? null);
        });
        return () => unsub();
    }, []);

    // 会話一覧
    useEffect(() => {
        if (!uid) return;

        const unsub = listenMyConversations(uid, (list) => {
            setConvList(list);
            if (!currentConv && list.length > 0) {
                setCurrentConv(list[0]);
            }
        });

        return () => unsub();
    }, [uid]);

    // メッセージ
    useEffect(() => {
        if (!currentConv) return;

        const unsub = listenMessages(currentConv.id, (msgs) => {
            setMessages(msgs);
        });

        return () => unsub();
    }, [currentConv]);

    const handleSend = async () => {
        if (!uid || !currentConv || !text.trim()) return;

        await sendMessage({
            conversationId: currentConv.id,
            senderId: uid,
            text,
        });

        setText("");
    };

    return (
        <div className={styles.container}>
            {/* 左：会話一覧 */}
            <div className={styles.sidebar}>
                {convList.map((c) => (
                    <div
                        key={c.id}
                        className={`${styles.thread} ${currentConv?.id === c.id ? styles.active : ""
                            }`}
                        onClick={() => setCurrentConv(c)}
                    >
                        <p className={styles.threadTitle}>
                            {c.lastMessage ?? "（メッセージなし）"}
                        </p>
                    </div>
                ))}
            </div>

            {/* 右：メッセージ */}
            <div className={styles.main}>
                {currentConv ? (
                    <>
                        <div className={styles.messages}>
                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={`${styles.message} ${m.senderId === uid ? styles.mine : styles.other
                                        }`}
                                >
                                    {m.text}
                                </div>
                            ))}
                        </div>

                        <div className={styles.inputArea}>
                            <input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="メッセージを入力"
                            />
                            <button onClick={handleSend}>送信</button>
                        </div>
                    </>
                ) : (
                    <p className={styles.empty}>会話を選択してください</p>
                )}
            </div>
        </div>
    );
}
