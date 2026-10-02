// สร้างลิงก์ภายในแอปจากที่เดียว เพื่อให้รูปแบบ URL ตรงกันทุกหน้า

/** ลิงก์ไปหน้าตารางห้องว่าง เช่น /availability หรือ /availability?date=2026-10-01 */
export function availabilityHref(dateKey?: string): string {
  return dateKey ? `/availability?date=${dateKey}` : "/availability";
}

/** ลิงก์ไปหน้าจองห้อง เช่น /rooms/A1-101?date=2026-10-01&start=13&duration=2 */
export function bookRoomHref(
  roomCode: string,
  dateKey?: string,
  startHour?: number,
  durationHours?: number
): string {
  const params = new URLSearchParams();
  if (dateKey) params.set("date", dateKey);
  if (startHour !== undefined) params.set("start", String(startHour));
  if (durationHours !== undefined) params.set("duration", String(durationHours));
  const query = params.toString();
  return `/rooms/${encodeURIComponent(roomCode)}${query ? `?${query}` : ""}`;
}

/** ลิงก์ไปหน้ารายละเอียดการจอง */
export function reservationHref(reservationId: number, created = false): string {
  return `/reservations/${reservationId}${created ? "?created=1" : ""}`;
}
