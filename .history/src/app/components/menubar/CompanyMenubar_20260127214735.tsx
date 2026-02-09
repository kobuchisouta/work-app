import Image from "next/image";
import Link from "next/link";
import styles from "./style.module.css";

export default function CompanyMenubar() {
    return (
        <div className={styles.menuBarWrap}>
            <div className={styles.logo}>
                <Image src="/logo.png" alt="logo" width={100} height={100} />
                <p>Skill Link</p>
            </div>

            <div className={styles.menuBar}>
                <Link href="/dashboard/company/students" className={styles.menuItem}>
                    <Image src="/person.png" alt="students" width={34} height={34} />
                    <p className={styles.menuText}>学生一覧</p>
                </Link>

                <Link href="/dashboard/company/mail" className={styles.menuItem}>
                    <Image src="/mail.png" alt="mail" width={34} height={34} />
                    <p className={styles.menuText}>メール</p>
                </Link>
            </div>
        </div>
    );
}
