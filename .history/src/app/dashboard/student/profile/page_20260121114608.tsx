"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./profile.module.css";

import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";

import {
    PieChart,
    Pie,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

type WatchedDoc = {
    title?: string;
    skillTags?: string[];
    durationSec?: number | null;
    progress?: number; // 0〜1
    lastWatchedAt?: { seconds: number; nanoseconds: number };
};

function toDate(ts?: { seconds: number; nanoseconds: number }) {
    if (!ts?.seconds) return null;
    return new Date(ts.seconds * 1000);
}

// 月曜始まりの週キー "YYYY-MM-DD"
function weekKey(d: Date) {
    const date = new Date(d);
    const day = date.getDay(); // 0 Sun ... 6 Sat
    const diff = (day === 0 ? -6 : 1) - day; // Monday start
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

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

    // ✅ 学習ログ（watchedVideos）用 state
    const [learningLoading, setLearningLoading] = useState(true);
    const [learningError, setLearningError] = useState("");
    const [watched, setWatched] = useState<WatchedDoc[]>([]);

    // ① ログインユーザー取得 → Firestoreからプロフィール読み込み
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setUid(null);
                setLoading(false);
                setLearningLoading(false);
                setWatched([]);
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
            } finally {
                setLoading(false);
            }
        });

        return () => unsub();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ✅ 1-2) 学習ログを取得（users/{uid}/watchedVideos）
    useEffect(() => {
        (async () => {
            if (!uid) return;

            try {
                setLearningError("");
                setLearningLoading(true);

                const snap = await getDocs(collection(db, "users", uid, "watchedVideos"));
                const list = snap.docs.map((d) => d.data() as WatchedDoc);
                setWatched(list);
            } catch (e: any) {
                console.error(e);
                setLearningError(e?.message ?? "学習データの取得に失敗しました");
            } finally {
                setLearningLoading(false);
            }
        })();
    }, [uid]);

    // ✅ 1-3) グラフ用に集計（スキル/進捗/週）
    const { skillPie, progressPie, weeklySeries } = useMemo(() => {
        const skillCount = new Map<string, number>([
            ["React", 0],
            ["Next", 0],
            ["Firebase", 0],
        ]);

        let completed = 0;
        let inProgress = 0;

        const weekly = new Map<string, { videos: number; minutes: number }>();

        for (const d of watched) {
            const tags = d.skillTags ?? [];
            for (const t of tags) {
                if (skillCount.has(t)) skillCount.set(t, (skillCount.get(t) ?? 0) + 1);
            }

            const p = d.progress ?? 0;
            if (p >= 0.99) completed += 1;
            else inProgress += 1;

            const dt = toDate(d.lastWatchedAt);
            if (dt) {
                const wk = weekKey(dt);
                const prev = weekly.get(wk) ?? { videos: 0, minutes: 0 };
                const minutes = Math.round(((d.durationSec ?? 0) as number) / 60);
                weekly.set(wk, {
                    videos: prev.videos + 1,
                    minutes: prev.minutes + minutes,
                });
            }
        }

        const skillPie = Array.from(skillCount.entries()).map(([name, value]) => ({
            name,
            value,
        }));

        const progressPie = [
            { name: "完了", value: completed },
            { name: "途中", value: inProgress },
        ];

        const weeklySeries = Array.from(weekly.entries())
            .sort(([a], [b]) => (a < b ? -1 : 1))
            .map(([week, v]) => ({ week, videos: v.videos, minutes: v.minutes }));

        return { skillPie, progressPie, weeklySeries };
    }, [watched]);

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

            {/* ✅ 追加：学習ダッシュボード（スキル/進捗/週） */}
            <section style={{ marginTop: 18 }}>
                <h2>学習ダッシュボード</h2>

                {!uid ? (
                    <p>ログインしてください</p>
                ) : learningLoading ? (
                    <p>学習データ読み込み中...</p>
                ) : learningError ? (
                    <p style={{ color: "red" }}>{learningError}</p>
                ) : (
                    <>
                        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 12 }}>
                            <div>
                                <h3>スキル比率（React / Next / Firebase）</h3>
                                <PieChart width={320} height={240}>
                                    <Pie
                                        data={skillPie}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        isAnimationActive={true}
                                    />
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </div>

                            <div>
                                <h3>学習進捗（完了 / 途中）</h3>
                                <PieChart width={320} height={240}>
                                    <Pie
                                        data={progressPie}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        isAnimationActive={true}
                                    />
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </div>
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <h3>週ごとの学習量（本数 / 分）</h3>

                            {weeklySeries.length === 0 ? (
                                <p>まだ学習履歴がありません（動画ページで途中/完了保存をしてください）</p>
                            ) : (
                                <BarChart width={700} height={280} data={weeklySeries}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="week" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="videos" name="本数" />
                                    <Bar dataKey="minutes" name="学習分" />
                                </BarChart>
                            )}
                        </div>
                    </>
                )}
            </section>

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
                                                items.map((it) => (it.id === item.id ? { ...it, title: newTitle } : it))
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
                                                    it.id === item.id ? { ...it, description: newDescription } : it
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
                                        setSkills((prev) => prev.map((s, i) => (i === index ? newSkill : s)));
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
                                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                                className={styles.editInput}
                            />
                        </li>
                        <li>
                            <input
                                type="text"
                                value={contact.github}
                                onChange={(e) => setContact({ ...contact, github: e.target.value })}
                                className={styles.editInput}
                            />
                        </li>
                    </ul>
                ) : (
                    <>
                        <p>ご質問やお問い合わせは、下記のリンクからどうぞ。</p>
                        <ul className={styles.contactList}>
                            <li>
                                <a href={`mailto:${contact.email}`} className={styles.contactLink}>
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
