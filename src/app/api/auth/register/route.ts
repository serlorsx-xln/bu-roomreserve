// API: POST /api/auth/register — สมัครใช้งาน
// SQL ที่ใช้: SELECT (ตรวจรหัส/อีเมลซ้ำ) และ INSERT (สร้างบัญชีใหม่) ผ่าน src/lib/db.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { findUserByEmail, findUserById, getFaculties, insertUser } from "@/lib/db";
import { registerSchema, firstError } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }

  const { userId, fullName, facultyId, email, phone, password } = parsed.data;

  // SELECT: รหัสผู้ใช้ (PK) และอีเมล (UNIQUE) ต้องไม่ซ้ำ, คณะต้องมีอยู่จริง
  if (findUserById(userId)) {
    return NextResponse.json({ error: "รหัสนี้ถูกใช้สมัครแล้ว" }, { status: 409 });
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });
  }
  if (!getFaculties().some((f) => f.id === facultyId)) {
    return NextResponse.json({ error: "กรุณาเลือกคณะ" }, { status: 400 });
  }

  try {
    // INSERT INTO users (...) VALUES (?, ?, ...) — ผู้สมัครใหม่เป็นนักศึกษาเสมอ (สิทธิ์อื่นกำหนดโดยผู้ดูแลระบบ)
    insertUser({
      id: userId,
      fullName,
      email,
      phone: phone || null,
      passwordHash: await bcrypt.hash(password, 10),
      role: "STUDENT",
      facultyId,
    });
    await createSession(userId);
    return NextResponse.json({ user: { id: userId, fullName, role: "STUDENT" } });
  } catch (error) {
    // มีคนสมัครด้วยรหัส/อีเมลเดียวกันพร้อมกันพอดี — ฐานข้อมูลปฏิเสธเพราะเป็น PK/UNIQUE
    if (/UNIQUE constraint failed/.test(String((error as Error).message))) {
      return NextResponse.json({ error: "รหัสหรืออีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });
    }
    throw error;
  }
}
