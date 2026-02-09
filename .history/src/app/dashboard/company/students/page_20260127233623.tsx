"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
    collection,
    onSnapshot,
    query,
    where,
    orderBy,
    type DocumentData,
} from "firebase/firestore";

type StudentRow = {
    uid: string;          // docId
    email?: string;
    displayName?: string;
    role?: string;        // "student"
    createdAt?: any;
};

export default function CompanyStudentsPage() {
    const [uid, setUid] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [students, setStudents] = useState<StudentRow[]>([]);

    // 1) ログイン状態
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUid(u?.uid ?? null);
        });
        return () => unsub();
    }, []);

    // 2) 生徒一覧を購読（users コレクションから role=student を取得）
    useEffect(() => {
        if (!uid) {
            setLoading(false);
            setStudents([]);
            return;
        }

        setLoading(true);
        setError("");

        const q = query(
            collection(db, "users"),
            where("role", "==", "student"),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(
            q,
            (snap) => {
                const list: StudentRow[] = snap.docs.map((d) => {
                    const data = d.data() as DocumentData;
                    return {
                        uid: d.id,
                        email: data.email,
                        displayName: data.displayName,
                        role: data.role,
                        createdAt: data.createdAt,
                    };
                });
                setStudents(list);
                setLoading(false);
            },
            (e) => {
                console.error(e);
                setError(e?.message ?? "生徒一覧の取得に失敗しました");
                setLoading(false);
            }
        );

        return () => unsub();
    }, [uid]);

    if (!uid) {
        return <div style={{ padding: 24 }}>ログインしてください</div>;
    }

    return (
        <div style={{ padding: 24, width: "100%" }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>生徒一覧</h1>
            <p style={{ opacity: 0.7, marginBottom: 16 }}>
                生徒をクリックすると詳細（ポートフォリオ）ページへ移動します
            </p>

            {loading ? (
                <p>読み込み中...</p>
            ) : error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : students.length === 0 ? (
                <p>生徒がまだいません</p>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {students.map((s) => (
                        <Link
                            key={s.uid}
                            href={`/dashboard/company/students/${s.uid}`}
                            style={{
                                display: "block",
                                border: "1px solid #e5e5e5",
                                borderRadius: 12,
                                padding: 14,
                                textDecoration: "none",
                                color: "inherit",
                                background: "white",
                            }}
                        >
                            <div style={{ fontWeight: 700 }}>
                                {s.displayName && s.displayName.trim() !== "" ? s.displayName : "（名前未設定）"}
                            </div>
                            <div style={{ marginTop: 4, fontSize: 13, opacity: 0.8 }}>
                                {s.email ?? "emailなし"} / uid: {s.uid.slice(0, 8)}...
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
