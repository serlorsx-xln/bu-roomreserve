// เติมข้อมูลตัวอย่างอัตโนมัติเมื่อฐานข้อมูลยังว่าง (รันใน container ตอนเปิดแอปครั้งแรก)
// ถ้ามีผู้ใช้อยู่แล้วจะข้าม — ข้อมูลจึงไม่ถูกลบทุกครั้งที่ restart
// ข้อมูลชุดเดียวกับ scripts/seed.ts (เวอร์ชัน JavaScript สำหรับ runtime ของ container)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";

process.env.TZ = "Asia/Bangkok";

const dbPath = process.env.DATABASE_PATH ?? "/app/data/dev.db";
const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");

// สร้างตารางถ้ายังไม่มี (เหมือนที่ src/lib/db.ts ทำ)
if (!db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='reservations'`).get()) {
  db.exec(readFileSync(join(process.cwd(), "sql", "schema.sql"), "utf-8"));
  console.log("สร้างตารางจาก sql/schema.sql แล้ว");
}

const { n } = db.prepare("SELECT COUNT(*) AS n FROM users").get();
if (n > 0) {
  console.log("ฐานข้อมูลมีข้อมูลอยู่แล้ว ข้ามการเติมข้อมูลตัวอย่าง");
  db.close();
  process.exit(0);
}

console.log("ฐานข้อมูลว่าง — กำลังเติมข้อมูลตัวอย่างของมหาวิทยาลัยกรุงเทพ...");

/** วันที่ (นับจากวันนี้) + ชั่วโมง → ข้อความ ISO เวลาไทย */
function at(dayOffset, hour) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  const pad = (v) => String(v).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

function toSql(date) {
  const th = new Date(date.getTime() + 7 * 3_600_000);
  const pad = (v) => String(v).padStart(2, "0");
  return (
    `${th.getUTCFullYear()}-${pad(th.getUTCMonth() + 1)}-${pad(th.getUTCDate())} ` +
    `${pad(th.getUTCHours())}:${pad(th.getUTCMinutes())}:${pad(th.getUTCSeconds())}`
  );
}
const hoursAgo = (h) => toSql(new Date(Date.now() - h * 3_600_000));

// ─── INSERT: ผู้ใช้ (รหัสผ่านทุกบัญชี: password123) ───
const passwordHash = bcrypt.hashSync("password123", 10);
const insertUser = db.prepare(
  `INSERT INTO users (full_name, student_id, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)`
);
const user = (email, fullName, role, phone, studentId) =>
  Number(insertUser.run(fullName, studentId ?? null, email, phone ?? null, passwordHash, role).lastInsertRowid);

const admin = user("admin@bu.ac.th", "สุดารัตน์ วงศ์ใหญ่", "ADMIN", "02-000-0000");
const teacher = user("teacher@bu.ac.th", "ดร.สมชาย ใจดี", "TEACHER", "02-111-1111");
const teacher2 = user("wanna.s@bu.ac.th", "อ.วรรณา ศรีสุข", "TEACHER");
const staff = user("staff@bu.ac.th", "มาลี สุขสันต์", "STAFF", "02-222-2222");
const student = user("student@bu.ac.th", "ปริญญา ตั้งใจเรียน", "STUDENT", null, "6512345678");
const student2 = user("thanakorn.r@bu.ac.th", "ธนกร รักการอ่าน", "STUDENT", null, "6598765432");

// ─── INSERT: อาคาร 8 หลังของวิทยาเขตรังสิต ───
const insertBuilding = db.prepare(`INSERT INTO buildings (building_name, number_of_floors) VALUES (?, ?)`);
const b = (name, floors) => Number(insertBuilding.run(name, floors).lastInsertRowid);
const a1 = b("อาคาร A1 (เรียนรวม A-Zone)", 9);
const a2 = b("อาคาร A2 (เรียนรวม A-Zone)", 7);
const c5 = b("อาคาร C5 (หอสมุดและคลังความรู้)", 8);
const c7 = b("อาคาร C7 (เรียนรวม C-Zone)", 7);
const c9 = b("อาคาร C9 (เรียนรวม C-Zone)", 6);
const it = b("อาคาร C11 (คณะเทคโนโลยีสารสนเทศและนวัตกรรม)", 11);
const c13 = b("อาคาร C13 (ห้องปฏิบัติการกลาง)", 5);
const k = b("อาคาร K (วิทยาลัยนวัตกรรมอุตสาหกรรมและเทคโนโลยี)", 8);

// ─── INSERT: ห้องเรียน 45 ห้อง ───
const insertRoom = db.prepare(
  `INSERT INTO rooms (room_code, capacity, room_type, has_projector, has_whiteboard, status, building_id)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);
