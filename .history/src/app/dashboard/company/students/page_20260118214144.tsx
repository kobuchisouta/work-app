"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";

type StudentRow = {
    uid: string;
    email?: string;
    role?: string;
};

export default function CompanyStudentsPage() {
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                setError("");
                setLoading(true);

                const q = query(collection(db, "users"), where("role", "==", "student"));
                const snap = await getDocs(q);

                const list: StudentRow[] = snap.docs.map((d) => ({
                    uid: d.id,
                    ...(d.data() as any),
                }));

                setStudents(list);
            } catch (e: any) {
                console.error(e);
                setError(e?.message ?? "取得に失敗しました");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div style={{ padding: 20 }}>読み込み中...</div>;
    if (error) return <div style={{ padding: 20 }}>エラー: {error}</div>;

    return (
        <div style={{ padding: 20 }}>
            <h1>生徒一覧</h1>

            {students.length === 0 ? (
                <p>生徒が見つかりません。</p>
            ) : (
                <ul style={{ marginTop: 12 }}>
                    {students.map((s) => (
                        <li key={s.uid} style={{ marginBottom: 8 }}>
                            <Link href={`/dashboard/company/students/${s.uid}`}>
                                {s.email ?? s.uid}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
