"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

import { useLearningStats, type WatchedDoc } from "@/app/lib/useLearningStats";

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

type ProfileDoc = {
    headerTitle?: string;
    headerSubtitle?: string;
    aboutText?: string;
    skills?: string[];
    contact?: {
        email?: string;
        github?: string;
    };
    portfolioItems?: { id: number; title: string; description: string }[];
};

type UserDoc = {
    email?: string;
    displayName?: string;
    schoolName?: string;
};

export default function CompanyStudentPortfolioPage({
    params,
}: {
    params: { uid: string };
}) {
    const uid = params.uid;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [profile, setProfile] = useState<ProfileDoc | null>(null);
    const [userInfo, setUserInfo] = useState<UserDoc | null>(null);

    // 学習ログ
    const [watched, setWatched] = useState<WatchedDoc[]>([]);
    const [learningLoading, setLearningLoading] = useState(true);
    const [learningError, setLearningError] = useState("");

    // ① profiles/{uid} と users/{uid} を読む
    useEffect(() => {
        (async () => {
            try {
                setError("");
                setLoading(true);

                // profiles
                const pSnap = await getDoc(doc(db, "profiles", uid));
                setProfile((pSnap.exists() ? (pSnap.data() as ProfileDoc) : null) ?? null);

                // users（生徒情報: email/displayName/schoolName など）
                const uSnap = await getDoc(doc(db, "users", uid));
                setUserInfo((uSnap.exists() ? (uSnap.data() as UserDoc) : null) ?? null);
            } catch (e: any) {
                console.error(e);
                setError(e?.message ?? "読み込みに失敗しました");
            } finally {
                setLoading(false);
            }
        })();
    }, [uid]);

    // ② users/{uid}/watchedVideos を読む
    useEffect(() => {
        (async () => {
            try {
                setLearningError("");
                setLearningLoading(true);

                const snap = await getDocs(collection(db, "users", uid, "watchedVideos"));
                setWatched(snap.docs.map((d) => d.data() as WatchedDoc));
            } catch (e: any) {
                console.error(e);
                setLearningError(e?.message ?? "学習データの取得に失敗しました");
            } finally {
                setLearningLoading(false);
            }
        })();
    }, [uid]);

    const { skillPie, progressPie, weeklySeries, completedList, inProgressList, totalMinutes } =
        useLearningStats(watched);

    if (loading) return <div>読み込み中...</div>;
    if (error) return <div style={{ color: "red" }}>{error}</div>;

    const displayName = userInfo?.displayName ?? "(名前未登録)";
    const schoolName = userInfo?.schoolName ?? "(未登録)";
    const email = userInfo?.email ?? "(未登録)";

    return (
        <div style={{ maxWidth: 980 }}>
            <div style={{ marginBottom: 16 }}>
                <Link href="/dashboard/company/students" style={{ textDecoration: "none" }}>
                    ← 生徒一覧へ戻る
                </Link>
            </div>

            <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 6 }}>
                {displayName} のポートフォリオ
            </h1>

            <div style={{ marginBottom: 18, opacity: 0.9, lineHeight: 1.8 }}>
                <div>学校: {schoolName}</div>
                <div>メール: {email}</div>
            </div>

            {/* ✅ 学習ダッシュボード */}
            <div style={{ marginTop: 16, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>学習ダッシュボード</h2>

                {learningLoading ? (
                    <p style={{ marginTop: 8 }}>読み込み中...</p>
                ) : learningError ? (
                    <p style={{ marginTop: 8, color: "red" }}>{learningError}</p>
                ) : (
                    <>
                        <p style={{ marginTop: 8, opacity: 0.8 }}>総学習時間（目安）: {totalMinutes} 分</p>

                        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 12 }}>
                            <div>
                                <h3 style={{ fontSize: 14, marginBottom: 6 }}>スキル比率</h3>
                                <PieChart width={320} height={240}>
                                    <Pie data={skillPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} />
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </div>

                            <div>
                                <h3 style={{ fontSize: 14, marginBottom: 6 }}>学習進捗（完了/途中）</h3>
                                <PieChart width={320} height={240}>
                                    <Pie data={progressPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} />
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </div>
                        </div>

                        <div style={{ marginTop: 16 }}>
                            <h3 style={{ fontSize: 14, marginBottom: 6 }}>週ごとの学習量（本数/分）</h3>
                            {weeklySeries.length === 0 ? (
                                <p>学習履歴がありません</p>
                            ) : (
                                <BarChart width={860} height={280} data={weeklySeries}>
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

                        <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                            <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700 }}>完了した動画</h3>
                                {completedList.length === 0 ? (
                                    <p style={{ marginTop: 8 }}>まだありません</p>
                                ) : (
                                    <ul style={{ marginTop: 8 }}>
                                        {completedList.slice(0, 30).map((v, i) => (
                                            <li key={i}>{v.title ?? v.videoId ?? "unknown"}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700 }}>途中の動画</h3>
                                {inProgressList.length === 0 ? (
                                    <p style={{ marginTop: 8 }}>まだありません</p>
                                ) : (
                                    <ul style={{ marginTop: 8 }}>
                                        {inProgressList.slice(0, 30).map((v, i) => (
                                            <li key={i}>
                                                {v.title ?? v.videoId ?? "unknown"}（{Math.round((v.progress ?? 0) * 100)}%）
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ✅ ポートフォリオ（profiles/{uid} から） */}
            <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
                <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
                    <h2 style={{ marginBottom: 6 }}>プロフィール</h2>
                    <p style={{ opacity: 0.8 }}>{profile?.headerSubtitle ?? "自己紹介とポートフォリオをご覧ください。"}</p>
                </div>

                <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
                    <h2 style={{ marginBottom: 6 }}>自己紹介</h2>
                    <p style={{ lineHeight: 1.9 }}>{profile?.aboutText ?? "（未登録）"}</p>
                </div>

                <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
                    <h2 style={{ marginBottom: 6 }}>スキル</h2>
                    {profile?.skills?.length ? (
                        <ul style={{ marginTop: 8 }}>
                            {profile.skills.map((s, i) => (
                                <li key={i}>{s}</li>
                            ))}
                        </ul>
                    ) : (
                        <p>（未登録）</p>
                    )}
                </div>

                <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
                    <h2 style={{ marginBottom: 6 }}>成果物</h2>
                    {profile?.portfolioItems?.length ? (
                        <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
                            {profile.portfolioItems.map((it) => (
                                <div
                                    key={it.id}
                                    style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}
                                >
                                    <h3 style={{ marginBottom: 6 }}>{it.title}</h3>
                                    <p style={{ lineHeight: 1.8 }}>{it.description}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>（未登録）</p>
                    )}
                </div>
            </div>
        </div>
    );
}
