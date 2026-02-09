"use client";

import Link from "next/link";

export default function StudentDashboard() {
    return (
        <div>
            <h1>生徒ダッシュボード</h1>

            <ul>
                <li><Link href="/dashboard/student/mail">メール</Link></li>
                <li><Link href="/dashboard/student/movie">動画</Link></li>
                <li><Link href="/dashboard/student/profile">プロフィール</Link></li>
            </ul>
        </div>
    );
}