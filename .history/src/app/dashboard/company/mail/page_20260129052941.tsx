"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where,
} from "firebase/firestore";

// --------------------
// 型
// --------------------
type Conv = {
    id: string;
    members: string[];
    companyUid: string;
    studentUid: string;
    lastMessage?: string;
    lastMessageAt?: any;
    createdAt?: any;
};

type Msg = {
    id: string;
    senderUid: string;
    text: string;
    createdAt?: any;
};

type StudentRow = {
    uid: string;
    email?: string;
    displayName?: string;
    schoolName?: string;
    role?: string;
};

// --------------------
// 企業メールページ
// --------------------
export default function CompanyMailPage() {
    const [uid, setUid] = useState<string | null>(null);

    // 左：会話一覧
    const [conversations, setConversations] = useState<Conv[]>([]);
    const [activeConvId, setActiveConvId] = useState<string>("");

    // 右：メッセージ一覧
    const [messages, setMessages] = useState<Msg[]>([]);
    const [messageText, setMessageText] = useState("");

    // 新規会話作成用（生徒一覧）
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [selectedStudentUid, setSelectedStudentUid] = useState<string>("");

    // 表示用
    const activeConv = useMemo(
        () => conversations.find((c) => c.id === activeConvId) ?? null,
        [conversations, activeConvId]
    );

    // 1) ログインUID
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
        return () => unsub();
    }, []);

    // 2) 企業が参加している会話一覧をリアルタイムで取得
    useEffect(() => {
        if (!uid) return;

        const q = query(
            collection(db, "conversations"),
            where("members", "array-contains", uid),
            orderBy("lastMessageAt", "desc")
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                const list: Conv[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
                setConversations(list);

                // 初回：何も選んでないなら先頭を自動選択
                if (!activeConvId && list.length > 0) {
                    setActiveConvId(list[0].id);
                }
            },
            (e) => {
                console.error(e);
            }
        );

        return () => unsub();
    }, [uid, activeConvId]);

    // 3) アクティブ会話のメッセージをリアルタイム取得
    useEffect(() => {
        if (!activeConvId) {
            setMessages([]);
            return;
        }

        const q = query(
            collection(db, "conversations", activeConvId, "messages"),
            orderBy("createdAt", "asc")
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                const list: Msg[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
                setMessages(list);
            },
            (e) => {
                console.error(e);
            }
        );

        return () => unsub();
    }, [activeConvId]);

    // 4) 新規会話作成：生徒一覧（role=student）を取得
    useEffect(() => {
        if (!uid) return;

        const q = query(collection(db, "users"), where("role", "==", "student"));

        const unsub = onSnapshot(
            q,
            (snap) => {
                const list: StudentRow[] = snap.docs.map((d) => ({
                    uid: d.id,
                    ...(d.data() as any),
                }));
                setStudents(list);
            },
            (e) => console.error(e)
        );

        return () => unsub();
    }, [uid]);

    // 5) 会話を作る（既存があればそれを開く）
    const startConversation = async () => {
        if (!uid) return;
        if (!selectedStudentUid) return;

        const companyUid = uid;
        const studentUid = selectedStudentUid;

        // convId を固定にすると「同じ相手なら同じ会話」にできます
        const convId = [companyUid, studentUid].sort().join("_");

        // 会話docを作成（無ければ）
        await setDoc(
            doc(db, "conversations", convId),
            {
                members: [companyUid, studentUid],
                companyUid,
                studentUid,
                createdAt: serverTimestamp(),
                lastMessage: "",
                lastMessageAt: serverTimestamp(),
            },
            { merge: true }
        );

        setActiveConvId(convId);
    };

    // 6) 送信
    const send = async () => {
        if (!uid) return;
        if (!activeConvId) return;
        const text = messageText.trim();
        if (!text) return;

        setMessageText("");

        // メッセージ追加
        await addDoc(collection(db, "conversations", activeConvId, "messages"), {
            senderUid: uid,
            text,
            createdAt: serverTimestamp(),
        });

        // 会話の最終メッセージ更新
        await setDoc(
            doc(db, "conversations", activeConvId),
            {
                lastMessage: text,
                lastMessageAt: serverTimestamp(),
            },
            { merge: true }
        );
    };

    if (!uid) {
        return <div className={styles.container}>ログインしてください</div>;
    }

    return (
        <div className={styles.container}>
            {/* 左：会話一覧 */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <p className={styles.sidebarTitle}>企業メール</p>

                    {/* 新規会話 */}
                    <div className={styles.newConvBox}>
                        <select
                            className={styles.select}
                            value={selectedStudentUid}
                            onChange={(e) => setSelectedStudentUid(e.target.value)}
                        >
                            <option value="">生徒を選択して新規会話</option>
                            {students.map((s) => (
                                <option key={s.uid} value={s.uid}>
                                    {s.displayName || s.email || s.uid}
                                </option>
                            ))}
                        </select>

                        <button className={styles.newConvBtn} onClick={startConversation}>
                            会話を作成
                        </button>
                    </div>
                </div>

                <div className={styles.emailList}>
                    {conversations.length === 0 ? (
                        <p className={styles.noSelection}>まだ会話がありません</p>
                    ) : (
                        conversations.map((c) => (
                            <div
                                key={c.id}
                                className={`${styles.emailItem} ${activeConvId === c.id ? styles.selected : ""}`}
                                onClick={() => setActiveConvId(c.id)}
                            >
                                <h3>生徒: {c.studentUid}</h3>
                                <p className={styles.preview}>{c.lastMessage || "（まだメッセージがありません）"}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 右：メッセージ詳細 */}
            <div className={styles.emailDetails}>
                {!activeConv ? (
                    <p className={styles.noSelection}>会話を選択してください</p>
                ) : (
                    <>
                        <div className={styles.detailHeader}>
                            <h2>会話: {activeConv.id}</h2>
                        </div>

                        <div className={styles.chatArea}>
                            {messages.length === 0 ? (
                                <p className={styles.noSelection}>まだメッセージがありません</p>
                            ) : (
                                messages.map((m) => (
                                    <div
                                        key={m.id}
                                        className={`${styles.chatBubble} ${m.senderUid === uid ? styles.me : styles.other}`}
                                    >
                                        <p className={styles.chatText}>{m.text}</p>
                                        <p className={styles.chatMeta}>{m.senderUid === uid ? "企業" : "生徒"}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className={styles.sendBox}>
                            <input
                                className={styles.sendInput}
                                placeholder="メッセージを入力..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") send();
                                }}
                            />
                            <button className={styles.sendBtn} onClick={send}>
                                送信
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
