
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";

import { auth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
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
