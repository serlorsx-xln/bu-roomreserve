import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-forms";
import type { SearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : undefined} />;
}
