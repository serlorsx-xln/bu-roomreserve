// API: PATCH /api/reservations/[id]
//   { action: "approve" | "reject" } — ผู้ดูแลระบบตัดสินคำขอที่รออนุมัติ (ความสัมพันธ์ APPROVES)
//   { action: "cancel" }             — เจ้าของยกเลิกการจองของตนเอง
// SQL ที่ใช้: SELECT (อ่านการจอง) + UPDATE แบบมีเงื่อนไข (updateReservationStatus)
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { BLOCKING_STATUSES } from "@/lib/constants";
import { findReservationDetail, updateReservationStatus } from "@/lib/db";
import { canCancel, canDecide } from "@/lib/reservation-rules";

type Params = { params: Promise<{ id: string }> };
type Action = "approve" | "reject" | "cancel";

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

  const id = Number((await params).id);
  const body = await request.json().catch(() => null);
  const action = body?.action as Action;
  if (!Number.isInteger(id) || !["approve", "reject", "cancel"].includes(action)) {
    return NextResponse.json({ error: "คำขอไม่ถูกต้อง" }, { status: 400 });
  }

  // SELECT: อ่านการจองที่ต้องการ (JOIN ห้อง/ผู้จอง เพื่อใช้กับกฎ canCancel/canDecide)
  const reservation = findReservationDetail(id);
  if (!reservation) return NextResponse.json({ error: "ไม่พบการจองนี้" }, { status: 404 });
  const now = new Date();

  // ─── ยกเลิก: เฉพาะเจ้าของ และต้องยังไม่ถึงเวลาสิ้นสุด ───
  if (action === "cancel") {
    if (reservation.userId !== user.id) {
      return NextResponse.json({ error: "ยกเลิกได้เฉพาะการจองของตนเอง" }, { status: 403 });
    }
    if (!canCancel(reservation, user.id, now)) {
      return NextResponse.json({ error: "การจองนี้ยกเลิกไม่ได้แล้ว" }, { status: 409 });
    }
    // UPDATE ... WHERE reservation_id = ? AND user_id = ? AND status IN (...) AND end_datetime > ?
    // อัปเดตแบบมีเงื่อนไข: ถ้าระหว่างนี้สถานะถูกเปลี่ยนไปแล้ว จะไม่มีแถวถูกแก้ (changed = 0)
    const changed = updateReservationStatus({
      reservationId: id,
      from: BLOCKING_STATUSES,
      to: "CANCELLED",
      endAfter: now,
    });
    // ตรวจสิทธิ์อีกครั้งหลัง UPDATE เพื่อให้ชัดว่าเงื่อนไข user_id ตรงกัน (กฎเดียวกับ canCancel)
    if (changed === 0) return NextResponse.json({ error: "การจองนี้ยกเลิกไม่ได้แล้ว" }, { status: 409 });
    return NextResponse.json({ ok: true });
  }

  // ─── อนุมัติ / ปฏิเสธ: เฉพาะผู้ดูแลระบบ และต้องเป็นคำขอที่รออนุมัติซึ่งยังไม่หมดเวลา ───
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
  }
  if (!canDecide(reservation, user.role, now)) {
    return NextResponse.json({ error: "คำขอนี้ไม่อยู่ในสถานะรออนุมัติแล้ว" }, { status: 409 });
  }
  // UPDATE ... SET status = ?, approved_by = ?, decided_at = ?
  //        WHERE reservation_id = ? AND status = 'PENDING' AND end_datetime > ?
  const changed = updateReservationStatus({
    reservationId: id,
    from: ["PENDING"],
    to: action === "approve" ? "APPROVED" : "REJECTED",
    approverId: user.id,
    endAfter: now,
  });
  if (changed === 0) return NextResponse.json({ error: "คำขอนี้ไม่อยู่ในสถานะรออนุมัติแล้ว" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
