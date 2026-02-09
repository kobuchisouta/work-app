"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./Signup.module.css";

import { auth, db } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SignupPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("student");
    const [error, setError] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

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
                role: role, // student / company
                createdAt: serverTimestamp(),
            });

            // ✅ 登録完了後に page.tsx（/）へ遷移
            router.push("/");
        } catch (err: any) {
            console.error(err);

            if (err.code === "auth/email-already-in-use") {
                setError("このメールアドレスはすでに登録されています");
            } else if (err.code === "auth/weak-password") {
                setError("パスワードは6文字以上にしてください");
            } else {
                setError("登録に失敗しました");
            }
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

                    <div className={styles.inputGroup}>
                        <label>役割</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
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
                        <Link href="/"> ログイン</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
