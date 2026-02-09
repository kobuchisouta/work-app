import CompanyMenubar from "@/app/components/menubar/CompanyMenubar";
import styles from "@/app/layout.module.css";

export default function CompanyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={styles.container}>
            <CompanyMenubar />
            {children}
        </div>
    );
}
