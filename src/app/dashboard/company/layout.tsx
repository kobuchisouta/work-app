import type { ReactNode } from "react";
import styles from "./layout.module.css";
import CompanyMenubar from "@/app/components/menubar/CompanyMenubar";

export default function Layout({ children }: { children: ReactNode }) {
    return (
        <div className={styles.container}>
            <CompanyMenubar />
            <main className={styles.main}>{children}</main>
        </div>
    );
}
