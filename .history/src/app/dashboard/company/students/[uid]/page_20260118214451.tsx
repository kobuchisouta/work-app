"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

export default function CompanyStudentProfilePage() {
    const params = useParams();
    const uid = params.uid as string;

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                setError("");
                setLoading(true);

                const snap = await getDoc(doc(db, "profiles", uid));
                if (!snap.exists()) {
                    setProfile(null);
                    return;
                }
                setProfile(snap.data());
            } catch (e: any) {
                console.error(e);
                setError(e?.message ?? "取得に失敗しました");
            } finally {
                setLoading(false);
            }
        })();
    }, [uid]);

    if (loading) return <div style={{ padding: 20 }}>読み込み中...</div>;
    if (error) return <div style={{ padding: 20 }}>エラー: {error}</div>;

    if (!profile) {
        return (
            <div style={{ padding: 20 }}>
                <p>この生徒のプロフィールがまだ作成されていません。</p>
                <Link href="/dashboard/company/students">← 生徒一覧へ戻る</Link>
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <Link href="/dashboard/company/students">← 生徒一覧へ戻る</Link>

            <h1 style={{ marginTop: 12 }}>{profile.headerTitle ?? "プロフィール"}</h1>
            <p>{profile.headerSubtitle ?? ""}</p>

            <h2 style={{ marginTop: 20 }}>自己紹介</h2>
            <p>{profile.aboutText ?? ""}</p>

            <h2 style={{ marginTop: 20 }}>スキル</h2>
            <ul>
                {(profile.skills ?? []).map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                ))}
            </ul>

            <h2 style={{ marginTop: 20 }}>ポートフォリオ</h2>
            {(profile.portfolioItems ?? []).map((item: any) => (
                <div key={item.id} style={{ marginBottom: 14 }}>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                </div>
            ))}

            <h2 style={{ marginTop: 20 }}>コンタクト</h2>
            <p>Email: {profile.contact?.email ?? "-"}</p>
            <p>
                GitHub:{" "}
                {profile.contact?.github ? (
                    <a href={profile.contact.github} target="_blank" rel="noreferrer">
                        {profile.contact.github}
                    </a>
                ) : (
                    "-"
                )}
            </p>
        </div>
    );
}
