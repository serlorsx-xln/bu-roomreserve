// API: POST /api/reservations — ส่งคำขอจองห้อง (สถานะเริ่มต้น PENDING)
// SQL ที่ใช้: SELECT (ห้อง) + SELECT/INSERT ภายในธุรกรรม (createReservationAtomically)
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isWithinBookingWindow } from "@/lib/availability";
import { MAX_ADVANCE_DAYS } from "@/lib/constants";
import { createReservationAtomically, findRoomWithBuilding } from "@/lib/db";
import { atHour } from "@/lib/format";
import { firstError, reservationSchema } from "@/lib/validation";

const CONFLICT_MESSAGE = "ช่วงเวลานี้มีการจองแล้ว กรุณาเลือกเวลาอื่น";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนจองห้อง" }, { status: 401 });

  // 1) รูปแบบข้อมูล: วันที่มีจริง ต้นชั่วโมง 08:00–20:00 ครั้งละ 1–4 ชั่วโมง (ดู validation.ts)
  const parsed = reservationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }
  const { roomId, purpose, date, startTime, endTime, attendees } = parsed.data;

  // 2) SELECT: ห้องต้องมีอยู่และเปิดให้จอง
  const room = findRoomWithBuilding(roomId);
  if (!room || room.status !== "AVAILABLE") {
    return NextResponse.json({ error: "ห้องนี้ไม่เปิดให้จองในขณะนี้" }, { status: 400 });
  }

  // 3) จำนวนผู้เข้าร่วมต้องไม่เกินความจุ
  if (attendees > room.capacity) {
    return NextResponse.json(
      { error: `จำนวนผู้เข้าร่วมเกินความจุของห้อง (สูงสุด ${room.capacity} คน)` },
      { status: 400 }
    );
  }

  // 4) ต้องอยู่ในช่วงที่จองได้ และไม่ใช่เวลาที่ผ่านไปแล้ว
  const startAt = atHour(date, Number(startTime.slice(0, 2)));
  const endAt = atHour(date, Number(endTime.slice(0, 2)));
  if (!isWithinBookingWindow(date)) {
    return NextResponse.json({ error: `จองล่วงหน้าได้ไม่เกิน ${MAX_ADVANCE_DAYS} วัน` }, { status: 400 });
  }
  if (startAt < new Date()) {
    return NextResponse.json({ error: "ไม่สามารถจองเวลาที่ผ่านไปแล้วได้" }, { status: 400 });
  }

  // 5) ห้ามทับกับการจองที่รออนุมัติหรืออนุมัติแล้วของห้องเดียวกัน
  //    ตรวจ (SELECT COUNT) และบันทึก (INSERT) ในธุรกรรมเดียวกัน (BEGIN IMMEDIATE … COMMIT)
  //    ถ้ามีคำขอสองรายการเข้ามาพร้อมกัน รายการที่สองต้องรอล็อก แล้วจะเห็นการจองแรกเสมอ
  const reservationId = createReservationAtomically({
    roomId,
    userId: user.id,
    purpose,
    startAt,
    endAt,
    attendees,
  });
  if (reservationId === null) {
    return NextResponse.json({ error: CONFLICT_MESSAGE }, { status: 409 });
  }
  return NextResponse.json({ reservation: { id: reservationId } }, { status: 201 });
}
