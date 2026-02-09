"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../login/login.module.css";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase";

export default function SignupPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            // Firestore にユーザー情報を保存
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role: "student", // ← 後で company にもできる
                createdAt: serverTimestamp(),
            });

            router.push("/dashboard");
        } catch (err) {
            console.error(err);
            setError("登録に失敗しました");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginBox}>
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
