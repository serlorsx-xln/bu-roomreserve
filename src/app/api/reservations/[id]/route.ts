// API: PATCH /api/reservations/[id]
//   { action: "approve" | "reject" }      — ผู้ดูแลระบบตัดสินใบจองที่รออนุมัติ (ความสัมพันธ์ APPROVES)
//   { action: "cancel", reason?: string } — เจ้าของหรือผู้ดูแลระบบยกเลิก → ออกใบยกเลิก (ตาราง cancellations)
// SQL ที่ใช้: SELECT (อ่านใบจอง) + ธุรกรรม UPDATE/INSERT (decideReservation, cancelReservation)
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { cancelReservation, decideReservation, findReservationDetail } from "@/lib/db";
import { canCancel, canDecide } from "@/lib/reservation-rules";
import { cancelSchema, firstError } from "@/lib/validation";

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

  // SELECT: อ่านใบจองที่ต้องการ (ใช้กับกฎ canCancel/canDecide)
  const reservation = findReservationDetail(id);
  if (!reservation) return NextResponse.json({ error: "ไม่พบการจองนี้" }, { status: 404 });
  const now = new Date();

  // ─── ยกเลิก: เจ้าของใบจองหรือผู้ดูแลระบบ และต้องยังไม่ถึงเวลาสิ้นสุด ───
  if (action === "cancel") {
    if (reservation.reservedById !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "ยกเลิกได้เฉพาะการจองของตนเอง" }, { status: 403 });
    }
    if (!canCancel(reservation, user, now)) {
      return NextResponse.json({ error: "การจองนี้ยกเลิกไม่ได้แล้ว" }, { status: 409 });
    }
    const parsed = cancelSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });

    // ธุรกรรม: UPDATE ใบจอง → INSERT ใบยกเลิก (cancelled_by = ผู้กดยกเลิก) → UPDATE ห้องกลับเป็นว่าง
    const cancellationId = cancelReservation({
      reservationId: id,
      cancelledById: user.id,
      reason: parsed.data.reason || null,
      // ผู้ใช้ทั่วไปยกเลิกได้เฉพาะใบจองของตัวเอง (เงื่อนไขซ้ำใน WHERE อีกชั้น)
      onlyReservedBy: user.role === "ADMIN" ? undefined : user.id,
      now,
    });
    if (cancellationId === null) return NextResponse.json({ error: "การจองนี้ยกเลิกไม่ได้แล้ว" }, { status: 409 });
    return NextResponse.json({ ok: true, cancellation: { id: cancellationId } });
  }

  // ─── อนุมัติ / ปฏิเสธ: เฉพาะผู้ดูแลระบบ และต้องเป็นใบจองที่รออนุมัติซึ่งยังไม่หมดเวลา ───
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 });
  }
  if (!canDecide(reservation, user.role, now)) {
    return NextResponse.json({ error: "คำขอนี้ไม่อยู่ในสถานะรออนุมัติแล้ว" }, { status: 409 });
  }
  // UPDATE ... SET status = ?, approved_by = ?, decided_at = ? WHERE reservation_id = ? AND status = 'PENDING' ...
  const ok = decideReservation({
    reservationId: id,
    decision: action === "approve" ? "APPROVED" : "REJECTED",
    approverId: user.id,
    now,
  });
  if (!ok) return NextResponse.json({ error: "คำขอนี้ไม่อยู่ในสถานะรออนุมัติแล้ว" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
