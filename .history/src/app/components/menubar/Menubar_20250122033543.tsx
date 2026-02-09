import Image from "next/image";
import styles from "./style.module.css";
import Link from "next/link";

export default function Menubar() {
    return (
        <div className={styles.menuBarWrap}>
            <div className={styles.logo}>
                <Image src="/logo.png" alt="logo" width={100} height={100} priority />
                <p>Skill Link</p>
            </div>
            <div className={styles.menuBar}>
                <Link href="/dashboard/movie/level" className={styles.menuItem}>
                    <Image src="/playback.png" alt="logo" width={34} height={34} priority />
                    <p className={styles.menuText}>学習動画</p>
                </Link>
                <Link href="/dashboard/mail" className={styles.menuItem}>
                    <Image src="/mail.png" alt="logo" width={34} height={34} priority />
                    <p className={styles.menuText}>メール</p>
                </Link>
                <Link href="/dashboard/profile" className={styles.menuItem}>
                    <Image src="/person.png" alt="logo" width={34} height={34} priority />
                    <p className={styles.menuText}>プロフィール</p>

                </Link>
            </div>
        </div>
    );
}