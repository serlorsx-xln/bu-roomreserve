// API: POST /api/auth/register — สมัครใช้งาน
// SQL ที่ใช้: SELECT (ตรวจอีเมล/รหัสซ้ำ) และ INSERT (สร้างบัญชีใหม่) ผ่าน src/lib/db.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { findUserByEmail, findUserByStudentId, insertUser } from "@/lib/db";
import { registerSchema, firstError } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }

  const { fullName, studentId, email, phone, password } = parsed.data;

  // SELECT: ตรวจว่าอีเมลหรือรหัสนักศึกษาซ้ำหรือไม่ (ทั้งสองคอลัมน์เป็น UNIQUE ใน schema)
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });
  }
  if (studentId && findUserByStudentId(studentId)) {
    return NextResponse.json({ error: "รหัสนักศึกษานี้ถูกใช้งานแล้ว" }, { status: 409 });
  }

  try {
    // INSERT INTO users (...) VALUES (?, ?, ...) — ผู้สมัครใหม่เป็นนักศึกษาเสมอ (สิทธิ์อื่นกำหนดโดยผู้ดูแลระบบ)
    const userId = insertUser({
      fullName,
      studentId: studentId || null,
      email,
      phone: phone || null,
      passwordHash: await bcrypt.hash(password, 10),
      role: "STUDENT",
    });
    await createSession(userId);
    return NextResponse.json({ user: { id: userId, fullName, role: "STUDENT" } });
  } catch (error) {
    // มีคนสมัครด้วยอีเมล/รหัสเดียวกันพร้อมกันพอดี — ฐานข้อมูลปฏิเสธเพราะคอลัมน์เป็น UNIQUE
    if (String((error as Error).message).includes("UNIQUE constraint failed")) {
      return NextResponse.json({ error: "อีเมลหรือรหัสนักศึกษานี้ถูกใช้งานแล้ว" }, { status: 409 });
    }
    throw error;
  }
}
