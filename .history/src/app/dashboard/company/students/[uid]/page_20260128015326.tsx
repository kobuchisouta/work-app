"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

import { db } from "@/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

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
    ResponsiveContainer,
} from "recharts";

type ProfileDoc = {
    headerTitle?: string;
    headerSubtitle?: string;
    aboutText?: string;
    skills?: string[];
    contact?: { email?: string; github?: string };
    portfolioItems?: { id: number; title: string; description: string }[];
};

type UserDoc = {
    email?: string;
    displayName?: string;
    schoolName?: string;
};

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

function weekKey(d: Date) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Monday start
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
}

export default function CompanyStudentPortfolioPage({
    params,
}: {
    params: Promise<{ uid: string }>;
}) {
    const { uid } = React.use(params);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [profile, setProfile] = useState<ProfileDoc | null>(null);
    const [userInfo, setUserInfo] = useState<UserDoc | null>(null);

    const [learningLoading, setLearningLoading] = useState(true);
    const [learningError, setLearningError] = useState("");
    const [watched, setWatched] = useState<WatchedDoc[]>([]);

    // ① 生徒の基本情報(users/{uid}) + プロフィール(profiles/{uid})
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setError("");

                const userSnap = await getDoc(doc(db, "users", uid));
                setUserInfo((userSnap.data() as UserDoc) ?? null);

                const profileSnap = await getDoc(doc(db, "profiles"));
                setProfile((profileSnap.data() as ProfileDoc) ?? null);
            } catch (e: any) {
                console.error(e);
                setError(e?.message ?? "読み込みに失敗しました");
            } finally {
                setLoading(false);
            }
        })();
    }, [uid]);

    // ② 学習ログ(users/{uid}/watchedVideos)
    useEffect(() => {
        (async () => {
            try {
                setLearningLoading(true);
                setLearningError("");

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

    // ③ グラフ集計
    const { skillPie, progressPie, weeklySeries, totalMinutes, totalVideos } = useMemo(() => {
        const skillCount = new Map<string, number>();
        let completed = 0;
        let inProgress = 0;

        const weekly = new Map<string, { videos: number; minutes: number }>();

        let minutesSum = 0;
        let videosSum = 0;

        for (const d of watched) {
            videosSum += 1;

            const tags = d.skillTags ?? [];
            for (const t of tags) {
                skillCount.set(t, (skillCount.get(t) ?? 0) + 1);
            }

            const p = d.progress ?? 0;
            if (p >= 0.99) completed += 1;
            else inProgress += 1;

            const mins = Math.round(((d.durationSec ?? 0) as number) / 60);
            minutesSum += mins;

            const dt = toDate(d.lastWatchedAt);
            if (dt) {
                const wk = weekKey(dt);
                const prev = weekly.get(wk) ?? { videos: 0, minutes: 0 };
                weekly.set(wk, { videos: prev.videos + 1, minutes: prev.minutes + mins });
            }
        }

        const skillPie = Array.from(skillCount.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([name, value]) => ({ name, value }));

        const progressPie = [
            { name: "完了", value: completed },
            { name: "途中", value: inProgress },
        ];

        const weeklySeries = Array.from(weekly.entries())
            .sort(([a], [b]) => (a < b ? -1 : 1))
            .map(([week, v]) => ({ week, videos: v.videos, minutes: v.minutes }));

        return {
            skillPie,
            progressPie,
            weeklySeries,
            totalMinutes: minutesSum,
            totalVideos: videosSum,
        };
    }, [watched]);

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.skeleton} />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.page}>
                <div className={styles.errorBox}>
                    <p className={styles.errorTitle}>読み込みに失敗しました</p>
                    <p className={styles.errorText}>{error}</p>
                    <Link href="/dashboard/company/students" className={styles.linkBtn}>
                        生徒一覧へ戻る
                    </Link>
                </div>
            </div>
        );
    }

    const displayName = userInfo?.displayName || "（名前未登録）";
    const schoolName = userInfo?.schoolName || "（未登録）";
    const email = userInfo?.email || profile?.contact?.email || "（未登録）";

    return (
        <div className={styles.page}>
            {/* 上部ヘッダー */}
            <div className={styles.topBar}>
                <Link href="/dashboard/company/students" className={styles.backLink}>
                    ← 生徒一覧へ戻る
                </Link>
            </div>

            <header className={styles.hero}>
                <div className={styles.heroInner}>
                    <div>
                        <p className={styles.kicker}>Student Portfolio</p>
                        <h1 className={styles.heroTitle}>{displayName} のポートフォリオ</h1>
                        <div className={styles.metaRow}>
                            <span className={styles.badge}>学校: {schoolName}</span>
                            <span className={styles.badge}>メール: {email}</span>
                        </div>
                        {profile?.headerSubtitle && <p className={styles.heroSub}>{profile.headerSubtitle}</p>}
                    </div>

                    <div className={styles.statsBox}>
                        <div className={styles.stat}>
                            <p className={styles.statLabel}>学習動画</p>
                            <p className={styles.statValue}>{totalVideos} 本</p>
                        </div>
                        <div className={styles.stat}>
                            <p className={styles.statLabel}>学習時間</p>
                            <p className={styles.statValue}>{totalMinutes} 分</p>
                        </div>
                        <div className={styles.stat}>
                            <p className={styles.statLabel}>UID</p>
                            <p className={styles.statMono}>{uid}</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className={styles.container}>
                {/* 1) 自己紹介 */}
                <section className={styles.card}>
                    <div className={styles.cardHead}>
                        <h2 className={styles.cardTitle}>自己紹介</h2>
                    </div>
                    <p className={styles.bodyText}>{profile?.aboutText ?? "自己紹介がまだありません。"}</p>
                </section>

                {/* 2) スキル */}
                <section className={styles.card}>
                    <div className={styles.cardHead}>
                        <h2 className={styles.cardTitle}>スキル</h2>
                    </div>

                    {profile?.skills?.length ? (
                        <div className={styles.chipGrid}>
                            {profile.skills.map((s, i) => (
                                <span key={i} className={styles.chip}>
                                    {s}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className={styles.muted}>スキルがまだ登録されていません。</p>
                    )}
                </section>

                {/* 3) 成果物 */}
                <section className={styles.card}>
                    <div className={styles.cardHead}>
                        <h2 className={styles.cardTitle}>成果物</h2>
                        <span className={styles.cardHint}>ポートフォリオ項目</span>
                    </div>

                    {profile?.portfolioItems?.length ? (
                        <div className={styles.workGrid}>
                            {profile.portfolioItems.map((item) => (
                                <div key={item.id} className={styles.workCard}>
                                    <h3 className={styles.workTitle}>{item.title}</h3>
                                    <p className={styles.workDesc}>{item.description}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={styles.muted}>成果物がまだ登録されていません。</p>
                    )}
                </section>

                {/* 4) 学習ダッシュボード（企業側でも表示） */}
                <section className={styles.card}>
                    <div className={styles.cardHead}>
                        <h2 className={styles.cardTitle}>学習ダッシュボード</h2>
                        <span className={styles.cardHint}>スキル比率 / 進捗 / 週ごと</span>
                    </div>

                    {learningLoading ? (
                        <p className={styles.muted}>学習データ読み込み中...</p>
                    ) : learningError ? (
                        <p className={styles.errorInline}>{learningError}</p>
                    ) : watched.length === 0 ? (
                        <p className={styles.muted}>まだ学習履歴がありません。</p>
                    ) : (
                        <>
                            <div className={styles.grid2}>
                                <div className={styles.chartCard}>
                                    <h3 className={styles.chartTitle}>スキル比率</h3>
                                    <div className={styles.chartBox}>
                                        <ResponsiveContainer width="100%" height={260}>
                                            <PieChart>
                                                <Pie data={skillPie} dataKey="value" nameKey="name" outerRadius={90} />
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className={styles.chartCard}>
                                    <h3 className={styles.chartTitle}>学習進捗（完了 / 途中）</h3>
                                    <div className={styles.chartBox}>
                                        <ResponsiveContainer width="100%" height={260}>
                                            <PieChart>
                                                <Pie data={progressPie} dataKey="value" nameKey="name" outerRadius={90} />
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.chartCard} style={{ marginTop: 14 }}>
                                <h3 className={styles.chartTitle}>週ごとの学習量（本数 / 分）</h3>
                                <div className={styles.chartBox}>
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart data={weeklySeries}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="week" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="videos" name="本数" />
                                            <Bar dataKey="minutes" name="学習分" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    )}
                </section>

                {/* 5) 連絡（まず表示だけ） */}
                <section className={styles.card}>
                    <div className={styles.cardHead}>
                        <h2 className={styles.cardTitle}>連絡</h2>
                        <span className={styles.cardHint}>次に「アプリ内メール」へつなげます</span>
                    </div>

                    <div className={styles.contactRow}>
                        <div className={styles.contactItem}>
                            <p className={styles.contactLabel}>メール</p>
                            <p className={styles.contactValue}>{email}</p>
                        </div>

                        <div className={styles.contactItem}>
                            <p className={styles.contactLabel}>GitHub</p>
                            <p className={styles.contactValue}>
                                {profile?.contact?.github ? (
                                    <a className={styles.anchor} href={profile.contact.github} target="_blank" rel="noreferrer">
                                        {profile.contact.github}
                                    </a>
                                ) : (
                                    "（未登録）"
                                )}
                            </p>
                        </div>
                    </div>

                    <div className={styles.noteBox}>
                        <p className={styles.noteTitle}>次にやること</p>
                        <p className={styles.noteText}>
                            「企業→生徒へ連絡」ボタンをここに置いて、Firestoreにメッセージを保存する形にすると綺麗に作れます。
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}
