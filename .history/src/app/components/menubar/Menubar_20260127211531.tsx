"use client";

import Image from "next/image";
import styles from "./style.module.css";
import Link from "next/link";
import { useEffect, useState } from "react";

import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type Role = "student" | "company" | null;

export default function Menubar() {
    const [role, setRole] = useState<Role>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setRole(null);
                return;
            }

            try {
                const snap = await getDoc(doc(db, "profiles", user.uid));
                if (snap.exists()) {
                    setRole(snap.data().role ?? "student");
                } else {
                    setRole("student");
                }
            } catch (e) {
                console.error(e);
                setRole("student");
            }
        });

        return () => unsub();
    }, []);

    return (
        <div className={styles.menuBarWrap}>
            {/* ロゴ */}
            <div className={styles.logo}>
                <Image src="/logo.png" alt="logo" width={100} height={100} priority />
                <p>Skill Link</p>
            </div>

            {/* メニュー */}
            <div className={styles.menuBar}>
                {/* ===== 生徒メニュー ===== */}
                {role !== "company" && (
                    <>
                        <Link href="/dashboard/student/movie/level" className={styles.menuItem}>
                            <Image src="/playback.png" alt="学習動画" width={34} height={34} />
                            <p className={styles.menuText}>学習動画</p>
                        </Link>

                        <Link href="/dashboard/student/mail" className={styles.menuItem}>
                            <Image src="/mail.png" alt="メール" width={34} height={34} />
                            <p className={styles.menuText}>メール</p>
                        </Link>

                        <Link href="/dashboard/student/profile" className={styles.menuItem}>
                            <Image src="/person.png" alt="プロフィール" width={34} height={34} />
                            <p className={styles.menuText}>プロフィール</p>
                        </Link>
                    </>
                )}

                {/* ===== 企業メニュー ===== */}
                {role === "company" && (
                    <>
                        <Link href="/dashboard/company/students" className={styles.menuItem}>
                            <Image src="/person.png" alt="学生一覧" width={34} height={34} />
                            <p className={styles.menuText}>学生一覧</p>
                        </Link>

                        <Link href="/dashboard/company/mail" className={styles.menuItem}>
                            <Image src="/mail.png" alt="メール" width={34} height={34} />
                            <p className={styles.menuText}>メール</p>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
