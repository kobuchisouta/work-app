"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase";
import Link from "next/link";
import styles from "./Signup.module.css";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("student");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        const user = userCredential.user;

        // Firestore にユーザー情報＋役割を保存
        await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            role: role, // student or company
            createdAt: serverTimestamp(),
        });
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

                    <div className={styles.inputGroup}>
                        <label>アカウント種別</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="student">生徒</option>
                            <option value="company">企業</option>
                        </select>
                    </div>

                    <button className={styles.submitBtn} type="submit">
                        登録する
                    </button>
                </form>

                <div className={styles.footer}>
                    すでにアカウントをお持ちですか？{" "}
                    <Link href="/login">ログイン</Link>
                </div>
            </div>
        </div>
    );
}
