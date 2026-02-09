"use client";

import Link from "next/link";

export default function CompanyDashboard() {
    return (
        <div style={{ padding: 20 }}>
            <h1>企業用ダッシュボード</h1>

            <ul style={{ marginTop: 12 }}>
                <li>
                    <Link href="/dashboard/company/students">生徒一覧を見る</Link>
                </li>
            </ul>
        </div>
    );
}
