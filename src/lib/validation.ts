// ตรวจสอบความถูกต้องของข้อมูลที่ส่งเข้ามาด้วย Zod — ใช้ร่วมกันทุก API route
import { z } from "zod";
import { CLOSE_HOUR, MAX_DURATION_HOURS, OPEN_HOUR } from "@/lib/constants";
import { formatHour, fromDateKey, toDateKey } from "@/lib/format";

// อีเมลเก็บเป็นตัวพิมพ์เล็กเสมอ เพื่อให้ A@B.com กับ a@b.com เป็นบัญชีเดียวกัน
const email = z
  .string({ error: "กรุณากรอกอีเมล" })
  .trim()
  .toLowerCase()
  .pipe(z.email("อีเมลไม่ถูกต้อง").max(120, "อีเมลยาวเกินไป"));

// ฟอร์มเข้าสู่ระบบ
export const loginSchema = z.object({
  email,
  password: z.string({ error: "กรุณากรอกรหัสผ่าน" }).min(1, "กรุณากรอกรหัสผ่าน").max(72, "รหัสผ่านยาวเกินไป"),
});

// ฟอร์มสมัครใช้งาน (บทบาทเป็นนักศึกษาเสมอ — ไม่รับค่า role จากผู้ใช้)
export const registerSchema = z.object({
  fullName: z
    .string({ error: "กรุณากรอกชื่อ-นามสกุล" })
    .trim()
    .min(2, "กรุณากรอกชื่อ-นามสกุล")
    .max(100, "ชื่อ-นามสกุลยาวเกินไป"),
  studentId: z.string().trim().max(20, "รหัสนักศึกษายาวเกินไป").optional(),
  email,
  phone: z.string().trim().max(20, "เบอร์โทรศัพท์ยาวเกินไป").optional(),
  // bcrypt ใช้ได้ไม่เกิน 72 ไบต์
  password: z
    .string({ error: "กรุณากรอกรหัสผ่าน" })
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .max(72, "รหัสผ่านยาวได้ไม่เกิน 72 ตัวอักษร"),
});

// เวลาแบบเต็มชั่วโมง "HH:00"
const hourTime = z
  .string({ error: "กรุณาระบุเวลา" })
  .regex(/^([01]\d|2[0-3]):00$/, "เวลาต้องเป็นต้นชั่วโมง เช่น 13:00");
const hourOf = (value: string) => Number(value.slice(0, 2));

// วันที่ "YYYY-MM-DD" ที่มีอยู่จริง (กัน 2026-02-31 ซึ่ง Date จะปัดเป็นเดือนถัดไป)
const dateKey = z
  .string({ error: "กรุณาระบุวันที่" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "วันที่ไม่ถูกต้อง")
  .refine((value) => toDateKey(fromDateKey(value)) === value, "วันที่ไม่ถูกต้อง");

// ฟอร์มจองห้อง
export const reservationSchema = z
  .object({
    roomId: z.coerce.number({ error: "ไม่พบห้องที่เลือก" }).int().positive("ไม่พบห้องที่เลือก"),
    purpose: z
      .string({ error: "กรุณาระบุวัตถุประสงค์" })
      .trim()
      .min(3, "กรุณาระบุวัตถุประสงค์อย่างน้อย 3 ตัวอักษร")
      .max(200, "วัตถุประสงค์ยาวได้ไม่เกิน 200 ตัวอักษร"),
    date: dateKey,
    startTime: hourTime,
    endTime: hourTime,
    attendees: z.coerce
      .number({ error: "กรุณาระบุจำนวนผู้เข้าร่วมเป็นตัวเลข" })
      .int("จำนวนผู้เข้าร่วมต้องเป็นจำนวนเต็ม")
      .min(1, "ต้องมีผู้เข้าร่วมอย่างน้อย 1 คน"),
  })
  .refine((d) => hourOf(d.endTime) > hourOf(d.startTime), {
    message: "เวลาสิ้นสุดต้องหลังเวลาเริ่ม",
    path: ["endTime"],
  })
  .refine((d) => hourOf(d.startTime) >= OPEN_HOUR && hourOf(d.endTime) <= CLOSE_HOUR, {
    message: `จองได้เฉพาะช่วง ${formatHour(OPEN_HOUR)} – ${formatHour(CLOSE_HOUR)} น.`,
    path: ["startTime"],
  })
  .refine((d) => hourOf(d.endTime) - hourOf(d.startTime) <= MAX_DURATION_HOURS, {
    message: `จองได้ครั้งละไม่เกิน ${MAX_DURATION_HOURS} ชั่วโมง`,
    path: ["endTime"],
  });

/** แปลงข้อผิดพลาดของ Zod เป็นข้อความเดียวที่อ่านง่าย */
export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง";
}
