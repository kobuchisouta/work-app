"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./email.module.css";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";

import { sendMessage } from "@/app/lib/chat";

type Conversation = {
    members: string[];
    lastMessage?: string;
    lastMessageAt?: any;
    memberRoles?: Record<string, "student" | "company">;
};

type Msg = {
    senderId: string;
    senderRole: "student" | "company";
    text: string;
    createdAt?: any;
};

type UserDoc = {
    displayName?: string;
    email?: string;
    schoolName?: string;
    role?: "student" | "company";
};

function tsToString(ts: any) {
    try {
        if (!ts?.seconds) return "";
        const d = new Date(ts.seconds * 1000);
        return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
            d.getDate()
        ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
            d.getMinutes()
        ).padStart(2, "0")}`;
    } catch {
        return "";
    }
}

export default function StudentMailPage() {
    const [myUid, setMyUid] = useState<string | null>(null);

    // 左：会話一覧
    const [conversations, setConversations] = useState<{ id: string; data: Conversation }[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string>("");

    // 企業名など表示したいので、会話相手（企業）の情報
    const [peer, setPeer] = useState<UserDoc | null>(null);
    const [peerUid, setPeerUid] = useState<string>("");

    // 中央：メッセージ一覧
    const [messages, setMessages] = useState<Msg[]>([]);
    const [selectedMsg, setSelectedMsg] = useState<Msg | null>(null);

    // 送信
    const [text, setText] = useState("");

    // ① auth
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setMyUid(u?.uid ?? null));
        return () => unsub();
    }, []);

    // ② 自分が入っている会話一覧
    useEffect(() => {
        if (!myUid) return;

        const q = query(
            collection(db, "conversations"),
            where("members", "array-contains", myUid),
            orderBy("lastMessageAt", "desc")
        );

        return onSnapshot(
            q,
            (snap) => {
                const list = snap.docs.map((d) => ({ id: d.id, data: d.data() as Conversation }));
                setConversations(list);

                // 初回は先頭を自動選択
                if (!selectedConvId && list.length > 0) {
                    setSelectedConvId(list[0].id);
                }
            },
            (e) => console.error(e)
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myUid]);

    // ③ 選択した会話の相手（企業）を取得
    useEffect(() => {
        (async () => {
            if (!myUid || !selectedConvId) return;

            const conv = conversations.find((c) => c.id === selectedConvId)?.data;
            if (!conv) return;

            const otherUid = conv.members.find((m) => m !== myUid) ?? "";
            setPeerUid(otherUid);

            if (!otherUid) {
                setPeer(null);
                return;
            }

            try {
                const snap = await getDoc(doc(db, "users", otherUid));
                setPeer((snap.data() as UserDoc) ?? null);
            } catch (e) {
                console.error(e);
                setPeer(null);
            }
        })();
    }, [myUid, selectedConvId, conversations]);

    // ④ メッセージ購読
    useEffect(() => {
        if (!selectedConvId) return;

        const q = query(
            collection(db, "conversations", selectedConvId, "messages"),
            orderBy("createdAt", "asc")
        );

        return onSnapshot(
            q,
            (snap) => {
                const list = snap.docs.map((d) => d.data() as Msg);
                setMessages(list);
                setSelectedMsg(null);
            },
            (e) => console.error(e)
        );
    }, [selectedConvId]);

    // ⑤ フォルダ（受信/送信）フィルタ
    const [selectedFolder, setSelectedFolder] = useState<"受信トレイ" | "送信済み" | "すべて">("受信トレイ");
    const folders = useMemo(() => ["受信トレイ", "送信済み", "すべて"] as const, []);

    const filteredMessages = useMemo(() => {
        if (!myUid) return [];

        if (selectedFolder === "すべて") return messages;
        if (selectedFolder === "受信トレイ") return messages.filter((m) => m.senderId !== myUid);
        return messages.filter((m) => m.senderId === myUid); // 送信済み
    }, [messages, myUid, selectedFolder]);

    // ⑥ 送信
    async function handleSend() {
        if (!myUid || !selectedConvId) return;
        const v = text.trim();
        if (!v) return;

        try {
            await sendMessage({
                conversationId: selectedConvId,
                senderId: myUid,
                senderRole: "student",
                text: v,
            });
            setText("");
        } catch (e) {
            console.error(e);
            alert("送信に失敗しました（Firestoreルール/通信を確認）");
        }
    }

    // 未ログイン
    if (!myUid) {
        return (
            <div className={styles.container} style={{ padding: 24 }}>
                <p>ログインしてください</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* 左：フォルダ（受信/送信/すべて）＋会話一覧 */}
            <div className={styles.sidebar}>
                <div style={{ padding: 12, borderBottom: "1px solid #eee", fontWeight: 700 }}>
                    メッセージ
                </div>

                <ul style={{ padding: 12, margin: 0, listStyle: "none", borderBottom: "1px solid #eee" }}>
                    {folders.map((folder) => (
                        <li
                            key={folder}
                            className={`${styles.folder} ${selectedFolder === folder ? styles.selectedFolder : ""}`}
                            onClick={() => setSelectedFolder(folder)}
                        >
                            {folder}
                        </li>
                    ))}
                </ul>

                <div style={{ padding: 12, fontSize: 12, opacity: 0.7 }}>企業一覧</div>
                <ul style={{ padding: 12, margin: 0, listStyle: "none" }}>
                    {conversations.map((c) => {
                        const active = c.id === selectedConvId;
                        return (
                            <li
                                key={c.id}
                                className={`${styles.folder} ${active ? styles.selectedFolder : ""}`}
                                onClick={() => setSelectedConvId(c.id)}
                            >
                                {c.data.lastMessage ? `💬 ${c.data.lastMessage.slice(0, 14)}...` : "（新規会話）"}
                            </li>
                        );
                    })}
                    {conversations.length === 0 && (
                        <li style={{ opacity: 0.7, fontSize: 12 }}>まだ会話がありません</li>
                    )}
                </ul>
            </div>

            {/* 中央：メッセージ一覧 */}
            <div className={styles.main}>
                <div className={styles.emailList}>
                    <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
                        <div style={{ fontWeight: 700 }}>
                            {peer?.displayName ? peer.displayName : "企業"}（{peerUid ? peerUid.slice(0, 6) : "----"}...）
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>{peer?.email ?? ""}</div>
                    </div>

                    {filteredMessages.map((m, idx) => {
                        const selected = selectedMsg === m;
                        const mine = m.senderId === myUid;
                        return (
                            <div
                                key={idx}
                                className={`${styles.emailItem} ${selected ? styles.selected : ""}`}
                                onClick={() => setSelectedMsg(m)}
                            >
                                <h3 style={{ margin: 0, fontSize: 14 }}>
                                    {mine ? "送信" : "受信"}：{m.text.slice(0, 20)}
                                </h3>
                                <p className={styles.sender} style={{ marginTop: 6 }}>
                                    {mine ? "あなた" : "企業"} / {tsToString(m.createdAt)}
                                </p>
                                <p className={styles.preview}>{m.text}</p>
                            </div>
                        );
                    })}

                    {filteredMessages.length === 0 && (
                        <p style={{ padding: 12, opacity: 0.7 }}>メッセージがありません</p>
                    )}
                </div>
            </div>

            {/* 右：詳細＋送信欄 */}
            <div className={styles.emailDetails}>
                {selectedMsg ? (
                    <>
                        <h2 style={{ marginTop: 0 }}>メッセージ</h2>
                        <p className={styles.sender}>
                            {selectedMsg.senderId === myUid ? "送信者: あなた" : "送信者: 企業"} / {tsToString(selectedMsg.createdAt)}
                        </p>
                        <p style={{ whiteSpace: "pre-wrap" }}>{selectedMsg.text}</p>
                    </>
                ) : (
                    <p className={styles.noSelection}>表示するメッセージを選択してください</p>
                )}

                {/* 送信欄 */}
                <div className={styles.composer}>
                    <textarea
                        className={styles.composerInput}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="企業へメッセージを送る…"
                    />
                    <button className={styles.composerBtn} onClick={handleSend}>
                        送信
                    </button>
                </div>
            </div>
        </div>
    );
}
