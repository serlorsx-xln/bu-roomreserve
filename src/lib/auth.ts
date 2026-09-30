// ระบบยืนยันตัวตนแบบง่าย (เพื่อการศึกษา) — เก็บ user id ไว้ใน cookie
// ระบบจริงควรใช้ session ที่เข้ารหัส/ลงลายมือชื่อ เช่น NextAuth หรือ iron-session
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@/lib/types";
import { findUserById } from "@/lib/db";
import { availabilityHref } from "@/lib/routes";

const SESSION_COOKIE = "session_user";

/** บันทึก user id ลง cookie หลังเข้าสู่ระบบสำเร็จ */
export async function createSession(userId: number) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, String(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production", // ส่ง cookie ผ่าน https เท่านั้นเมื่อใช้งานจริง
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 วัน
  });
}

/** ลบ cookie (ออกจากระบบ) */
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * ผู้ใช้ปัจจุบัน หรือ null ถ้ายังไม่เข้าสู่ระบบ
 * ห่อด้วย cache() ของ React: ใน 1 request ถึงเรียกหลายที่ (layout + page) ก็ query ฐานข้อมูลครั้งเดียว
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const cookieStore = await cookies();
  const userId = Number(cookieStore.get(SESSION_COOKIE)?.value);
  if (!Number.isInteger(userId) || userId <= 0) return null;
  return findUserById(userId);
});

/** ใช้ในหน้าที่ต้องเข้าสู่ระบบ — ถ้ายังไม่เข้าสู่ระบบจะพาไปหน้า login แล้วกลับมาที่เดิม */
export async function requireUser(returnTo: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/** ใช้ในหน้าผู้ดูแลระบบ — ผู้ใช้ทั่วไปจะถูกพากลับหน้าแรก */
export async function requireAdmin(returnTo: string): Promise<User> {
  const user = await requireUser(returnTo);
  if (user.role !== "ADMIN") redirect(availabilityHref());
  return user;
}
