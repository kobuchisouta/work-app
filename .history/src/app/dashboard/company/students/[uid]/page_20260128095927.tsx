// src/app/dashboard/company/students/[uid]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

type PortfolioItem = {
    id: number;
    title: string;
    description: string;
};

type ProfileDoc = {
    headerTitle?: string;
    headerSubtitle?: string;
    portfolioItems?: PortfolioItem[];
    aboutText?: string;
    skills?: string[];
    contact?: { email?: string; github?: string };
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
    videoId?: string;
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

export default function CompanyStudentPortfolioPage() {
    const params = useParams<{ uid: string }>();
    const uid = params?.uid;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [profile, setProfile] = useState<ProfileDoc | null>(null);
    const [userInfo, setUserInfo] = useState<UserDoc | null>(null);

    // 学習ログ
    const [learningLoading, setLearningLoading] = useState(true);
    const [learningError, setLearningError] = useState("");
    const [watched, setWatched] = useState<WatchedDoc[]>([]);

    useEffect(() => {
        if (!uid) return;

        (async () => {
            try {
                setError("");
                setLoading(true);

                // profiles/{uid}
                const profileSnap = await getDoc(doc(db, "profiles", uid));
                if (profileSnap.exists()) {
                    setProfile(profileSnap.data() as ProfileDoc);
                } else {
                    setProfile(null);
                }

                // users/{uid}
                const userSnap = await getDoc(doc(db, "users", uid));
                if (userSnap.exists()) {
                    setUserInfo(userSnap.data() as UserDoc);
                } else {
                    setUserInfo(null);
                }
            } catch (e: any) {
                console.error(e);
                setError(e?.message ?? "データ取得に失敗しました");
            } finally {
                setLoading(false);
            }
        })();
    }, [uid]);

    // users/{uid}/watchedVideos
    useEffect(() => {
        if (!uid) return;

        (async () => {
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

    const {
        totalVideos,
        totalMinutes,
        completedVideos,
        inProgressVideos,
        skillCounts,
        weeklySeries,
    } = useMemo(() => {
        const totalVideos = watched.length;

        const totalMinutes = watched.reduce((sum, v) => {
            const sec = v.durationSec ?? 0;
            return sum + Math.round(sec / 60);
        }, 0);

        const completedVideos = watched
            .filter((v) => (v.progress ?? 0) >= 0.99)
            .sort((a, b) => (b.lastWatchedAt?.seconds ?? 0) - (a.lastWatchedAt?.seconds ?? 0));

        const inProgressVideos = watched
            .filter((v) => (v.progress ?? 0) < 0.99)
            .sort((a, b) => (b.lastWatchedAt?.seconds ?? 0) - (a.lastWatchedAt?.seconds ?? 0));

        const skillCounts = new Map<string, number>();
        const weekly = new Map<string, { videos: number; minutes: number }>();

        for (const v of watched) {
            for (const t of v.skillTags ?? []) {
                skillCounts.set(t, (skillCounts.get(t) ?? 0) + 1);
            }

            const dt = toDate(v.lastWatchedAt);
            if (dt) {
                const wk = weekKey(dt);
                const prev = weekly.get(wk) ?? { videos: 0, minutes: 0 };
                const minutes = Math.round(((v.durationSec ?? 0) as number) / 60);
                weekly.set(wk, { videos: prev.videos + 1, minutes: prev.minutes + minutes });
            }
        }

        const weeklySeries = Array.from(weekly.entries())
            .sort(([a], [b]) => (a < b ? -1 : 1))
            .map(([week, v]) => ({ week, videos: v.videos, minutes: v.minutes }));

        return { totalVideos, totalMinutes, completedVideos, inProgressVideos, skillCounts, weeklySeries };
    }, [watched]);

    const headerTitle = profile?.headerTitle ?? "プロフィール";
    const headerSubtitle = profile?.headerSubtitle ?? "自己紹介とポートフォリオをご覧ください。";
    const aboutText = profile?.aboutText ?? "（自己紹介が未登録です）";
    const skills = profile?.skills ?? [];
    const portfolioItems = profile?.portfolioItems ?? [];

    const displayName = userInfo?.displayName ?? "（名前未登録）";
    const schoolName = userInfo?.schoolName ?? "（未登録）";
    const email = userInfo?.email ?? "（メール未登録）";

    if (loading) return <div style={{ padding: 24 }}>読み込み中...</div>;
    if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;

    return (
        <div
            style={{
                padding: 24,
                maxWidth: 1100,
                margin: "0 auto",
            }}
        >
            <div style={{ marginBottom: 10 }}>
                <Link href="/dashboard/company/students" style={{ textDecoration: "none", color: "#111" }}>
                    ← 生徒一覧へ戻る
                </Link>
            </div>

            {/* ヒーロー */}
            <section
                style={{
                    borderRadius: 18,
                    padding: 22,
                    background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(168,85,247,0.08))",
                    border: "1px solid rgba(15,23,42,0.08)",
                }}
            >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 18, alignItems: "stretch" }}>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.7 }}>STUDENT PORTFOLIO</div>
                        <h1 style={{ fontSize: 34, fontWeight: 900, marginTop: 6, lineHeight: 1.1 }}>
                            {displayName} のポートフォリオ
                        </h1>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                            <span
                                style={{
                                    padding: "6px 10px",
                                    borderRadius: 999,
                                    background: "rgba(15,23,42,0.06)",
                                    fontSize: 13,
                                }}
                            >
                                学校: {schoolName}
                            </span>
                            <span
                                style={{
                                    padding: "6px 10px",
                                    borderRadius: 999,
                                    background: "rgba(15,23,42,0.06)",
                                    fontSize: 13,
                                }}
                            >
                                メール: {email}
                            </span>
                        </div>

                        <p style={{ marginTop: 10, opacity: 0.75 }}>{headerSubtitle}</p>
                    </div>

                    {/* ステータスカード */}
                    <div
                        style={{
                            borderRadius: 16,
                            padding: 14,
                            background: "linear-gradient(180deg, #0f172a, #1e293b)",
                            color: "white",
                            boxShadow: "0 20px 40px rgba(2,6,23,0.25)",
                        }}
                    >
                        <div
                            style={{
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 14,
                                padding: 12,
                            }}
                        >
                            <div style={{ fontSize: 12, opacity: 0.75 }}>学習動画</div>
                            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{totalVideos} 本</div>
                        </div>

                        <div
                            style={{
                                marginTop: 10,
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 14,
                                padding: 12,
                            }}
                        >
                            <div style={{ fontSize: 12, opacity: 0.75 }}>学習時間</div>
                            <div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{totalMinutes} 分</div>
                        </div>

                        <div
                            style={{
                                marginTop: 10,
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                borderRadius: 14,
                                padding: 12,
                                overflow: "hidden",
                            }}
                        >
                            <div style={{ fontSize: 12, opacity: 0.75 }}>UID</div>
                            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.9, wordBreak: "break-all" }}>{uid}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 自己紹介 */}
            <section
                style={{
                    marginTop: 16,
                    background: "#fff",
                    border: "1px solid rgba(15,23,42,0.08)",
                    borderRadius: 16,
                    padding: 18,
                    boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
                }}
            >
                <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>自己紹介</h2>
                <div style={{ borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: 12, lineHeight: 1.8, opacity: 0.9 }}>
                    {aboutText}
                </div>
            </section>

            {/* スキル */}
            <section
                style={{
                    marginTop: 16,
                    background: "#fff",
                    border: "1px solid rgba(15,23,42,0.08)",
                    borderRadius: 16,
                    padding: 18,
                    boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
                }}
            >
                <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>スキル</h2>
                <div style={{ borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: 12 }}>
                    {skills.length === 0 ? (
                        <p style={{ opacity: 0.7 }}>（スキルが未登録です）</p>
                    ) : (
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {skills.map((s, idx) => (
                                <span
                                    key={idx}
                                    style={{
                                        padding: "8px 12px",
                                        borderRadius: 999,
                                        background: "rgba(59,130,246,0.10)",
                                        border: "1px solid rgba(59,130,246,0.18)",
                                        fontSize: 13,
                                        fontWeight: 700,
                                    }}
                                >
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ✅ 視聴状況（完了 / 途中） */}
            <section
                style={{
                    marginTop: 16,
                    background: "#fff",
                    border: "1px solid rgba(15,23,42,0.08)",
                    borderRadius: 16,
                    padding: 18,
                    boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
                }}
            >
                <h2 style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>学習履歴（動画）</h2>
                <div style={{ borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: 12 }}>
                    {learningLoading ? (
                        <p>学習履歴を読み込み中...</p>
                    ) : learningError ? (
                        <p style={{ color: "red" }}>{learningError}</p>
                    ) : watched.length === 0 ? (
                        <p style={{ opacity: 0.7 }}>まだ学習履歴がありません</p>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                            {/* 完了 */}
                            <div
                                style={{
                                    borderRadius: 14,
                                    padding: 14,
                                    border: "1px solid #e5e7eb",
                                    boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
                                    minWidth: 0,
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 900 }}> 視聴完了</h3>
                                    <span style={{ fontSize: 12, opacity: 0.7 }}>{completedVideos.length} 本</span>
                                </div>

                                {completedVideos.length === 0 ? (
                                    <p style={{ marginTop: 10, opacity: 0.7 }}>完了した動画はまだありません</p>
                                ) : (
                                    <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                                        {completedVideos.map((v) => (
                                            <li key={v.videoId ?? `${v.title}-${Math.random()}`} style={{ marginBottom: 10 }}>
                                                <div style={{ fontWeight: 800 }}>{v.title || v.videoId || "（タイトルなし）"}</div>
                                                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
                                                    {v.skillTags?.join(" / ") || "タグなし"}
                                                    {" · "}
                                                    {Math.round((v.progress ?? 0) * 100)}%
                                                    {v.lastWatchedAt ? ` · ${toDate(v.lastWatchedAt)?.toLocaleString()}` : ""}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* 途中 */}
                            <div
                                style={{
                                    borderRadius: 14,
                                    padding: 14,
                                    border: "1px solid #e5e7eb",
                                    boxShadow: "0 8px 20px rgba(15,23,42,0.04)",
                                    minWidth: 0,
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                    <h3 style={{ fontSize: 16, fontWeight: 900 }}>視聴途中</h3>
                                    <span style={{ fontSize: 12, opacity: 0.7 }}>{inProgressVideos.length} 本</span>
                                </div>

                                {inProgressVideos.length === 0 ? (
                                    <p style={{ marginTop: 10, opacity: 0.7 }}>途中の動画はありません</p>
                                ) : (
                                    <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                                        {inProgressVideos.map((v) => (
                                            <li key={v.videoId ?? `${v.title}-${Math.random()}`} style={{ marginBottom: 10 }}>
                                                <div style={{ fontWeight: 800 }}>{v.title || v.videoId || "（タイトルなし）"}</div>

                                                {/* 進捗バー */}
                                                <div style={{ marginTop: 6 }}>
                                                    <div style={{ height: 8, background: "#e5e7eb", borderRadius: 999 }}>
                                                        <div
                                                            style={{
                                                                height: 8,
                                                                width: `${Math.max(1, Math.round((v.progress ?? 0) * 100))}%`,
                                                                background: "#3b82f6",
                                                                borderRadius: 999,
                                                            }}
                                                        />
                                                    </div>
                                                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                                                        {v.skillTags?.join(" / ") || "タグなし"}
                                                        {" · "}
                                                        {Math.round((v.progress ?? 0) * 100)}%
                                                        {v.lastWatchedAt ? ` · ${toDate(v.lastWatchedAt)?.toLocaleString()}` : ""}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* 成果物 */}
            <section
                style={{
                    marginTop: 16,
                    background: "#fff",
                    border: "1px solid rgba(15,23,42,0.08)",
                    borderRadius: 16,
                    padding: 18,
                    boxShadow: "0 12px 30px rgba(15,23,42,0.05)",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h2 style={{ fontSize: 18, fontWeight: 900 }}>成果物</h2>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>ポートフォリオ項目</span>
                </div>

                <div style={{ borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: 12 }}>
                    {portfolioItems.length === 0 ? (
                        <p style={{ opacity: 0.7 }}>（成果物が未登録です）</p>
                    ) : (
                        <div style={{ display: "grid", gap: 12 }}>
                            {portfolioItems.map((it) => (
                                <div
                                    key={it.id}
                                    style={{
                                        borderRadius: 14,
                                        padding: 14,
                                        border: "1px solid rgba(15,23,42,0.08)",
                                        background: "rgba(15,23,42,0.02)",
                                    }}
                                >
                                    <div style={{ fontWeight: 900 }}>{it.title}</div>
                                    <div style={{ marginTop: 6, opacity: 0.85, lineHeight: 1.7 }}>{it.description}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* スキルタグ集計（簡易表示） */}
            <section style={{ marginTop: 16, paddingBottom: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 900, marginBottom: 10 }}>学習タグ（件数）</h2>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {Array.from(skillCounts.entries())
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 12)
                        .map(([tag, count]) => (
                            <span
                                key={tag}
                                style={{
                                    padding: "8px 10px",
                                    borderRadius: 999,
                                    background: "rgba(168,85,247,0.10)",
                                    border: "1px solid rgba(168,85,247,0.18)",
                                    fontSize: 13,
                                    fontWeight: 800,
                                }}
                            >
                                {tag}：{count}
                            </span>
                        ))}
                    {skillCounts.size === 0 && <span style={{ opacity: 0.7 }}>（まだタグがありません）</span>}
                </div>

                {/* 週ごとの学習量（テキスト表示だけ） */}
                <div style={{ marginTop: 14, opacity: 0.9 }}>
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>週ごとの学習量（本数 / 分）</div>
                    {weeklySeries.length === 0 ? (
                        <div style={{ opacity: 0.7 }}>（まだ週ごとのデータがありません）</div>
                    ) : (
                        <ul style={{ paddingLeft: 18 }}>
                            {weeklySeries.map((w) => (
                                <li key={w.week}>
                                    {w.week}：{w.videos} 本 / {w.minutes} 分
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
}
