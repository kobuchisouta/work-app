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
        <div className={styles.page}>
            <div className={styles.shell}>
                <h1 className={styles.h1}>生徒一覧</h1>
                <p className={styles.sub}>生徒をクリックするとポートフォリオを表示します</p>

                <div className={styles.list}>
                    {students.map((s) => (
                        <div
                            key={s.uid}
                            className={styles.card}
                            onClick={() => router.push(`/dashboard/company/students/${s.uid}`)}
                        >
                            <p className={styles.name}>{s.displayName ?? "(名前未登録)"}</p>
                            <p className={styles.meta}>学校: {s.schoolName ?? "(未登録)"}</p>
                            <p className={styles.meta}>{s.email}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
