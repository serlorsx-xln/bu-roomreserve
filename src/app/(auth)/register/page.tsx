import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/auth-forms";
import type { SearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "สมัครใช้งาน" };

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;
  return <RegisterForm next={typeof next === "string" ? next : undefined} />;
}
