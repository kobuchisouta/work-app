import Link from 'next/link';
import styles from './login.module.css';

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>ログイン</h1>
        <form className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="username">ユーザー名</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="ユーザー名を入力"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="パスワードを入力"
              required
            />
          </div>
          <Link href="/dashboard" passHref>
            <button type="button" className={styles.submitBtn}>
              ログイン
            </button>
          </Link>
        </form>
        <div className={styles.footer}>
          <Link href="#">パスワードを忘れた場合</Link>
          <p>まだアカウントを作成していませんか？ <Link href={"/dashboard"}>サインアップ</Link></p>
        </div>
      </div>
    </div>
  );
}



