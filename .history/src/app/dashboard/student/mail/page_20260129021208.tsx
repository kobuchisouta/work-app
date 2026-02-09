"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./email.module.css";

import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";

import {
    ensureConversation,
    listenMessages,
    listenMyConversations,
    makeConversationId,
    sendMessage,
    type ConversationDoc,
    type MessageDoc,
} from "@/app/lib/chat";

type UserLite = {
    uid: string;
    email?: string;
    displayName?: string;
    companyName?: string;
    role?: string;
};

type MsgRow = {
    id: string;
    data: MessageDoc;
};

export default function StudentMailPage() {
    const [uid, setUid] = useState<string>("");

    // タブ
    const folders = ["メッセージ", "受信トレイ", "送信済み", "すべて", "企業一覧"] as const;
    const [selectedFolder, setSelectedFolder] = useState<(typeof folders)[number]>("メッセージ");

    // 会話一覧（自分が参加）
    const [conversations, setConversations] = useState<{ id: string; data: ConversationDoc }[]>([]);
    const [selectedConversationId, setSelectedConversationId] = useState<string>("");

    // 企業一覧（新規会話開始用）
    const [companies, setCompanies] = useState<UserLite[]>([]);
    const [companiesLoading, setCompaniesLoading] = useState(false);

    // 相手情報（会話相手の users/{uid} を読む）
    const [peerMap, setPeerMap] = useState<Record<string, UserLite>>({});

    // メッセージ
    const [messages, setMessages] = useState<MsgRow[]>([]);
    const [selectedMessageId, setSelectedMessageId] = useState<string>("");

    // 送信
    const [text, setText] = useState("");
    const [sendError, setSendError] = useState("");

    // ログインUID
    useEffect(() => {
        return onAuthStateChanged(auth, (u) => {
            setUid(u?.uid ?? "");
        });
    }, []);

    // 自分の会話を監視
    useEffect(() => {
        if (!uid) return;

        const unsub = listenMyConversations(
            uid,
            (items) => {
                setConversations(items);
                // 初回は先頭を選ぶ（何も選んでない場合）
                if (!selectedConversationId && items.length > 0) {
                    setSelectedConversationId(items[0].id);
                }
            },
            (e) => console.error(e)
        );

        return unsub;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid]);

    // 会話相手の情報をまとめて取得（簡易：必要になったら取る）
    useEffect(() => {
        if (!uid) return;

        (async () => {
            const next: Record<string, UserLite> = { ...peerMap };

            for (const c of conversations) {
                const otherUid = (c.data.members ?? []).find((m) => m !== uid);
                if (!otherUid) continue;
                if (next[otherUid]) continue;

                try {
                    const snap = await getDoc(doc(db, "users", otherUid));
                    const data = snap.data() as any;
                    next[otherUid] = {
                        uid: otherUid,
                        email: data?.email,
                        displayName: data?.displayName,
                        companyName: data?.companyName,
                        role: data?.role,
                    };
                } catch (e) {
                    // ここで落ちてもUIは動かす
                    next[otherUid] = { uid: otherUid };
                }
            }

            setPeerMap(next);
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid, conversations]);

    // 選択中会話の messages を監視
    useEffect(() => {
        if (!selectedConversationId) {
            setMessages([]);
            setSelectedMessageId("");
            return;
        }

        const unsub = listenMessages(
            selectedConversationId,
            (msgs) => {
                setMessages(msgs);
                // 自動で最新を選ぶ（何も選んでなければ）
                if (!selectedMessageId && msgs.length > 0) {
                    setSelectedMessageId(msgs[msgs.length - 1].id);
                }
            },
            (e) => console.error(e)
        );

        return unsub;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConversationId]);

    // 企業一覧取得（タブを開いたときだけ）
    useEffect(() => {
        if (!uid) return;
        if (selectedFolder !== "企業一覧") return;

        (async () => {
            try {
                setCompaniesLoading(true);

                // role==company だけ（orderByしない＝複合index回避）
                const q = query(collection(db, "users"), where("role", "==", "company"));
                const snap = await getDocs(q);

                const list = snap.docs.map((d) => {
                    const data = d.data() as any;
                    return {
                        uid: d.id,
                        email: data?.email,
                        displayName: data?.displayName,
                        companyName: data?.companyName,
                        role: data?.role,
                    } as UserLite;
                });

                setCompanies(list);
            } catch (e) {
                console.error(e);
                setCompanies([]);
            } finally {
                setCompaniesLoading(false);
            }
        })();
    }, [uid, selectedFolder]);

    const selectedConversation = useMemo(() => {
        return conversations.find((c) => c.id === selectedConversationId) ?? null;
    }, [conversations, selectedConversationId]);

    const peer = useMemo(() => {
        if (!selectedConversation || !uid) return null;
        const otherUid = (selectedConversation.data.members ?? []).find((m) => m !== uid);
        if (!otherUid) return null;
        return peerMap[otherUid] ?? { uid: otherUid };
    }, [selectedConversation, uid, peerMap]);

    // フォルダ（受信/送信/すべて）で message list をフィルタ
    const filteredMessages = useMemo(() => {
        if (!uid) return [];
        if (selectedFolder === "受信トレイ") {
            return messages.filter((m) => m.data.senderUid !== uid);
        }
        if (selectedFolder === "送信済み") {
            return messages.filter((m) => m.data.senderUid === uid);
        }
        if (selectedFolder === "すべて" || selectedFolder === "メッセージ") {
            return messages;
        }
        // 企業一覧タブではメッセージ一覧は出さない
        return [];
    }, [messages, selectedFolder, uid]);

    const selectedMessage = useMemo(() => {
        return filteredMessages.find((m) => m.id === selectedMessageId) ?? null;
    }, [filteredMessages, selectedMessageId]);

    const handleFolderChange = (folder: (typeof folders)[number]) => {
        setSelectedFolder(folder);
        setSelectedMessageId("");
        setSendError("");
    };

    // 企業一覧で企業をクリック → 会話を作ってメッセージタブへ
    const openConversationWithCompany = async (companyUid: string) => {
        if (!uid) return;

        const cid = makeConversationId(uid, companyUid);
        await ensureConversation(cid, [uid, companyUid]);

        setSelectedConversationId(cid);
        setSelectedFolder("メッセージ");
        setSelectedMessageId("");
    };

    // 送信
    const handleSend = async () => {
        if (!uid) return;
        if (!selectedConversationId) {
            setSendError("送信先（会話）を選択してください");
            return;
        }
        if (!text.trim()) return;

        try {
            setSendError("");
            await sendMessage({
                conversationId: selectedConversationId,
                senderUid: uid,
                text: text.trim(),
            });
            setText("");
        } catch (e: any) {
            console.error(e);
            setSendError(e?.message ?? "送信に失敗しました");
        }
    };

    // UI
    return (
        <div className={styles.container}>
            {/* 上のタブ（今のUIに合わせて folder を並べる） */}
            <div className={styles.topTabs}>
                {folders.map((f) => (
                    <button
                        key={f}
                        type="button"
                        className={`${styles.tab} ${selectedFolder === f ? styles.activeTab : ""}`}
                        onClick={() => handleFolderChange(f)}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* 左：会話（企業）リスト */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarTitle}>企業</div>

                {conversations.length === 0 ? (
                    <p className={styles.emptyText}>まだ会話がありません</p>
                ) : (
                    <ul className={styles.convList}>
                        {conversations.map((c) => {
                            const otherUid = (c.data.members ?? []).find((m) => m !== uid);
                            const p = otherUid ? peerMap[otherUid] : null;

                            const label =
                                p?.companyName ||
                                p?.displayName ||
                                p?.email ||
                                (otherUid ? `企業（${otherUid.slice(0, 6)}...）` : "企業（不明）");

                            return (
                                <li key={c.id}>
                                    <button
                                        type="button"
                                        className={`${styles.convItem} ${selectedConversationId === c.id ? styles.selectedConv : ""}`}
                                        onClick={() => {
                                            setSelectedConversationId(c.id);
                                            setSelectedMessageId("");
                                            setSendError("");
                                        }}
                                    >
                                        <div className={styles.convName}>{label}</div>
                                        <div className={styles.convPreview}>{c.data.lastMessage || "（メッセージなし）"}</div>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* 中央：メッセージ一覧 or 企業一覧 */}
            <div className={styles.main}>
                <div className={styles.emailList}>
                    {selectedFolder === "企業一覧" ? (
                        <>
                            <div className={styles.sectionTitle}>企業一覧</div>
                            {companiesLoading ? (
                                <p className={styles.emptyText}>読み込み中...</p>
                            ) : companies.length === 0 ? (
                                <p className={styles.emptyText}>企業が見つかりません</p>
                            ) : (
                                companies.map((c) => (
                                    <div
                                        key={c.uid}
                                        className={styles.emailItem}
                                        onClick={() => openConversationWithCompany(c.uid)}
                                        onKeyUp={(e) => e.key === "Enter" && openConversationWithCompany(c.uid)}
                                    >
                                        <h3>{c.companyName || c.displayName || "（企業名未登録）"}</h3>
                                        <p className={styles.sender}>{c.email || "（メール未登録）"}</p>
                                        <p className={styles.preview}>クリックで会話を開始</p>
                                    </div>
                                ))
                            )}
                        </>
                    ) : !selectedConversationId ? (
                        <p className={styles.emptyText}>左から企業（会話）を選択してください</p>
                    ) : filteredMessages.length === 0 ? (
                        <p className={styles.emptyText}>メッセージがありません</p>
                    ) : (
                        filteredMessages.map((m) => {
                            const isMine = m.data.senderUid === uid;
                            const preview = m.data.text?.slice(0, 60) ?? "";

                            return (
                                <div
                                    key={m.id}
                                    className={`${styles.emailItem} ${selectedMessageId === m.id ? styles.selected : ""}`}
                                    onClick={() => setSelectedMessageId(m.id)}
                                    onKeyUp={(e) => e.key === "Enter" && setSelectedMessageId(m.id)}
                                >
                                    <h3>{isMine ? "送信" : "受信"}</h3>
                                    <p className={styles.sender}>{isMine ? "あなた" : peer?.companyName || "企業"}</p>
                                    <p className={styles.preview}>{preview}</p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 右：詳細＆送信 */}
            <div className={styles.emailDetails}>
                <div className={styles.detailHeader}>
                    <h2>
                        {peer?.companyName || peer?.displayName || peer?.email || "企業（------）"}
                    </h2>
                    <p className={styles.detailSub}>
                        {selectedFolder === "受信トレイ"
                            ? "受信トレイ"
                            : selectedFolder === "送信済み"
                                ? "送信済み"
                                : selectedFolder === "すべて"
                                    ? "すべて"
                                    : "メッセージ"}
                    </p>
                </div>

                {/* 詳細本文 */}
                {selectedFolder === "企業一覧" ? (
                    <p className={styles.noSelection}>企業をクリックして会話を開始してください</p>
                ) : selectedMessage ? (
                    <>
                        <div className={styles.messageBody}>
                            <p className={styles.sender}>
                                送信者: {selectedMessage.data.senderUid === uid ? "あなた" : peer?.companyName || "企業"}
                            </p>
                            <p className={styles.messageText}>{selectedMessage.data.text}</p>
                        </div>
                    </>
                ) : (
                    <p className={styles.noSelection}>表示するメッセージを選択してください</p>
                )}

                {/* 送信欄（会話が選ばれてる時だけ） */}
                {selectedFolder !== "企業一覧" && (
                    <div className={styles.composer}>
                        {sendError && <p className={styles.errorText}>{sendError}</p>}
                        <textarea
                            className={styles.textarea}
                            placeholder="企業へメッセージを送る…"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        <button className={styles.sendBtn} type="button" onClick={handleSend}>
                            送信
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
