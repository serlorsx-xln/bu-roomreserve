import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/auth-forms";
import { getFaculties } from "@/lib/db";
import type { SearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "สมัครใช้งาน" };
// รายชื่อคณะอ่านจากฐานข้อมูลตอน request (ห้าม prerender ตอน build)
export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;
  // SQL: SELECT faculty_id, faculty_name FROM faculties — ตัวเลือกคณะในฟอร์ม
  return <RegisterForm next={typeof next === "string" ? next : undefined} faculties={getFaculties()} />;
}
