"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./email.module.css";

import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

import {
    listenConversations,
    listenMessages,
    sendMessage,
    type ConversationDoc,
    type MessageDoc,
} from "@/app/lib/chat";

type UserDoc = {
    displayName?: string;
    email?: string;
    schoolName?: string;
    role?: "student" | "company";
};

type Tab = "メッセージ" | "受信トレイ" | "送信済み" | "すべて";

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

export default function CompanyMailPage() {
    const [myUid, setMyUid] = useState<string | null>(null);

    // タブ
    const tabs = useMemo<Tab[]>(
        () => ["メッセージ", "受信トレイ", "送信済み", "すべて"],
        []
    );
    const [activeTab, setActiveTab] = useState<Tab>("受信トレイ");

    // 会話
    const [conversations, setConversations] = useState<
        { id: string; data: ConversationDoc }[]
    >([]);
    const [selectedConvId, setSelectedConvId] = useState<string>("");

    // 相手（生徒）
    const [peerUid, setPeerUid] = useState<string>("");
    const [peer, setPeer] = useState<UserDoc | null>(null);

    // メッセージ
    const [messages, setMessages] = useState<MessageDoc[]>([]);
    const [selectedMsg, setSelectedMsg] = useState<MessageDoc | null>(null);

    // 送信
    const [text, setText] = useState("");

    // auth
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setMyUid(u?.uid ?? null));
        return () => unsub();
    }, []);

    // 自分が入ってる会話一覧
    useEffect(() => {
        if (!myUid) return;

        const unsub = listenConversations(
            myUid,
            (list) => {
                setConversations(list);
                if (!selectedConvId && list.length > 0) {
                    setSelectedConvId(list[0].id);
                }
            },
            (e) => console.error(e)
        );

        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myUid]);

    // 相手情報
    useEffect(() => {
        (async () => {
            if (!myUid || !selectedConvId) {
                setPeerUid("");
                setPeer(null);
                return;
            }

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

    // メッセージ購読
    useEffect(() => {
        if (!selectedConvId) {
            setMessages([]);
            setSelectedMsg(null);
            return;
        }

        const unsub = listenMessages(
            selectedConvId,
            (list) => {
                setMessages(list);
                setSelectedMsg(null);
            },
            (e) => console.error(e)
        );

        return () => unsub();
    }, [selectedConvId]);

    // タブフィルタ（受信/送信/すべて）
    const filteredMessages = useMemo(() => {
        if (!myUid) return [];
        if (activeTab === "すべて" || activeTab === "メッセージ") return messages;
        if (activeTab === "送信済み") return messages.filter((m) => m.senderId === myUid);
        return messages.filter((m) => m.senderId !== myUid); // 受信
    }, [messages, myUid, activeTab]);

    async function handleSend() {
        if (!myUid || !selectedConvId) return;
        const v = text.trim();
        if (!v) return;

        try {
            await sendMessage({
                conversationId: selectedConvId,
                senderId: myUid,
                senderRole: "company",
                text: v,
            });
            setText("");
            setActiveTab("すべて");
        } catch (e) {
            console.error(e);
            alert("送信に失敗しました（Firestoreルール/通信を確認）");
        }
    }

    if (!myUid) {
        return (
            <div className={styles.page} style={{ padding: 24 }}>
                <p>ログインしてください</p>
            </div>
        );
    }

    const headerName =
        peer?.displayName || peer?.email || (peerUid ? peerUid.slice(0, 6) : "") || "生徒";

    return (
        <div className={styles.page}>
            {/* 上：青いタブ（画像と同じ） */}
            <div className={styles.topTabs}>
                {tabs.map((t) => (
                    <button
                        key={t}
                        type="button"
                        className={`${styles.tab} ${activeTab === t ? styles.activeTab : ""}`}
                        onClick={() => setActiveTab(t)}
                    >
                        {t}
                    </button>
                ))}

                <div className={styles.topRightNote}>
                    {conversations.length === 0 ? "まだ会話がありません" : ""}
                </div>
            </div>

            {/* 本体（白い大枠） */}
            <div className={styles.paper}>
                {/* ヘッダー（企業/相手） */}
                <div className={styles.threadHeader}>
                    <div className={styles.threadTitle}>
                        {selectedConvId ? `${headerName}（……）` : "企業（……）"}
                    </div>
                </div>

                {/* メッセージ表示エリア */}
                <div className={styles.threadBody}>
                    {/* 上の線（画像の薄い区切り） */}
                    <div className={styles.hr} />

                    {!selectedConvId ? (
                        <p className={styles.emptyText}>メッセージがありません</p>
                    ) : filteredMessages.length === 0 ? (
                        <p className={styles.emptyText}>メッセージがありません</p>
                    ) : (
                        <div className={styles.msgList}>
                            {filteredMessages.map((m, idx) => {
                                const active = selectedMsg === m;
                                const mine = m.senderId === myUid;
                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={`${styles.msgRow} ${active ? styles.msgRowActive : ""}`}
                                        onClick={() => setSelectedMsg(m)}
                                    >
                                        <div className={styles.msgTop}>
                                            <span className={styles.msgFrom}>
                                                {mine ? "送信" : "受信"}
                                            </span>
                                            <span className={styles.msgTime}>{tsToString(m.createdAt)}</span>
                                        </div>
                                        <div className={styles.msgPreview}>{m.text}</div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* 画像の中央テキスト */}
                    <div className={styles.centerHint}>
                        表示するメッセージを選択してください
                    </div>
                </div>

                {/* 下：入力欄＋送信（画像の黒＋緑） */}
                <div className={styles.composerWrap}>
                    <div className={styles.hr} />

                    <textarea
                        className={styles.textarea}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="企業へメッセージを送る…"
                        disabled={!selectedConvId}
                    />

                    <button
                        className={styles.sendBtn}
                        onClick={handleSend}
                        disabled={!selectedConvId}
                    >
                        送信
                    </button>
                </div>
            </div>
        </div>
    );
}
