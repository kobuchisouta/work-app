
import Menubar from "@/app/components/menubar/Menubar";
import styles from "./layout.module.css";



export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <div className={styles.container}>
      <Menubar />
      {children}
    </div>
  );
}
