// API: POST /api/auth/login — เข้าสู่ระบบ
// SQL ที่ใช้: SELECT (ค้นหาผู้ใช้ด้วยอีเมล ผ่าน findUserByEmail ใน src/lib/db.ts)
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { findUserByEmail } from "@/lib/db";
import { loginSchema, firstError } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }

  // SELECT ... WHERE email = ? — ค่าอีเมลผ่านพารามิเตอร์ ? (กัน SQL Injection)
  const user = findUserByEmail(parsed.data.email);
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, fullName: user.fullName, role: user.role } });
}
