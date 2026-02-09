"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, enableNetwork } from "firebase/firestore";
import { auth, db } from "@/firebase";

function withTimeout<T>(promise: Promise<T>, ms: number) {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms)
        ),
    ]);
}

export default function DashboardPage() {
    const router = useRouter();
    const [status, setStatus] = useState("読み込み中...");

    useEffect(() => {
        (async () => {
            try {
                // Firestoreネットワークを明示的にON
                await enableNetwork(db);
            } catch (e) {
                console.error("[dashboard] enableNetwork error:", e);
                // enableNetworkが失敗しても一応続行（原因表示のため）
            }
        })();

        const unsub = onAuthStateChanged(auth, async (user) => {
            try {
                console.log("[dashboard] onLine:", navigator.onLine);
                console.log("[dashboard] uid:", user?.uid);

                if (!user) {
                    setStatus("未ログインです。トップへ戻ります...");
                    router.replace("/");
                    return;
                }

                setStatus("ユーザー情報を取得中...");

                // ★ここが固まっているのでタイムアウトを入れる
                const snap = await withTimeout(
                    getDoc(doc(db, "users", user.uid)),
                    8000
                );

                console.log("[dashboard] users doc exists:", snap.exists());

                if (!snap.exists()) {
                    setStatus("usersデータがありません。/signup へ移動します...");
                    router.replace("/signup");
                    return;
                }

                const role = snap.data()?.role;
                console.log("[dashboard] role:", role);

                if (role === "student") {
                    setStatus("studentへ移動します...");
                    router.replace("/dashboard/student");
                } else if (role === "company") {
                    setStatus("companyへ移動します...");
                    router.replace("/dashboard/company");
                } else {
                    setStatus("roleが不正です。トップへ戻ります...");
                    router.replace("/");
                }
            } catch (e: any) {
                console.error("[dashboard] getDoc error:", e);

                // タイムアウト（通信が飛んでない/ブロック/Firestore未作成が多い）
                if (String(e?.message || "").includes("timeout")) {
                    setStatus(
                        "Firestore取得がタイムアウトしました。Networkタブで firestore/googleapis への通信が出ているか確認してください（広告ブロッカー/VPN/プロキシで止まることがあります）。"
                    );
                    return;
                }

                setStatus(`エラー: ${e?.message ?? "不明なエラー"}`);
            }
        });

        return () => unsub();
    }, [router]);

    return <div style={{ padding: 20 }}>{status}</div>;
}
