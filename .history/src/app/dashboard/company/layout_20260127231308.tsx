// src/app/dashboard/company/layout.tsx
import CompanyMenubar from "@/app/components/menubar/CompanyMenubar";
import styles from "../layout.module.css";

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.container}>
            <CompanyMenubar />
            {children}
        </div>
    );
}
