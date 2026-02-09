"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/firebase";

type StudentRow = {
    uid: string;
    email?: string;
    displayName?: string;
    schoolName?: string;
    createdAt?: any;
};

export default function CompanyStudentsPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [students, setStudents] = useState<StudentRow[]>([]);

    useEffect(() => {
        (async () => {
            try {
                setError("");
                setLoading(true);

                // users コレクションに role=student がいる前提
                const q = query(
                    collection(db, "users"),
                    where("role", "==", "student"),
                    orderBy("createdAt", "desc")
                );

                const snap = await getDocs(q);

                const list: StudentRow[] = snap.docs.map((d) => {
                    const data = d.data() as any;
                    return {
                        uid: d.id, // ドキュメントIDがuid想定
                        email: data.email,
                        displayName: data.displayName,
                        schoolName: data.schoolName,
                        createdAt: data.createdAt,
                    };
                });

                setStudents(list);
            } catch (e: any) {
                console.error(e);
                setError(e?.message ?? "生徒一覧の取得に失敗しました");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div style={{ padding: 24 }}>読み込み中...</div>;
    if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;

    return (
        <div style={{ padding: 24 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700 }}>生徒一覧</h1>
            <p style={{ opacity: 0.7, marginTop: 6 }}>生徒をクリックするとポートフォリオを表示します</p>

            <div style={{ marginTop: 16, display: "grid", gap: 12, maxWidth: 720 }}>
                {students.map((s) => (
                    <Link
                        key={s.uid}
                        href={`/dashboard/company/students/${s.uid}`}
                        style={{
                            display: "block",
                            padding: 16,
                            border: "1px solid #ddd",
                            borderRadius: 12,
                            textDecoration: "none",
                            color: "inherit",
                            background: "white",
                        }}
                    >
                        <div style={{ fontWeight: 700 }}>
                            {s.displayName || "（名前未登録）"}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 14, opacity: 0.8 }}>
                            {s.schoolName ? `学校: ${s.schoolName}` : "学校: （未登録）"}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 14, opacity: 0.8 }}>
                            {s.email || "（メール未登録）"}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
