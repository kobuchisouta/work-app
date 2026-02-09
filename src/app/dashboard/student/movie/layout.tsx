"use client"
import { usePathname } from 'next/navigation';
import styles from "./layout.module.css";
import Link from 'next/link';

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();

    return (
        <div className={styles.container}>
            <header>
                <div className={styles.header}>
                    <h1>学習動画</h1>
                </div>
                <div className={styles.sortWrap}>
                    <div className={styles.sorts}>
                        <Link href={"/dashboard/student/movie/level"} className={`${styles.sort} ${pathname === '/dashboard/student/movie/level' ? styles.active : ''}`}>
                            <p>レベル別</p>
                        </Link>
                        <Link href={"/dashboard/student/movie/list"} className={`${styles.sort} ${pathname === '/dashboard/student/movie/list' ? styles.active : ''}`}>
                            <p>一覧</p>
                        </Link>
                        <Link href={"/dashboard/student/movie/favorites"} className={`${styles.sort} ${pathname === '/dashboard/student/movie/favorites' ? styles.active : ''}`}>
                            <p>お気に入り</p>
                        </Link>
                    </div>
                </div>
            </header>
            <div className={styles.contents}>
                {children}
            </div>
        </div>
    );
}
