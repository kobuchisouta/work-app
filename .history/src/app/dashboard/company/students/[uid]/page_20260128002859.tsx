"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

type ProfileDoc = {
    headerTitle?: string;
    headerSubtitle?: string;
    aboutText?: string;
    skills?: string[];
    portfolioItems?: { id: number; title: string; description: string }[];
    contact?: { email?: string; github?: string };
};

type UserDoc = {
    displayName?: string;
    schoolName?: string;
    email?: string;
};

export default function CompanyStudentDetailPage() {
    const params = useParams<{ uid: string }>();
    const uid = params.uid;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [profile, setProfile] = useState<ProfileDoc | null>(null);
    const [userInfo, setUserInfo] = useState<UserDoc | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setError("");
                setLoading(true);

                // ① profiles/{uid}（生徒が編集しているポートフォリオ）
                const profileSnap = await getDoc(doc(db, "profiles", uid));
                setProfile(profileSnap.exists() ? (profileSnap.data() as ProfileDoc) : null);

                // ② users/{uid}（名前・学校名など）
                const userSnap = await getDoc(doc(db, "users", uid));
                setUserInfo(userSnap.exists() ? (userSnap.data() as UserDoc) : null);
            } catch (e: any) {
                console.error(e);
                setError(e?.message ?? "ポートフォリオ取得に失敗しました");
            } finally {
                setLoading(false);
            }
        })();
    }, [uid]);

    if (loading) return <div style={{ padding: 24 }}>読み込み中...</div>;
    if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;

    return (
        <div style={{ padding: 24, maxWidth: 900 }}>
            <Link href="/dashboard/company/students" style={{ textDecoration: "none" }}>
                ← 生徒一覧へ戻る
            </Link>

            <div style={{ marginTop: 12 }}>
                <h1 style={{ fontSize: 28, fontWeight: 800 }}>
                    {userInfo?.displayName || "（名前未登録）"} のポートフォリオ
                </h1>
                <div style={{ marginTop: 6, opacity: 0.8 }}>
                    {userInfo?.schoolName ? `学校: ${userInfo.schoolName}` : "学校: （未登録）"}
                </div>
                <div style={{ marginTop: 6, opacity: 0.8 }}>
                    {userInfo?.email ? `メール: ${userInfo.email}` : "メール: （未登録）"}
                </div>
            </div>

            <div style={{ marginTop: 20, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                    {profile?.headerTitle ?? "プロフィール"}
                </h2>
                <p style={{ marginTop: 8, opacity: 0.85 }}>
                    {profile?.headerSubtitle ?? "自己紹介とポートフォリオをご覧ください。"}
                </p>
            </div>

            <div style={{ marginTop: 16, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>自己紹介</h2>
                <p style={{ marginTop: 8, lineHeight: 1.7 }}>
                    {profile?.aboutText ?? "（自己紹介がまだありません）"}
                </p>
            </div>

            <div style={{ marginTop: 16, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>スキル</h2>
                {profile?.skills?.length ? (
                    <ul style={{ marginTop: 8 }}>
                        {profile.skills.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                    </ul>
                ) : (
                    <p style={{ marginTop: 8 }}>（スキル未登録）</p>
                )}
            </div>

            <div style={{ marginTop: 16, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>成果物</h2>
                {profile?.portfolioItems?.length ? (
                    <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
                        {profile.portfolioItems.map((it) => (
                            <div
                                key={it.id}
                                style={{ padding: 14, border: "1px solid #eee", borderRadius: 12 }}
                            >
                                <div style={{ fontWeight: 700 }}>{it.title}</div>
                                <p style={{ marginTop: 6, opacity: 0.9, lineHeight: 1.6 }}>
                                    {it.description}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p style={{ marginTop: 8 }}>（成果物がまだありません）</p>
                )}
            </div>

            <div style={{ marginTop: 16, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>連絡先</h2>
                <div style={{ marginTop: 8 }}>
                    {profile?.contact?.email ? (
                        <div>email: {profile.contact.email}</div>
                    ) : (
                        <div>email: （未登録）</div>
                    )}
                    {profile?.contact?.github ? (
                        <div style={{ marginTop: 6 }}>
                            github:{" "}
                            <a href={profile.contact.github} target="_blank" rel="noreferrer">
                                {profile.contact.github}
                            </a>
                        </div>
                    ) : (
                        <div style={{ marginTop: 6 }}>github: （未登録）</div>
                    )}
                </div>
            </div>
        </div>
    );
}
