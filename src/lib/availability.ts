// คำนวณช่วงเวลาว่าง/ไม่ว่างของห้อง — ใช้ร่วมกันทั้งหน้าตารางห้องว่าง หน้าจอง และ API
import type { Reservation } from "@/lib/types";
import { BLOCKING_STATUSES, CLOSE_HOUR, MAX_ADVANCE_DAYS, START_HOURS } from "@/lib/constants";
import { addDays, atHour, fromDateKey, toDateKey } from "@/lib/format";

/** ช่วงเวลาที่ถูกจอง — พอสำหรับคำนวณว่าง/ไม่ว่าง (ไม่มีข้อมูลส่วนตัวของผู้จอง ส่งให้เบราว์เซอร์ได้) */
export type BookedRange = Pick<Reservation, "startAt" | "endAt" | "status">;

/** ข้อมูลการจองสำหรับวาดตารางห้องว่าง (ต้องรู้วัตถุประสงค์และผู้จองด้วย) */
export type SlotReservation = BookedRange & Pick<Reservation, "id" | "purpose" | "reservedById">;

/** ช่วงเวลา [aStart, aEnd) กับ [bStart, bEnd) ทับกันหรือไม่ */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** ช่วงเวลานี้ว่าง (ไม่ชนการจองที่รออนุมัติหรืออนุมัติแล้ว) หรือไม่ */
export function isRangeFree(reservations: BookedRange[], start: Date, end: Date): boolean {
  return !reservations.some(
    (r) => BLOCKING_STATUSES.includes(r.status) && overlaps(start, end, r.startAt, r.endAt)
  );
}

/** วันที่นี้อยู่ในช่วงที่จองได้ (วันนี้ ถึง วันนี้ + 14 วัน) หรือไม่ */
export function isWithinBookingWindow(dateKey: string, now = new Date()): boolean {
  const day = fromDateKey(dateKey);
  const today = fromDateKey(toDateKey(now));
  return day >= today && day <= addDays(today, MAX_ADVANCE_DAYS);
}

// ─── แถวของห้องในหนึ่งวัน (ใช้วาดตารางห้อง × ชั่วโมง) ───

export type RowSegment =
  | { kind: "free"; hour: number }
  | { kind: "past"; hour: number }
  | { kind: "reservation"; startHour: number; endHour: number; reservation: SlotReservation };

/**
 * แบ่งวันของห้องหนึ่งห้องเป็นช่วง ๆ ตั้งแต่ 08:00 ถึง 20:00
 * - reservation: มีการจองอยู่ (กินหลายชั่วโมงได้)
 * - past: ชั่วโมงที่เริ่มไปแล้ว จองไม่ได้
 * - free: ว่าง จองได้
 */
export function buildDaySegments(
  dateKey: string,
  reservations: SlotReservation[],
  now = new Date()
): RowSegment[] {
  const blocking = reservations.filter((r) => BLOCKING_STATUSES.includes(r.status));
  const segments: RowSegment[] = [];

  let hour = START_HOURS[0];
  while (hour < CLOSE_HOUR) {
    const slotStart = atHour(dateKey, hour);
    const slotEnd = atHour(dateKey, hour + 1);
    const booking = blocking.find((r) => overlaps(slotStart, slotEnd, r.startAt, r.endAt));

    if (booking) {
      const endHour = Math.min(Math.ceil(hoursSinceMidnight(dateKey, booking.endAt)), CLOSE_HOUR);
      segments.push({ kind: "reservation", startHour: hour, endHour, reservation: booking });
      hour = Math.max(endHour, hour + 1);
    } else {
      segments.push(slotStart < now ? { kind: "past", hour } : { kind: "free", hour });
      hour += 1;
    }
  }
  return segments;
}

/** จำนวนชั่วโมง (มีทศนิยม) นับจากเที่ยงคืนของ dateKey */
function hoursSinceMidnight(dateKey: string, date: Date): number {
  return (date.getTime() - fromDateKey(dateKey).getTime()) / 3_600_000;
}

// ─── ตัวเลือกเวลาเริ่ม (ใช้ในหน้าจอง) ───

export type StartOption = {
  hour: number;
  available: boolean;
  /** เหตุผลที่จองไม่ได้ (แสดงให้ผู้ใช้เห็น) */
  reason?: "ผ่านไปแล้ว" | "มีการจองแล้ว" | "เกินเวลาเปิด";
};

/** ตัวเลือกเวลาเริ่มทุกชั่วโมง พร้อมบอกว่าจองได้ไหมสำหรับระยะเวลา n ชั่วโมง */
export function buildStartOptions(
  dateKey: string,
  reservations: BookedRange[],
  durationHours: number,
  now = new Date()
): StartOption[] {
  return START_HOURS.map((hour) => {
    const start = atHour(dateKey, hour);
    const end = atHour(dateKey, hour + durationHours);
    if (start < now) return { hour, available: false, reason: "ผ่านไปแล้ว" };
    if (hour + durationHours > CLOSE_HOUR) return { hour, available: false, reason: "เกินเวลาเปิด" };
    if (!isRangeFree(reservations, start, end)) {
      return { hour, available: false, reason: "มีการจองแล้ว" };
    }
    return { hour, available: true };
  });
}

/** วันนี้ยังมีช่วงว่างสำหรับระยะเวลา n ชั่วโมงอยู่ไหม */
export function hasAvailability(
  dateKey: string,
  reservations: BookedRange[],
  durationHours: number,
  now = new Date()
): boolean {
  return buildStartOptions(dateKey, reservations, durationHours, now).some((o) => o.available);
}
