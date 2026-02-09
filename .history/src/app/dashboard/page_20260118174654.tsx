"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";

export default function DashboardPage() {
    const router = useRouter();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            // 未ログインならログインへ
            if (!user) {
                router.replace("/login");
                return;
            }

            // Firestore から role を取得
            const snap = await getDoc(doc(db, "users", user.uid));

            if (!snap.exists()) {
                router.replace("/signup");
                return;
            }

            const role = snap.data().role;

            // role で振り分け
            if (role === "student") {
                router.replace("/dashboard/student");
            } else if (role === "company") {
                router.replace("/dashboard/company");
            } else {
                router.replace("/login");
            }
        });

        return () => unsub();
    }, [router]);

    return <div style={{ padding: 20 }}>読み込み中...</div>;
}
