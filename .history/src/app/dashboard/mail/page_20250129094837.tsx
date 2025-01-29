// pages/emails.tsx
"use client";
import { useState } from 'react';
import styles from './email.module.css';

type Email = {
    id: number;
    subject: string;
    sender: string;
    preview: string;
    content: string;
}

export default function EmailsPage() {
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [selectedFolder, setSelectedFolder] = useState('受信トレイ');  // フォルダ選択状態を管理

    const folders = ['受信トレイ', '送信済み', '下書き', '迷惑メール'];
    const emails: { [key: string]: Email[] } = {
        '受信トレイ': [
            {
                id: 1,
                subject: '新しいプロジェクトのご提案',
                sender: 'business@company.com',
                preview: 'お世話になっております。新しいプロジェクトのご提案がございます...',
                content: 'お世話になっております。私たちは貴社に新しいプロジェクトの提案をさせていただきたいと思っております。プロジェクト内容は以下の通りです。詳しいご相談はご連絡いただければと思います。'
            },
            {
                id: 2,
                subject: '協力依頼について',
                sender: 'collaboration@company.com',
                preview: '今後の協力に関してご相談させていただきたく...',
                content: 'お世話になっております。今後の協力関係についてご相談させていただきたくご連絡しました。お時間をいただけますでしょうか。詳細な打ち合わせをしたいと考えております。'
            },
        ],
        '送信済み': [
            {
                id: 3,
                subject: 'プロジェクト提案書の送付',
                sender: 'business@company.com',
                preview: '以前お話ししましたプロジェクト提案書をお送りします...',
                content: '以前お話ししましたプロジェクト提案書を送付させていただきます。ご確認いただければと思います。ご不明な点があれば、お気軽にお尋ねください。'
            },
        ],
        '下書き': [
            {
                id: 4,
                subject: '新規プロジェクトのお知らせ',
                sender: 'manager@company.com',
                preview: '新規プロジェクトに関する詳細をお送りしたいと考えています...',
                content: '新規プロジェクトについて、詳細な情報をお伝えするためのメールを準備しています。お手数ですが、もう少しお待ちください。'
            },
        ],
        '迷惑メール': [
            {
                id: 5,
                subject: '特別なオファー',
                sender: 'offer@company.com',
                preview: '特別なオファーがございます...',
                content: '特別なオファーを提供していますが、これは迷惑メールとして処理される可能性があります。'
            },
        ],
    };

    const handleFolderChange = (folder: string) => {
        setSelectedFolder(folder);
        setSelectedEmail(null); // フォルダ変更時に選択中のメールをリセット
    };

    return (
        <div className={styles.container}>
            {/* サイドバー */}
            <div className={styles.sidebar}>
                <ul>
                    {folders.map((folder) => (
                        <li
                            key={folder}
                            className={`${styles.folder} ${selectedFolder === folder ? styles.selectedFolder : ''}`}
                            onClick={() => handleFolderChange(folder)}
                        >
                            {folder}
                        </li>
                    ))}
                </ul>
            </div>

            <div className={styles.main}>
                {/* メールリスト */}
                <div className={styles.emailList}>
                    <h2>{selectedFolder}</h2>
                    {emails[selectedFolder].map((email: string) => (
                        <div
                            key={email.id}
                            className={`${styles.emailItem} ${selectedEmail?.id === email.id ? styles.selected : ''}`}
                            onClick={() => setSelectedEmail(email)}
                        >
                            <h3>{email.subject}</h3>
                            <p className={styles.sender}>{email.sender}</p>
                            <p className={styles.preview}>{email.preview}</p>
                        </div>
                    ))}
                </div>

                {/* メール詳細 */}
                <div className={styles.emailDetails}>
                    {selectedEmail ? (
                        <>
                            <h2>{selectedEmail.subject}</h2>
                            <p className={styles.sender}>送信者: {selectedEmail.sender}</p>
                            <p>{selectedEmail.content}</p>
                        </>
                    ) : (
                        <p className={styles.noSelection}>表示するメールを選択してください</p>
                    )}
                </div>
            </div>
        </div>
    );
}
