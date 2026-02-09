"use client";

import { useEffect, useState } from "react";
import styles from "./profile.module.css";

import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState("");

    // デフォルト値
    const defaultHeaderTitle = "プロフィール";
    const defaultHeaderSubtitle = "自己紹介とポートフォリオをご覧ください。";
    const defaultPortfolioItems = [
        {
            id: 1,
            title: "プロジェクト: 農業支援アプリ",
            description:
                "農業支援アプリを開発中。React と Firebase を使用して、ユーザーが農業に関する質問を投稿し、回答を得ることができるプラットフォームです。",
        },
        {
            id: 2,
            title: "動画視聴: React.js でのフロントエンド開発",
            description:
                "React.js の基本を学ぶために視聴した動画。コンポーネントの作成方法や、状態管理の仕組みについて理解しました。",
        },
    ];
    const defaultAboutText =
        "こんにちは！ ECCコンピュータ専門学校 Webデザインコース 小淵 颯太 です。プログラミングやテクノロジーに興味を持ち、フロントエンドとバックエンドの開発に力を入れています。将来的には、より多くの人々に役立つサービスを提供できるよう努力しています。";
    const defaultSkills = [
        "React.js / Next.js",
        "Node.js / Express",
        "Firebase",
        "JavaScript / TypeScript",
    ];
    const defaultContact = {
        email: "example@example.com",
        github: "https://github.com/kobuchisouta",
    };

    // 状態
    const [headerTitle, setHeaderTitle] = useState(defaultHeaderTitle);
    const [headerSubtitle, setHeaderSubtitle] = useState(defaultHeaderSubtitle);
    const [portfolioItems, setPortfolioItems] = useState(defaultPortfolioItems);
    const [aboutText, setAboutText] = useState(defaultAboutText);
    const [skills, setSkills] = useState(defaultSkills);
    const [contact, setContact] = useState(defaultContact);

    const [uid, setUid] = useState<string | null>(null);

    // ① ログインユーザー取得 → Firestoreからプロフィール読み込み
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setUid(null);
                setLoading(false);
                return;
            }

            setUid(user.uid);

            try {
                const ref = doc(db, "profiles", user.uid);
                const snap = await getDoc(ref);

                if (snap.exists()) {
                    const data = snap.data();
                    setHeaderTitle(data.headerTitle ?? defaultHeaderTitle);
                    setHeaderSubtitle(data.headerSubtitle ?? defaultHeaderSubtitle);
                    setPortfolioItems(data.portfolioItems ?? defaultPortfolioItems);
                    setAboutText(data.aboutText ?? defaultAboutText);
                    setSkills(data.skills ?? defaultSkills);
                    setContact(data.contact ?? defaultContact);
                }
            } catch (e) {
                console.error(e);
                // Firestoreが死んでいる間でも表示は継続
            } finally {
                setLoading(false);
            }
        });

        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ② 保存（編集完了ボタンで保存する方式が事故が少ない）
    const saveToFirestore = async () => {
        if (!uid) return;

        setSaveStatus("保存中...");

        try {
            await setDoc(
                doc(db, "profiles", uid),
                {
                    headerTitle,
                    headerSubtitle,
                    portfolioItems,
                    aboutText,
                    skills,
                    contact,
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );

            setSaveStatus("保存しました ✅");
            setTimeout(() => setSaveStatus(""), 1500);
        } catch (e) {
            console.error(e);
            setSaveStatus("保存に失敗しました（Firestore接続を確認）");
        }
    };

    const toggleEdit = async () => {
        // 編集→完了に切り替える瞬間に保存
        if (isEditing) {
            await saveToFirestore();
        }
        setIsEditing(!isEditing);
    };

    if (loading) {
        return <div className={styles.container}>読み込み中...</div>;
    }

    return (
        <div className={styles.container}>
            {/* ヘッダー */}
            <header className={styles.header}>
                {isEditing ? (
                    <input
                        type="text"
                        value={headerTitle}
                        onChange={(e) => setHeaderTitle(e.target.value)}
                        className={styles.editInput}
                    />
                ) : (
                    <h1>{headerTitle}</h1>
                )}

                {isEditing ? (
                    <textarea
                        value={headerSubtitle}
                        onChange={(e) => setHeaderSubtitle(e.target.value)}
                        className={styles.editTextarea}
                    />
                ) : (
                    <p>{headerSubtitle}</p>
                )}
            </header>

            {/* ポートフォリオ */}
            <section className={styles.portfolio}>
                <h2>成果 &amp; プログラミングスキル</h2>
                <div className={styles.portfolioItems}>
                    {portfolioItems.map((item) => (
                        <div key={item.id} className={styles.portfolioItem}>
                            {isEditing ? (
                                <>
                                    <input
                                        type="text"
                                        value={item.title}
                                        onChange={(e) => {
                                            const newTitle = e.target.value;
                                            setPortfolioItems((items) =>
                                                items.map((it) =>
                                                    it.id === item.id ? { ...it, title: newTitle } : it
                                                )
                                            );
                                        }}
                                        className={styles.editInput}
                                    />
                                    <textarea
                                        value={item.description}
                                        onChange={(e) => {
                                            const newDescription = e.target.value;
                                            setPortfolioItems((items) =>
                                                items.map((it) =>
                                                    it.id === item.id
                                                        ? { ...it, description: newDescription }
                                                        : it
                                                )
                                            );
                                        }}
                                        className={styles.editTextarea}
                                    />
                                </>
                            ) : (
                                <>
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* 自己紹介 */}
            <section className={styles.about}>
                <h2>自己紹介</h2>
                {isEditing ? (
                    <textarea
                        value={aboutText}
                        onChange={(e) => setAboutText(e.target.value)}
                        className={styles.editTextarea}
                    />
                ) : (
                    <p>{aboutText}</p>
                )}
            </section>

            {/* スキル */}
            <section className={styles.skills}>
                <h2>スキル</h2>
                <ul>
                    {skills.map((skill, index) => (
                        <li key={index}>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={skill}
                                    onChange={(e) => {
                                        const newSkill = e.target.value;
                                        setSkills((prev) =>
                                            prev.map((s, i) => (i === index ? newSkill : s))
                                        );
                                    }}
                                    className={styles.editInput}
                                />
                            ) : (
                                skill
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            {/* コンタクト */}
            <section className={styles.contact}>
                <h2>コンタクト</h2>
                {isEditing ? (
                    <ul>
                        <li>
                            <input
                                type="email"
                                value={contact.email}
                                onChange={(e) =>
                                    setContact({ ...contact, email: e.target.value })
                                }
                                className={styles.editInput}
                            />
                        </li>
                        <li>
                            <input
                                type="text"
                                value={contact.github}
                                onChange={(e) =>
                                    setContact({ ...contact, github: e.target.value })
                                }
                                className={styles.editInput}
                            />
                        </li>
                    </ul>
                ) : (
                    <>
                        <p>ご質問やお問い合わせは、下記のリンクからどうぞ。</p>
                        <ul className={styles.contactList}>
                            <li>
                                <a
                                    href={`mailto:${contact.email}`}
                                    className={styles.contactLink}
                                >
                                    メールでお問い合わせ
                                </a>
                            </li>
                            <li>
                                <a
                                    href={contact.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.contactLink}
                                >
                                    GitHub
                                </a>
                            </li>
                        </ul>
                    </>
                )}
            </section>

            {/* 保存状況 */}
            {saveStatus && <p style={{ marginTop: 10 }}>{saveStatus}</p>}

            {/* 編集切替（完了時に保存） */}
            <button onClick={toggleEdit} className={styles.editButton}>
                {isEditing ? "編集完了（保存）" : "編集モード"}
            </button>
        </div>
    );
}
