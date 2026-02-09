import Menubar from "@/app/components/menubar/Menubar";
import styles from "@/app/layout.module.css";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.container}>
      <Menubar />
      {children}
    </div>
  );
}
