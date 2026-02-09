"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";
import {
    ensureConversation,
    fetchStudentsLite,
    listenConversations,
    listenMessages,
    sendMessage,
    type ConversationDoc,
    type MessageDoc,
} from "@/app/lib/chat";

// あなたのfirebase構成に合わせて import を調整してください
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

type TabKey = "message" | "inbox" | "sent" | "all" | "students";

type StudentLite = {
    uid: string;
    email: string;
    displayName: string;
    schoolName: string;
};

export default function CompanyMailPage() {
    const [uid, setUid] = useState<string>("");

    const [tab, setTab] = useState<TabKey>("message");

    const [convList, setConvList] = useState<Array<{ id: string; data: ConversationDoc }>>([]);
    const [selectedConvId, setSelectedConvId] = useState<string>("");

    const [messages, setMessages] = useState<Array<{ id: string; data: MessageDoc }>>([]);
    const [text, setText] = useState("");

    const [students, setStudents] = useState<StudentLite[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(false);

    const bottomRef = useRef<HTMLDivElement | null>(null);

    // auth uid
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            setUid(user?.uid ?? "");
        });
        return () => unsub();
    }, []);

    // conversations
    useEffect(() => {
        if (!uid) return;

        const unsub = listenConversations(
            uid,
            (list) => {
                setConvList(list);

                // 初回：選択がなければ先頭を選ぶ
                if (!selectedConvId && list.length) {
                    setSelectedConvId(list[0].id);
                }
            },
            (e) => console.error(e)
        );

        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid]);

    // messages
    useEffect(() => {
        if (!uid || !selectedConvId) {
            setMessages([]);
            return;
        }

        const unsub = listenMessages(
            selectedConvId,
            (list) => setMessages(list),
            (e) => console.error(e)
        );

        return () => unsub();
    }, [uid, selectedConvId]);

    // auto scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length, selectedConvId]);

    // students list for "students" tab
    useEffect(() => {
        if (!uid) return;
        if (tab !== "students") return;

        (async () => {
            try {
                setStudentsLoading(true);
                const list = await fetchStudentsLite();
                setStudents(list);
            } catch (e) {
                console.error(e);
            } finally {
                setStudentsLoading(false);
            }
        })();
    }, [uid, tab]);

    const filteredMessages = useMemo(() => {
        if (tab === "sent") return messages.filter((m) => m.data.senderId === uid);
        if (tab === "inbox") return messages.filter((m) => m.data.senderId !== uid);
        // message / all / students は全表示（studentsは会話未選択が多いのでall扱い）
        return messages;
    }, [messages, tab, uid]);

    const leftTitle = useMemo(() => {
        if (tab === "students") return "生徒一覧";
        return "会話一覧";
    }, [tab]);

    async function onPickStudent(s: StudentLite) {
        if (!uid) return;

        // 生徒を選んだら会話を作る（または既存）
        const { conversationId } = await ensureConversation({ uidA: uid, uidB: s.uid });
        setSelectedConvId(conversationId);
        setTab("message");
    }

    async function onSend() {
        const v = text.trim();
        if (!v) return;
        if (!uid || !selectedConvId) return;

        setText("");
        await sendMessage({
            conversationId: selectedConvId,
            senderId: uid,
            text: v,
        });
    }

    // 相手のuid（2人会話想定）
    const peerUid = useMemo(() => {
        const conv = convList.find((c) => c.id === selectedConvId);
        if (!conv) return "";
        const members = conv.data.members ?? [];
        return members.find((m) => m !== uid) ?? "";
    }, [convList, selectedConvId, uid]);

    return (
        <div className={styles.page}>
            {/* 上部タブ（画像のUIを意識） */}
            <div className={styles.topTabs}>
                <button
                    className={`${styles.tabBtn} ${tab === "message" ? styles.active : ""}`}
                    onClick={() => setTab("message")}
                    type="button"
                >
                    メッセージ
                </button>
                <button
                    className={`${styles.tabBtn} ${tab === "inbox" ? styles.active : ""}`}
                    onClick={() => setTab("inbox")}
                    type="button"
                >
                    受信トレイ
                </button>
                <button
                    className={`${styles.tabBtn} ${tab === "sent" ? styles.active : ""}`}
                    onClick={() => setTab("sent")}
                    type="button"
                >
                    送信済み
                </button>
                <button
                    className={`${styles.tabBtn} ${tab === "all" ? styles.active : ""}`}
                    onClick={() => setTab("all")}
                    type="button"
                >
                    すべて
                </button>

                <div className={styles.spacer} />

                <button
                    className={`${styles.tabBtn} ${tab === "students" ? styles.activeDark : styles.dark}`}
                    onClick={() => setTab("students")}
                    type="button"
                >
                    生徒一覧
                </button>
            </div>

            <div className={styles.body}>
                {/* 左：会話/生徒一覧 */}
                <aside className={styles.left}>
                    <div className={styles.leftHeader}>
                        <p className={styles.leftTitle}>{leftTitle}</p>
                    </div>

                    {tab === "students" ? (
                        <div className={styles.list}>
                            {studentsLoading ? (
                                <p className={styles.muted}>読み込み中...</p>
                            ) : students.length === 0 ? (
                                <p className={styles.muted}>生徒が見つかりません</p>
                            ) : (
                                students.map((s) => (
                                    <button
                                        key={s.uid}
                                        className={styles.listItem}
                                        type="button"
                                        onClick={() => onPickStudent(s)}
                                    >
                                        <p className={styles.name}>{s.displayName || "（名前未登録）"}</p>
                                        <p className={styles.sub}>{s.schoolName ? `学校: ${s.schoolName}` : "学校:（未登録）"}</p>
                                        <p className={styles.sub}>{s.email || s.uid}</p>
                                    </button>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {convList.length === 0 ? (
                                <p className={styles.muted}>まだ会話がありません</p>
                            ) : (
                                convList.map((c) => {
                                    const active = c.id === selectedConvId;
                                    const other = (c.data.members ?? []).find((m) => m !== uid) ?? "";
                                    return (
                                        <button
                                            key={c.id}
                                            className={`${styles.listItem} ${active ? styles.selected : ""}`}
                                            type="button"
                                            onClick={() => setSelectedConvId(c.id)}
                                        >
                                            <p className={styles.name}>相手UID: {other || "—"}</p>
                                            <p className={styles.sub}>{c.data.lastText ? c.data.lastText : "（メッセージなし）"}</p>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}
                </aside>

                {/* 右：メッセージ */}
                <section className={styles.right}>
                    <div className={styles.threadHeader}>
                        <p className={styles.threadTitle}>
                            {peerUid ? `相手: ${peerUid}` : "相手を選択してください"}
                        </p>
                    </div>

                    <div className={styles.thread}>
                        {selectedConvId ? (
                            filteredMessages.length === 0 ? (
                                <p className={styles.muted} style={{ padding: 18 }}>
                                    メッセージがありません
                                </p>
                            ) : (
                                <div className={styles.bubbles}>
                                    {filteredMessages.map((m) => {
                                        const mine = m.data.senderId === uid;
                                        return (
                                            <div key={m.id} className={`${styles.bubbleRow} ${mine ? styles.mineRow : ""}`}>
                                                <div className={`${styles.bubble} ${mine ? styles.mine : styles.theirs}`}>
                                                    <p className={styles.bubbleText}>{m.data.text}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={bottomRef} />
                                </div>
                            )
                        ) : (
                            <p className={styles.centerMuted}>表示する会話を選択してください</p>
                        )}
                    </div>

                    {/* 下：送信欄（UI維持） */}
                    <div className={styles.composer}>
                        <textarea
                            className={styles.textarea}
                            placeholder="生徒へメッセージを送る..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={!selectedConvId}
                        />
                        <button className={styles.sendBtn} type="button" onClick={onSend} disabled={!selectedConvId}>
                            送信
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
