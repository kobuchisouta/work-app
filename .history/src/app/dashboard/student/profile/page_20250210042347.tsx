"use client";
import { useState, useEffect } from 'react';
import styles from './profile.module.css';

export default function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false);

    // デフォルト値の定義
    const defaultHeaderTitle = "プロフィール";
    const defaultHeaderSubtitle = "自己紹介とポートフォリオをご覧ください。";
    const defaultPortfolioItems = [
        {
            id: 1,
            title: "プロジェクト: 農業支援アプリ",
            description:
                "農業支援アプリを開発中。React と Firebase を使用して、ユーザーが農業に関する質問を投稿し、回答を得ることができるプラットフォームです。",
        },
        {
            id: 2,
            title: "動画視聴: React.js でのフロントエンド開発",
            description:
                "React.js の基本を学ぶために視聴した動画。コンポーネントの作成方法や、状態管理の仕組みについて理解しました。",
        },
    ];
    const defaultAboutText =
        "こんにちは！ ECCコンピュータ専門学校 Webデザインコース 小淵 颯太 です。プログラミングやテクノロジーに興味を持ち、フロントエンドとバックエンドの開発に力を入れています。将来的には、より多くの人々に役立つサービスを提供できるよう努力しています。";
    const defaultSkills = [
        "React.js / Next.js",
        "Node.js / Express",
        "Firebase",
        "JavaScript / TypeScript",
    ];
    const defaultContact = {
        email: "example@example.com",
        github: "https://github.com/kobuchisouta",
    };

    // 各状態の初期値を定義（後述するローカルストレージからの読み込みで上書きされます）
    const [headerTitle, setHeaderTitle] = useState(defaultHeaderTitle);
    const [headerSubtitle, setHeaderSubtitle] = useState(defaultHeaderSubtitle);
    const [portfolioItems, setPortfolioItems] = useState(defaultPortfolioItems);
    const [aboutText, setAboutText] = useState(defaultAboutText);
    const [skills, setSkills] = useState(defaultSkills);
    const [contact, setContact] = useState(defaultContact);

    // マウント時にローカルストレージからデータを読み込み
    useEffect(() => {
        const storedData = localStorage.getItem("profileData");
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            setHeaderTitle(parsedData.headerTitle || defaultHeaderTitle);
            setHeaderSubtitle(parsedData.headerSubtitle || defaultHeaderSubtitle);
            setPortfolioItems(parsedData.portfolioItems || defaultPortfolioItems);
            setAboutText(parsedData.aboutText || defaultAboutText);
            setSkills(parsedData.skills || defaultSkills);
            setContact(parsedData.contact || defaultContact);
        }
    }, []);

    // 各状態が変更されるたびにローカルストレージへ保存
    useEffect(() => {
        const profileData = {
            headerTitle,
            headerSubtitle,
            portfolioItems,
            aboutText,
            skills,
            contact,
        };
        localStorage.setItem("profileData", JSON.stringify(profileData));
    }, [headerTitle, headerSubtitle, portfolioItems, aboutText, skills, contact]);

    return (
        <div className={styles.container}>
            {/* ヘッダーセクション */}
            <header className={styles.header}>
                {isEditing ? (
                    <input
                        type="text"
                        value={headerTitle}
                        onChange={(e) => setHeaderTitle(e.target.value)}
                        className={styles.editInput}
                    />
                ) : (
                    <h1>{headerTitle}</h1>
                )}
                {isEditing ? (
                    <textarea
                        value={headerSubtitle}
                        onChange={(e) => setHeaderSubtitle(e.target.value)}
                        className={styles.editTextarea}
                    />
                ) : (
                    <p>{headerSubtitle}</p>
                )}
            </header>

            {/* ポートフォリオセクション */}
            <section className={styles.portfolio}>
                <h2>成果 &amp; プログラミングスキル</h2>
                <div className={styles.portfolioItems}>
                    {portfolioItems.map((item) => (
                        <div key={item.id} className={styles.portfolioItem}>
                            {isEditing ? (
                                <>
                                    <input
                                        type="text"
                                        value={item.title}
                                        onChange={(e) => {
                                            const newTitle = e.target.value;
                                            setPortfolioItems((items) =>
                                                items.map((it) =>
                                                    it.id === item.id ? { ...it, title: newTitle } : it
                                                )
                                            );
                                        }}
                                        className={styles.editInput}
                                    />
                                    <textarea
                                        value={item.description}
                                        onChange={(e) => {
                                            const newDescription = e.target.value;
                                            setPortfolioItems((items) =>
                                                items.map((it) =>
                                                    it.id === item.id ? { ...it, description: newDescription } : it
                                                )
                                            );
                                        }}
                                        className={styles.editTextarea}
                                    />
                                </>
                            ) : (
                                <>
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* 自己紹介セクション */}
            <section className={styles.about}>
                <h2>自己紹介</h2>
                {isEditing ? (
                    <textarea
                        value={aboutText}
                        onChange={(e) => setAboutText(e.target.value)}
                        className={styles.editTextarea}
                    />
                ) : (
                    <p>{aboutText}</p>
                )}
            </section>

            {/* スキルセクション */}
            <section className={styles.skills}>
                <h2>スキル</h2>
                <ul>
                    {skills.map((skill, index) => (
                        <li key={index}>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={skill}
                                    onChange={(e) => {
                                        const newSkill = e.target.value;
                                        setSkills((prevSkills) =>
                                            prevSkills.map((s, i) => (i === index ? newSkill : s))
                                        );
                                    }}
                                    className={styles.editInput}
                                />
                            ) : (
                                skill
                            )}
                        </li>
                    ))}
                </ul>
            </section>

            {/* コンタクトセクション */}
            <section className={styles.contact}>
                <h2>コンタクト</h2>
                {isEditing ? (
                    <ul>
                        <li>
                            <input
                                type="email"
                                value={contact.email}
                                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                                className={styles.editInput}
                            />
                        </li>
                        <li>
                            <input
                                type="text"
                                value={contact.github}
                                onChange={(e) => setContact({ ...contact, github: e.target.value })}
                                className={styles.editInput}
                            />
                        </li>
                    </ul>
                ) : (
                    <>
                        <p>ご質問やお問い合わせは、下記のリンクからどうぞ。</p>
                        <ul className={styles.contactList}>
                            <li>
                                <a
                                    href={`mailto:${contact.email}`}
                                    className={styles.contactLink}
                                >
                                    メールでお問い合わせ
                                </a>
                            </li>
                            <li>
                                <a
                                    href={contact.github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.contactLink}
                                >
                                    GitHub
                                </a>
                            </li>
                        </ul>
                    </>
                )}
            </section>


            {/* 編集モード切替ボタン */}
            <button
                onClick={() => setIsEditing(!isEditing)}
                className={styles.editButton}
            >
                {isEditing ? '編集完了' : '編集モード'}
            </button>
        </div>
    );
}