const room = (code, capacity, roomType, projector, whiteboard, buildingId, status = "AVAILABLE") =>
  Number(insertRoom.run(code, capacity, roomType, projector, whiteboard, status, buildingId).lastInsertRowid);

const r = {
  a1_101: room("A1-101", 120, "LECTURE", 1, 1, a1),
  a1_102: room("A1-102", 120, "LECTURE", 1, 1, a1),
  a1_201: room("A1-201", 90, "LECTURE", 1, 1, a1),
  a1_202: room("A1-202", 90, "LECTURE", 1, 1, a1),
  a1_301: room("A1-301", 60, "LECTURE", 1, 1, a1),
  a1_302: room("A1-302", 60, "LECTURE", 1, 1, a1),
  a1_401: room("A1-401", 40, "LECTURE", 1, 1, a1),
  a1_501: room("A1-501", 80, "SEMINAR", 1, 1, a1),
  a2_101: room("A2-101", 100, "LECTURE", 1, 1, a2),
  a2_201: room("A2-201", 70, "LECTURE", 1, 1, a2),
  a2_202: room("A2-202", 70, "LECTURE", 1, 1, a2),
  a2_301: room("A2-301", 45, "LECTURE", 1, 0, a2),
  a2_302: room("A2-302", 45, "LECTURE", 1, 0, a2),
  a2_401: room("A2-401", 30, "MEETING", 0, 1, a2),
  c5_101: room("C5-101", 20, "MEETING", 1, 1, c5),
  c5_102: room("C5-102", 20, "MEETING", 1, 1, c5),
  c5_201: room("C5-201", 35, "LAB", 1, 1, c5),
  c5_301: room("C5-301", 50, "LECTURE", 1, 1, c5),
  c5_401: room("C5-401", 30, "SEMINAR", 0, 1, c5, "MAINTENANCE"),
  c7_101: room("C7-101", 80, "LECTURE", 1, 1, c7),
  c7_102: room("C7-102", 80, "LECTURE", 1, 1, c7),
  c7_201: room("C7-201", 50, "LECTURE", 1, 1, c7),
  c7_202: room("C7-202", 50, "LECTURE", 1, 1, c7),
  c7_301: room("C7-301", 40, "SEMINAR", 1, 1, c7),
  c7_401: room("C7-401", 25, "MEETING", 0, 1, c7),
  c9_101: room("C9-101", 60, "LECTURE", 1, 1, c9),
  c9_201: room("C9-201", 45, "LECTURE", 1, 1, c9),
  c9_202: room("C9-202", 45, "LECTURE", 1, 1, c9),
  c9_301: room("C9-301", 30, "MEETING", 1, 0, c9),
  if101: room("C11-301", 40, "LECTURE", 1, 1, it),
  if102: room("C11-302", 40, "LECTURE", 1, 1, it),
  if210: room("C11-503", 30, "LAB", 1, 0, it),
  if201: room("C11-701", 25, "SEMINAR", 1, 1, it),
  if301: room("C11-901", 60, "LECTURE", 1, 1, it),
  if501: room("C11-1001", 35, "LAB", 1, 1, it),
  if502: room("C11-1002", 35, "LAB", 1, 1, it),
  c13_101: room("C13-101", 36, "LAB", 1, 1, c13),
  c13_102: room("C13-102", 36, "LAB", 1, 1, c13),
  c13_201: room("C13-201", 28, "LAB", 1, 0, c13),
  c13_202: room("C13-202", 28, "LAB", 1, 0, c13),
  c13_301: room("C13-301", 45, "LECTURE", 1, 1, c13),
  k_201: room("K-201", 55, "LECTURE", 1, 1, k),
  k_301: room("K-301", 40, "LAB", 1, 1, k),
  k_401: room("K-401", 20, "MEETING", 1, 1, k),
  k_501: room("K-501", 65, "SEMINAR", 1, 1, k, "CLOSED"),
};

