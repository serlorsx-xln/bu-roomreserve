// จัดรูปแบบวันที่และเวลาแบบไทย (ปี พ.ศ., เวลา 24 ชั่วโมง)
// ทุกฟังก์ชันใช้เวลาท้องถิ่นของเครื่อง: ฝั่งเซิร์ฟเวอร์ถูกตั้งเป็น Asia/Bangkok ใน src/instrumentation.ts
// (และใน scripts/seed.mjs) ส่วนฝั่งเบราว์เซอร์ใช้เวลาของเครื่องผู้ใช้ ซึ่งอยู่ในประเทศไทย
//
// ใช้ตารางชื่อวัน/เดือนของเราเองแทน Intl.DateTimeFormat เพราะ Node (ฝั่งเซิร์ฟเวอร์)
// กับเบราว์เซอร์ใช้ข้อมูล locale คนละเวอร์ชัน เช่น ชื่อวันแบบย่อได้ "พ." กับ "พุธ"
// ซึ่งทำให้ข้อความที่เรนเดอร์สองฝั่งไม่ตรงกัน (hydration mismatch)

const WEEKDAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const WEEKDAYS_SHORT = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const MONTHS_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

/** ปี ค.ศ. → ปี พ.ศ. */
const buddhistYear = (date: Date) => date.getFullYear() + 543;
const pad = (value: number) => String(value).padStart(2, "0");

// ─── คีย์วันที่ "YYYY-MM-DD" (ใช้ใน URL และฐานข้อมูล) ───

/** Date → "2026-10-01" (ตามเวลาท้องถิ่น) */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "2026-10-01" → Date เวลา 00:00 ของวันนั้น */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** ตรวจว่าเป็นคีย์วันที่ที่ถูกรูปแบบหรือไม่ */
export function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Date ของวันที่ key เวลา hour:00 */
export function atHour(key: string, hour: number): Date {
  const date = fromDateKey(key);
  date.setHours(hour, 0, 0, 0);
  return date;
}

/** เลื่อนวันที่ไป n วัน (คืนค่า Date ใหม่) */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

// ─── ข้อความที่แสดงผล ───

/** "วันพฤหัสบดีที่ 1 ตุลาคม 2569" */
export function formatDateLong(date: Date): string {
  return `วัน${WEEKDAYS[date.getDay()]}ที่ ${date.getDate()} ${MONTHS[date.getMonth()]} ${buddhistYear(date)}`;
}

/** "พฤ. 1 ต.ค. 2569" */
export function formatDateMedium(date: Date): string {
  return `${formatDateShort(date)} ${buddhistYear(date)}`;
}

/** "พฤ. 1 ต.ค." */
export function formatDateShort(date: Date): string {
  return `${WEEKDAYS_SHORT[date.getDay()]} ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

/** "1 ต.ค." */
export const formatDayMonth = (date: Date) => `${date.getDate()} ${formatMonthShort(date)}`;

/** "ต.ค." */
export const formatMonthShort = (date: Date) => MONTHS_SHORT[date.getMonth()];

/** "วันพฤหัสบดี" */
export const formatWeekday = (date: Date) => `วัน${WEEKDAYS[date.getDay()]}`;

/** { month: "ตุลาคม", year: "2569" } */
export function formatMonthYear(date: Date) {
  return { month: MONTHS[date.getMonth()], year: String(buddhistYear(date)) };
}

/** "13:00" */
export const formatTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** 13 → "13:00" */
export const formatHour = (hour: number) => `${pad(hour)}:00`;

/** "13:00 – 15:00 น." */
export function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime(start)} – ${formatTime(end)} น.`;
}

/** "วันนี้" / "พรุ่งนี้" / "เมื่อวาน" หรือ null ถ้าไกลกว่านั้น */
export function relativeDayLabel(date: Date, now = new Date()): string | null {
  const diff = Math.round(
    (fromDateKey(toDateKey(date)).getTime() - fromDateKey(toDateKey(now)).getTime()) /
      86_400_000
  );
  if (diff === 0) return "วันนี้";
  if (diff === 1) return "พรุ่งนี้";
  if (diff === -1) return "เมื่อวาน";
  return null;
}

/** "เมื่อสักครู่" / "15 นาทีที่แล้ว" / "2 ชั่วโมงที่แล้ว" / "3 วันที่แล้ว" (ปัดลง: 90 นาที = 1 ชั่วโมง) */
export function formatTimeAgo(date: Date, now = new Date()): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  return `${Math.floor(hours / 24)} วันที่แล้ว`;
}
