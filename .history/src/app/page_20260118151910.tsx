import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import styles from "./login.module.css";

import { auth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();

  // 入力値を state で管理
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ログイン処理
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // ログイン成功
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("メールアドレスまたはパスワードが違います");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>ログイン</h1>

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              id="email"
              placeholder="メールアドレスを入力"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn}>
            ログイン
          </button>
        </form>

        <div className={styles.footer}>
          <Link href="#">パスワードを忘れた場合</Link>
          <p>
            まだアカウントを作成していませんか？
            <Link href="/signup"> サインアップ</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