// ─── INSERT: การจอง ───
// [ห้อง, วัน(นับจากวันนี้), เริ่ม, สิ้นสุด, ผู้จอง, วัตถุประสงค์, จำนวนคน, สถานะ, ส่งเมื่อ(ชม.ที่แล้ว)]
const rows = [
  [r.if101, 0, 9, 12, teacher, "สอนชดเชยวิชา IT422 ระบบฐานข้อมูล", 38, "APPROVED", 70],
  [r.if210, 0, 13, 16, teacher, "ปฏิบัติการ SQL เบื้องต้น", 28, "APPROVED", 72],
  [r.a1_101, 0, 9, 11, teacher, "สอนวิชา IT201 การเขียนโปรแกรมคอมพิวเตอร์", 105, "APPROVED", 90],
  [r.a1_301, 0, 13, 15, teacher2, "สอนวิชา IT352 การวิเคราะห์และออกแบบระบบ", 55, "APPROVED", 66],
  [r.a2_101, 0, 10, 12, teacher, "ปฐมนิเทศนักศึกษารุ่น Freshy BU", 95, "APPROVED", 120],
  [r.a2_201, 0, 14, 16, staff, "อบรมการใช้ระบบลงทะเบียนของเจ้าหน้าที่", 60, "APPROVED", 48],
  [r.c7_101, 0, 9, 12, teacher2, "สอบกลางภาควิชาวิทยาการคอมพิวเตอร์", 70, "APPROVED", 100],
  [r.c7_201, 0, 13, 15, teacher, "สอนวิชา IT301 การเขียนโปรแกรมเชิงวัตถุ", 45, "APPROVED", 55],
  [r.c9_101, 0, 10, 12, staff, "ประชุมเตรียมงาน BU Open House", 50, "APPROVED", 40],
  [r.c13_101, 0, 9, 12, teacher2, "ปฏิบัติการวิชา IT224 วงจรดิจิทัล", 30, "APPROVED", 72],
  [r.c5_101, 0, 15, 16, student, "ประชุมชมรมนักศึกษา SIT", 15, "PENDING", 4],
  [r.if201, 1, 14, 17, student, "ประชุมกลุ่มโปรเจกต์วิชา IT422", 6, "PENDING", 5],
  [r.c13_201, 1, 9, 11, student2, "ซ้อมนำเสนองานกลุ่มวิชาวงจรไฟฟ้า", 8, "PENDING", 3],
  [r.a2_401, 1, 10, 12, staff, "ประชุมภาควิชาประจำเดือน", 15, "PENDING", 26],
  [r.c5_301, 1, 9, 11, teacher, "สอนวิชา IT497 เตรียมความพร้อมสู่โลกการทำงาน", 45, "APPROVED", 130],
  [r.a1_201, 1, 13, 16, teacher2, "สอบย่อยวิชา IT213 คณิตศาสตร์สำหรับวิทยาการคอมพิวเตอร์", 85, "APPROVED", 96],
  [r.a2_301, 1, 9, 10, student, "ประชุมสโมสรนักศึกษาคณะ SIT", 40, "PENDING", 6],
  [r.c7_301, 1, 10, 12, staff, "สัมมนาแนะแนวการศึกษาต่อระดับปริญญาโท", 35, "APPROVED", 60],
  [r.c13_202, 1, 13, 16, teacher, "ปฏิบัติการวิชา IT301 การเขียนโปรแกรมเชิงวัตถุ", 25, "APPROVED", 84],
  [r.k_201, 1, 9, 12, teacher2, "สอนวิชานวัตกรรมเทคโนโลยี 3D Printing เบื้องต้น", 50, "APPROVED", 110],
  [r.c9_201, 2, 9, 11, teacher, "สอนเสริมวิชา IT234 โครงสร้างข้อมูล", 42, "APPROVED", 70],
  [r.a1_401, 2, 13, 15, student, "ติวหนังสือกลุ่มย่อยวิชาคณิตศาสตร์ 1", 35, "PENDING", 9],
  [r.a2_202, 2, 10, 12, teacher2, "สอนวิชา IT352 การวิเคราะห์และออกแบบระบบ", 60, "APPROVED", 88],
  [r.c7_202, 2, 14, 17, staff, "อบรมพนักงานมหาวิทยาลัยเรื่องงานบริการนักศึกษา", 45, "APPROVED", 52],
  [r.c13_101, 2, 9, 12, teacher, "ปฏิบัติการวิชา IT224 วงจรดิจิทัล (กลุ่ม 2)", 26, "APPROVED", 78],
  [r.k_301, 2, 13, 16, teacher2, "ปฏิบัติการโปรเจกต์พิเศษวิชาโทนวัตกรรม", 38, "APPROVED", 64],
  [r.c5_102, 3, 10, 11, staff, "ประชุมคณะกรรมการกิจการนักศึกษา", 18, "APPROVED", 100],
  [r.a1_501, 3, 13, 17, teacher, "สัมมนาวิชาการระดับชาติเรื่อง AI for Education", 70, "APPROVED", 140],
  [r.a1_101, 3, 9, 12, teacher, "สอบกลางภาควิชา IT201 การเขียนโปรแกรมคอมพิวเตอร์", 110, "APPROVED", 160],
  [r.c7_401, 3, 9, 10, student, "ประชุมกรรมการนักศึกษา", 20, "PENDING", 7],
  [r.k_501, 4, 9, 12, teacher2, "บรรยายพิเศษ BU Startup Talk โดยศิษย์เก่า", 60, "APPROVED", 150],
  [r.a2_401, 4, 13, 15, staff, "ประชุมหน่วยงานกิจการนักศึกษา", 25, "APPROVED", 44],
  [r.c9_301, 4, 10, 12, student, "ซ้อมการแสดงคอนเสิร์ตประจำปี", 25, "PENDING", 5],
  [r.c13_301, 5, 9, 11, teacher, "สอนชดเชยวิชา IT224 วงจรดิจิทัล", 42, "APPROVED", 92],
  [r.a1_201, 5, 13, 15, teacher2, "สอบปลายภาควิชาคณิตศาสตร์สำหรับวิทยาการคอมพิวเตอร์", 80, "APPROVED", 120],
  [r.c7_101, 5, 13, 16, teacher, "สอบปลายภาควิชาวิทยาการคอมพิวเตอร์", 68, "APPROVED", 130],
  [r.a1_102, 7, 9, 12, teacher, "สอนวิชา IT201 การเขียนโปรแกรมคอมพิวเตอร์ (กลุ่ม 2)", 108, "APPROVED", 145],
  [r.a2_101, 7, 13, 16, teacher2, "สอนวิชา IT352 การวิเคราะห์และออกแบบระบบ (กลุ่ม 2)", 90, "APPROVED", 132],
  [r.k_201, 8, 9, 11, teacher, "สอนวิชานวัตกรรมเทคโนโลยี 3D Printing เบื้องต้น (กลุ่ม 2)", 52, "APPROVED", 118],
  [r.c5_101, 9, 13, 14, staff, "ประชุมทีมพัฒนาระบบห้องสมุดดิจิทัล", 12, "APPROVED", 36],
  [r.a1_301, 10, 9, 12, teacher2, "สอบปลายภาควิชา IT352 การวิเคราะห์และออกแบบระบบ", 55, "APPROVED", 155],
  [r.c13_102, 11, 13, 16, teacher, "ปฏิบัติการสอบวิชา IT224 วงจรดิจิทัล", 32, "APPROVED", 165],
  // ที่ผ่านมาแล้ว + ถูกปฏิเสธ/ยกเลิก
  [r.if201, -2, 13, 15, student, "ติวสอบย่อยวิชาสถิติ", 6, "APPROVED", 80],
  [r.a2_401, -1, 10, 11, student, "สัมภาษณ์งานโครงงาน", 4, "APPROVED", 60],
  [r.if301, 2, 18, 20, student, "จัดงานเลี้ยงสังสรรค์รุ่น", 55, "REJECTED", 30],
  [r.a2_201, 4, 9, 10, student, "ประชุมชมรมดนตรีไทย", 25, "CANCELLED", 90],
];

const insertReservation = db.prepare(
  `INSERT INTO reservations (purpose, start_datetime, end_datetime, attendees, status, created_at, room_id, user_id, approved_by, decided_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
for (const [roomId, day, start, end, by, purpose, attendees, status, sentHoursAgo] of rows) {
  const decided = status === "APPROVED" || status === "REJECTED";
  insertReservation.run(
    purpose, at(day, start), at(day, end), attendees, status, hoursAgo(sentHoursAgo),
    roomId, by, decided ? admin : null, decided ? hoursAgo(Math.max(sentHoursAgo - 2, 1)) : null
  );
}

console.log(`เติมข้อมูลเสร็จ: ผู้ใช้ 6 คน, อาคาร 8 หลัง, ห้อง ${Object.keys(r).length} ห้อง, การจอง ${rows.length} รายการ`);
db.close();
