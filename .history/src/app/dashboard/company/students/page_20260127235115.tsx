"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./students.module.css";

import { db } from "@/firebase";
import {
    collection,
    getDocs,
    orderBy,
    query,
    where,
    limit,
} from "firebase/firestore";

type Student = {
    id: string;
    email?: string;
    displayName?: string;
    role?: string;
    createdAt?: any; // Firestore Timestamp
};

function toDateString(ts: any) {
    try {
        if (!ts) return "";
        const d = ts.toDate?.() ?? new Date(ts.seconds * 1000);
        return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
            d.getDate()
        ).padStart(2, "0")}`;
    } catch {
        return "";
    }
}

export default function CompanyStudentsPage() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // Firestoreから取得した生徒一覧（マスター）
    const [students, setStudents] = useState<Student[]>([]);

    // UI状態
    const [keyword, setKeyword] = useState("");
    const [sortKey, setSortKey] = useState<"new" | "old">("new");

    // ① Firestoreから取得
    useEffect(() => {
        (async () => {
            try {
                setErr("");
                setLoading(true);

                // ✅ インデックス必須：where + orderBy の組み合わせ
                const q = query(
                    collection(db, "users"),
                    where("role", "==", "student"),
                    orderBy("createdAt", sortKey === "new" ? "desc" : "asc"),
                    limit(200)
                );

                const snap = await getDocs(q);
                const list: Student[] = snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as any),
                }));

                setStudents(list);
            } catch (e: any) {
                console.error(e);
                setErr(e?.message ?? "生徒一覧の取得に失敗しました");
            } finally {
                setLoading(false);
            }
        })();
    }, [sortKey]);

    // ② 検索（クライアント側フィルタ）
    const filtered = useMemo(() => {
        const k = keyword.trim().toLowerCase();
        if (!k) return students;

        return students.filter((s) => {
            const email = (s.email ?? "").toLowerCase();
            const name = (s.displayName ?? "").toLowerCase();
            return email.includes(k) || name.includes(k);
        });
    }, [students, keyword]);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>生徒一覧</h1>

            {/* 検索 & 並び替え */}
            <div className={styles.toolbar}>
                <input
                    className={styles.search}
                    placeholder="名前 or メールで検索"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />

                <select
                    className={styles.select}
                    value={sortKey}
                    onChange={(e) => setSortKey(e.target.value as "new" | "old")}
                >
                    <option value="new">新しい順</option>
                    <option value="old">古い順</option>
                </select>
            </div>

            {loading ? (
                <p>読み込み中...</p>
            ) : err ? (
                <p style={{ color: "red" }}>{err}</p>
            ) : filtered.length === 0 ? (
                <p>該当する生徒がいません</p>
            ) : (
                <div className={styles.list}>
                    {filtered.map((s) => (
                        <div key={s.id} className={styles.card}>
                            <div className={styles.row}>
                                <div className={styles.name}>
                                    {s.displayName?.trim() ? s.displayName : "（名前未設定）"}
                                </div>
                                <div className={styles.date}>
                                    {toDateString(s.createdAt) ? `登録: ${toDateString(s.createdAt)}` : ""}
                                </div>
                            </div>
                            <div className={styles.email}>{s.email ?? ""}</div>

                            {/* 将来：詳細ページに飛ばす */}
                            {/* <Link href={`/dashboard/company/students/${s.id}`}>詳細を見る</Link> */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
