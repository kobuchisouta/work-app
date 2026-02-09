"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";

export default function DashboardPage() {
    const router = useRouter();
    const [status, setStatus] = useState("読み込み中...");

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            try {
                console.log("[dashboard] auth user:", user?.uid);

                // 未ログインならトップ(=ログイン)へ
                if (!user) {
                    setStatus("未ログインのためトップへ戻ります...");
                    router.replace("/");
                    return;
                }

                // db が undefined だとここで落ちます
                if (!db) {
                    setStatus("Firestore(db)が初期化されていません。@/firebase を確認してください。");
                    return;
                }

                setStatus("ユーザー情報を取得中...");

                // Firestoreからrole取得
                const snap = await getDoc(doc(db, "users", user.uid));
                console.log("[dashboard] users doc exists:", snap.exists());

                if (!snap.exists()) {
                    setStatus("users データが存在しません。サインアップへ移動します...");
                    router.replace("/signup");
                    return;
                }

                const role = snap.data()?.role;
                console.log("[dashboard] role:", role);

                // roleで振り分け
                if (role === "student") {
                    setStatus("studentへ移動します...");
                    router.replace("/dashboard/student");
                } else if (role === "company") {
                    setStatus("companyへ移動します...");
                    router.replace("/dashboard/company");
                } else {
                    setStatus("role が不正です。トップへ戻ります...");
                    router.replace("/");
                }
            } catch (e: any) {
                console.error("[dashboard] error:", e);
                setStatus(`エラー: ${e?.message ?? "不明なエラー"}`);
            }
        });

        return () => unsub();
    }, [router]);

    return <div style={{ padding: 20 }}>{status}</div>;
}
