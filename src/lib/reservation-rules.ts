// กฎว่าการจองหนึ่งรายการ "ทำอะไรได้บ้าง" — ใช้ทั้งหน้าเว็บ (แสดง/ซ่อนปุ่ม) และ API (ตรวจสิทธิ์จริง)
// เขียนไว้ที่เดียว เพื่อให้หน้าเว็บกับ API ใช้เงื่อนไขเดียวกันเสมอ
import type { Reservation, ReservationStatus, UserRole } from "@/lib/types";
import { BLOCKING_STATUSES } from "@/lib/constants";

type RuleInput = Pick<Reservation, "status" | "endAt" | "userId">;

/** เจ้าของยกเลิกได้ ถ้ายังรออนุมัติหรืออนุมัติแล้ว และยังไม่ถึงเวลาสิ้นสุด */
export function canCancel(reservation: RuleInput, userId: number, now = new Date()): boolean {
  return (
    reservation.userId === userId &&
    BLOCKING_STATUSES.includes(reservation.status) &&
    reservation.endAt > now
  );
}

/** ผู้ดูแลระบบอนุมัติ/ปฏิเสธได้ เฉพาะคำขอที่รออนุมัติและยังไม่ถึงเวลาสิ้นสุด */
export function canDecide(reservation: RuleInput, role: UserRole, now = new Date()): boolean {
  return role === "ADMIN" && reservation.status === "PENDING" && reservation.endAt > now;
}

/** สถานะที่แสดงบนหน้าเว็บ: คำขอที่ไม่มีใครพิจารณาจนเลยเวลาใช้ห้อง แสดงเป็น "หมดอายุ" */
export type DisplayStatus = ReservationStatus | "EXPIRED";

export function displayStatus(reservation: Pick<Reservation, "status" | "endAt">, now = new Date()): DisplayStatus {
  return reservation.status === "PENDING" && reservation.endAt <= now ? "EXPIRED" : reservation.status;
}
