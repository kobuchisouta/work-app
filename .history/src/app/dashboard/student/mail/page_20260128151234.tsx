"use client";

import { useEffect, useState } from "react";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
} from "firebase/firestore";
import { db } from "@/firebase";

import {
    ensureConversation,
    makeConversationId,
    sendMessage,
} from "@/app/lib/chat";

import styles from "./email.module.css";

type Message = {
    senderUid: string;
    text: string;
    createdAt?: any;
};

export default function StudentMailPage() {
    const [uid, setUid] = useState<string | null>(null);
    const [companyUid, setCompanyUid] = useState(""); // 企業UID（今は手入力）
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState("");

    // ログイン取得
    useEffect(() => {
        return onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    }, []);

    const conversationId =
        uid && companyUid ? makeConversationId(uid, companyUid) : null;

    // メッセージ購読
    useEffect(() => {
        if (!conversationId) return;

        const q = query(
            collection(db, "conversations", conversationId, "messages"),
            orderBy("createdAt", "asc")
        );

        return onSnapshot(q, (snap) => {
            setMessages(snap.docs.map((d) => d.data() as Message));
        });
    }, [conversationId]);

    const handleSend = async () => {
        if (!uid || !companyUid || !text.trim()) return;

        const cid = makeConversationId(uid, companyUid);

        await ensureConversation(cid, [uid, companyUid]);

        await sendMessage({
            conversationId: cid,
            senderUid: uid,
            text,
        });

        setText("");
    };

    if (!uid) {
        return <div className={styles.container}>ログインしてください</div>;
    }

    return (
        <div className={styles.container}>
            <h1>企業とメッセージ</h1>

            {/* 仮：企業UID入力（後で一覧選択に変える） */}
            <input
                placeholder="企業UIDを入力"
                value={companyUid}
                onChange={(e) => setCompanyUid(e.target.value)}
                className={styles.input}
            />

            <div className={styles.chatBox}>
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={
                            m.senderUid === uid ? styles.myMessage : styles.otherMessage
                        }
                    >
                        {m.text}
                    </div>
                ))}
            </div>

            <div className={styles.sendBox}>
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="メッセージを入力"
                    className={styles.input}
                />
                <button onClick={handleSend}>送信</button>
            </div>
        </div>
    );
}
