"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import styles from "./page.module.css";

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

    if (loading) return <div className={styles.state}>読み込み中...</div>;
    if (error) return <div className={`${styles.state} ${styles.error}`}>{error}</div>;

    return (
        <div className={styles.page}>
            <div className={styles.shell}>
                <h1 className={styles.h1}>生徒一覧</h1>
                <p className={styles.sub}>生徒をクリックするとポートフォリオを表示します</p>

                <div className={styles.grid}>
                    {students.map((s) => (
                        <Link
                            key={s.uid}
                            href={`/dashboard/company/students/${s.uid}`}
                            className={styles.card}
                        >
                            <div className={styles.name}>{s.displayName || "（名前未登録）"}</div>

                            <div className={styles.meta}>
                                {s.schoolName ? `学校: ${s.schoolName}` : "学校: （未登録）"}
                            </div>

                            <div className={styles.meta}>{s.email || "（メール未登録）"}</div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
