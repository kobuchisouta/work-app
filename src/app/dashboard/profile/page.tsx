import styles from './profile.module.css';

export default function ProfilePage() {
    return (
        <div className={styles.container}>
            {/* ヘッダー */}
            <header className={styles.header}>
                <h1>プロフィール</h1>
                <p>自己紹介とポートフォリオをご覧ください。</p>
            </header>

            {/* ポートフォリオセクション */}
            <section className={styles.portfolio}>
                <h2>成果 & プログラミングスキル</h2>
                <div className={styles.portfolioItems}>
                    <div className={styles.portfolioItem}>
                        <h3>プロジェクト: 農業支援アプリ</h3>
                        <p>
                            農業支援アプリを開発中。React と Firebase を使用して、ユーザーが農業に関する質問を投稿し、回答を得ることができるプラットフォームです。
                        </p>
                    </div>
                    <div className={styles.portfolioItem}>
                        <h3>動画視聴: React.js でのフロントエンド開発</h3>
                        <p>
                            React.js の基本を学ぶために視聴した動画。コンポーネントの作成方法や、状態管理の仕組みについて理解しました。
                        </p>
                    </div>
                </div>
            </section>

            {/* 自己紹介セクション */}
            <section className={styles.about}>
                <h2>自己紹介</h2>
                <p>
                    こんにちは！ ECCコンピュータ専門学校 Webデザインコース 小淵 颯太 です。プログラミングやテクノロジーに興味を持ち、フロントエンドとバックエンドの開発に力を入れています。将来的には、より多くの人々に役立つサービスを提供できるよう努力しています。
                </p>
            </section>

            {/* スキルセクション */}
            <section className={styles.skills}>
                <h2>スキル</h2>
                <ul>
                    <li>React.js / Next.js</li>
                    <li>Node.js / Express</li>
                    <li>Firebase</li>
                    <li>JavaScript / TypeScript</li>
                </ul>
            </section>

            {/* コンタクトセクション */}
            <section className={styles.contact}>
                <h2>コンタクト</h2>
                <p>ご質問やお問い合わせは、下記のリンクからどうぞ。</p>
                <ul>
                    <li><a href="mailto:example@example.com">メールでお問い合わせ</a></li>
                    <li><a href="https://github.com/kobuchisouta" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                </ul>
            </section>
        </div>
    );
}
