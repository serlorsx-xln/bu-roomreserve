// ค่าคงที่และข้อความที่ใช้ร่วมกันทั้งแอป
import type { ReservationStatus, RoomStatus, RoomType, UserRole } from "@/lib/types";

// ─── กฎการจอง (ตรงกับ PRODUCT.md) ───

/** เปิดให้จองตั้งแต่ 08:00 */
export const OPEN_HOUR = 8;
/** จองได้ถึง 20:00 */
export const CLOSE_HOUR = 20;
/** จองล่วงหน้าได้ไม่เกินกี่วัน */
export const MAX_ADVANCE_DAYS = 14;
/** ระยะเวลาที่ให้เลือกในหน้าจอง (ชั่วโมง) */
export const DURATION_OPTIONS = [1, 2, 3, 4] as const;
/** จองได้ครั้งละไม่เกินกี่ชั่วโมง (API ตรวจค่านี้ด้วย) */
export const MAX_DURATION_HOURS = DURATION_OPTIONS[DURATION_OPTIONS.length - 1];
/** ตัวกรองจำนวนที่นั่งขั้นต่ำในหน้าห้องว่าง */
export const CAPACITY_FILTERS = [20, 40, 60, 100] as const;

/** ชั่วโมงเริ่มต้นที่จองได้: 8, 9, …, 19 */
export const START_HOURS = Array.from(
  { length: CLOSE_HOUR - OPEN_HOUR },
  (_, i) => OPEN_HOUR + i
);

/** สถานะที่ "กันช่วงเวลา" — ห้ามจองทับ */
export const BLOCKING_STATUSES: ReservationStatus[] = ["PENDING", "APPROVED"];

// ─── ข้อความภาษาไทย ───

export const RESERVATION_STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING: "รออนุมัติ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ถูกปฏิเสธ",
  CANCELLED: "ยกเลิกแล้ว",
};

export const ROLE_LABEL: Record<UserRole, string> = {
  STUDENT: "นักศึกษา",
  TEACHER: "อาจารย์",
  STAFF: "เจ้าหน้าที่",
  ADMIN: "ผู้ดูแลระบบ",
};

export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  LECTURE: "ห้องบรรยาย",
  LAB: "ห้องปฏิบัติการ",
  SEMINAR: "ห้องสัมมนา",
  MEETING: "ห้องประชุม",
};

export const ROOM_STATUS_LABEL: Record<RoomStatus, string> = {
  AVAILABLE: "ว่าง",
  RESERVED: "ถูกจอง",
  MAINTENANCE: "ปิดปรับปรุง",
};

/** ห้องเปิดให้จองไหม — ห้องที่ "ถูกจอง" ยังจองช่วงเวลาอื่นได้ ยกเว้นปิดปรับปรุง */
export function isRoomBookable(status: RoomStatus): boolean {
  return status !== "MAINTENANCE";
}

/** คำที่ใช้บ่อยในช่องวัตถุประสงค์ — กดแล้วเติมให้ */
export const PURPOSE_PRESETS = [
  "สอนชดเชย",
  "สอบ",
  "ติวหนังสือ",
  "ประชุม",
  "กิจกรรมชมรม",
] as const;
