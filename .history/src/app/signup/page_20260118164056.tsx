"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./signup.module.css";

import { auth, db } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SignupPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"student" | "company">("student");
    const [error, setError] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            // ① Firebase Auth にユーザー作成
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            // ② Firestore にユーザー情報＋役割を保存
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: role, // ← ここが重要
                createdAt: serverTimestamp(),
            });

            // ③ ダッシュボードへ
            router.push("/dashboard");
        } catch (err: any) {
            console.error(err);
            setError("サインアップに失敗しました");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.signupBox}>
                <h1 className={styles.title}>サインアップ</h1>

                <form className={styles.form} onSubmit={handleSignup}>
                    <div className={styles.inputGroup}>
                        <label>メールアドレス</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>パスワード</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>アカウント種別</label>
                        <select
                            value={role}
                            onChange={(e) =>
                                setRole(e.target.value as "student" | "company")
                            }
                        >
                            <option value="student">生徒</option>
                            <option value="company">企業</option>
                        </select>
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button type="submit" className={styles.submitBtn}>
                        登録する
                    </button>
                </form>

                <div className={styles.footer}>
                    <p>
                        すでにアカウントをお持ちですか？
                        <Link href="/login"> ログイン</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
