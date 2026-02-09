// src/app/dashboard/company/page.tsx
import { redirect } from "next/navigation";

export default function CompanyHomePage() {
    redirect("/dashboard/company/students");
}
