// src/app/dashboard/student/layout.tsx
import StudentMenubar from "@/app/components/menubar/StudentMenubar";
import styles from "../layout.module.css";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.container}>
            <StudentMenubar />
            {children}
        </div>
    );
}
