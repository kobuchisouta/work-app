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
            // ① Firebase Auth にユーザー作成
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password,
            );

            const user = userCredential.user;

            // 2) 共通ユーザー情報を保存
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                role,
                createdAt: serverTimestamp(),
            });

            if (role === "student") {
                await setDoc(doc(db, "students", user.uid), {
                    displayName: "",
                    portfolioUrl: "",
                    updatedAt: serverTimestamp(),
                });
            } else {
                await setDoc(doc(db, "teachers", user.uid), {
                    displayName: "",
                    schoolOrCompany: "",
                    updatedAt: serverTimestamp(),
                });
            }



            console.log("signup success");

            // ③ 確実に page.tsx（/）へ戻す
            setTimeout(() => {
                router.replace("/");
            }, 100);

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
