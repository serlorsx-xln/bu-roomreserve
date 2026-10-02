// เติมข้อมูลตัวอย่างของมหาวิทยาลัยกรุงเทพด้วยคำสั่ง SQL ตรง (node:sqlite ที่มากับ Node)
//   node scripts/seed.mjs             ล้างข้อมูลเดิมแล้วเติมใหม่ (npm run db:seed)
//   node scripts/seed.mjs --if-empty  เติมเฉพาะเมื่อฐานข้อมูลยังว่าง (ใช้ใน container ตอนเปิดแอป)
// วันที่ของการจองอ้างอิงจาก "วันนี้" — SQL ทั้งหมดของแอปอยู่ที่ src/lib/db.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";

// คิดเวลาตามเวลาไทยเสมอ ไม่ว่าเครื่องจะตั้ง time zone ไว้อย่างไร
process.env.TZ = "Asia/Bangkok";

const ifEmpty = process.argv.includes("--if-empty");
const db = new DatabaseSync(process.env.DATABASE_PATH ?? "prisma/dev.db", { enableForeignKeyConstraints: true });
db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");

// ─── โครงสร้างตาราง ───
const tableExists = (name) => db.prepare(`SELECT 1 FROM sqlite_master WHERE type='table' AND name=?`).get(name);
// ฐานข้อมูลรุ่นเก่า (ก่อนมีตาราง cancellations / ห้องยังใช้ room_id) — ลบทิ้งแล้วสร้างใหม่ตาม schema ปัจจุบัน
if (tableExists("reservations") && !tableExists("cancellations")) {
  console.log("พบโครงสร้างตารางรุ่นเก่า — ลบแล้วสร้างใหม่จาก sql/schema.sql");
  db.exec("PRAGMA foreign_keys = OFF; DROP TABLE IF EXISTS reservations; DROP TABLE IF EXISTS rooms; DROP TABLE IF EXISTS buildings; DROP TABLE IF EXISTS users; PRAGMA foreign_keys = ON;");
}
db.exec(readFileSync(join(process.cwd(), "sql", "schema.sql"), "utf-8")); // CREATE TABLE IF NOT EXISTS

if (ifEmpty && db.prepare("SELECT COUNT(*) AS n FROM users").get().n > 0) {
  console.log("ฐานข้อมูลมีข้อมูลอยู่แล้ว ข้ามการเติมข้อมูลตัวอย่าง");
  db.close();
  process.exit(0);
}

// ─── ตัวช่วยเรื่องเวลา ───
const pad = (v) => String(v).padStart(2, "0");

/** วันที่ (นับจากวันนี้) + ชั่วโมง → ข้อความ ISO เวลาไทย เช่น "2026-10-01 09:00:00" */
function at(dayOffset, hour) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(hour)}:00:00`;
}

/** เวลาย้อนหลังจากตอนนี้ n ชั่วโมง (ใช้เป็นเวลาที่ส่งคำขอ/ตัดสิน/ยกเลิก) */
function hoursAgo(hours) {
  const th = new Date(Date.now() - hours * 3_600_000 + 7 * 3_600_000);
  return (
    `${th.getUTCFullYear()}-${pad(th.getUTCMonth() + 1)}-${pad(th.getUTCDate())} ` +
    `${pad(th.getUTCHours())}:${pad(th.getUTCMinutes())}:${pad(th.getUTCSeconds())}`
  );
}

db.exec("BEGIN");
try {
  // DELETE — ลบจากลูกไปหาแม่ ตามความสัมพันธ์ของตาราง
  db.exec(
    "DELETE FROM cancellations; DELETE FROM reservations; DELETE FROM rooms; DELETE FROM buildings; DELETE FROM users; DELETE FROM faculties;"
  );
  db.exec("DELETE FROM sqlite_sequence"); // ให้เลขรัน (AUTOINCREMENT) เริ่มที่ 1 ใหม่

  // ─── INSERT: คณะของมหาวิทยาลัยกรุงเทพ ───
  const insertFaculty = db.prepare(`INSERT INTO faculties (faculty_name) VALUES (?)`);
  const faculty = (name) => Number(insertFaculty.run(name).lastInsertRowid);
  const BUS = faculty("คณะบริหารธุรกิจ");
  faculty("คณะบัญชี");
  faculty("คณะนิเทศศาสตร์");
  faculty("คณะมนุษยศาสตร์และการจัดการการท่องเที่ยว");
  faculty("คณะนิติศาสตร์");
  faculty("คณะเศรษฐศาสตร์และการลงทุน");
  const IT = faculty("คณะเทคโนโลยีสารสนเทศและนวัตกรรม");
  const ENG = faculty("คณะวิศวกรรมศาสตร์");
  faculty("คณะสถาปัตยกรรมศาสตร์");
  faculty("คณะดิจิทัลมีเดียและศิลปะภาพยนตร์");
  faculty("คณะศิลปกรรมศาสตร์");
  faculty("คณะการสร้างเจ้าของธุรกิจและการบริหารกิจการ");
  faculty("วิทยาลัยนานาชาติ");

  // ─── INSERT: ผู้ใช้งาน (รหัส 10 หลัก ใช้เข้าสู่ระบบ — รหัสผ่านทุกบัญชี: password123) ───
  const passwordHash = bcrypt.hashSync("password123", 10);
  const insertUser = db.prepare(
    `INSERT INTO users (user_id, full_name, email, phone, password_hash, role, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const user = (id, fullName, email, role, facultyId = null, phone = null) => {
    insertUser.run(id, fullName, email, phone, passwordHash, role, facultyId);
    return id;
  };
  var ADMIN = user("5000000001", "สุดารัตน์ วงศ์ใหญ่", "admin@bu.ac.th", "ADMIN", null, "02-000-0000");
  var T1 = user("5100000001", "ดร.สมชาย ใจดี", "somchai.j@bu.ac.th", "TEACHER", IT, "02-111-1111");
  var T2 = user("5100000002", "อ.วรรณา ศรีสุข", "wanna.s@bu.ac.th", "TEACHER", ENG);
  var STAFF = user("5200000001", "มาลี สุขสันต์", "malee.s@bu.ac.th", "STAFF", null, "02-222-2222");
  var S1 = user("1650012345", "ปริญญา ตั้งใจเรียน", "parinya.t@bumail.net", "STUDENT", IT, "081-234-5678");
  var S2 = user("1660054321", "ธนกร รักการอ่าน", "thanakorn.r@bumail.net", "STUDENT", ENG);
  user("1670700001", "กมลชนก ศรีวงศ์", "kamonchanok.s@bumail.net", "STUDENT", BUS);

  // ─── INSERT: อาคารของมหาวิทยาลัยกรุงเทพ (วิทยาเขตรังสิต) ───
  const insertBuilding = db.prepare(`INSERT INTO buildings (building_name, number_of_floors) VALUES (?, ?)`);
  const b = (name, floors) => Number(insertBuilding.run(name, floors).lastInsertRowid);
  const a1 = b("อาคาร A1 (เรียนรวม A-Zone)", 9);
  const a2 = b("อาคาร A2 (เรียนรวม A-Zone)", 7);
  const c5 = b("อาคาร C5 (หอสมุดและคลังความรู้)", 8);
  const c7 = b("อาคาร C7 (เรียนรวม C-Zone)", 7);
  const c9 = b("อาคาร C9 (เรียนรวม C-Zone)", 6);
  const it = b("อาคาร C11 (คณะเทคโนโลยีสารสนเทศและนวัตกรรม)", 11);
  const c13 = b("อาคาร C13 (ห้องปฏิบัติการกลาง)", 5);
  const k = b("อาคาร K (ศูนย์นวัตกรรมและเทคโนโลยี)", 8);

  // ─── INSERT: ห้องเรียน — room_code เป็น PK ───
  // [รหัสห้อง, ที่นั่ง, ประเภท, โปรเจกเตอร์, ไวท์บอร์ด, อาคาร, สถานะ(ไม่ระบุ = ว่าง)]
  const rooms = [
  // ─── อาคาร A1 (เรียนรวม A-Zone) — ห้องบรรยายขนาดใหญ่ ───
  ["A1-101", 120, "LECTURE", 1, 1, a1],
  ["A1-102", 120, "LECTURE", 1, 1, a1],
  ["A1-201", 90, "LECTURE", 1, 1, a1],
  ["A1-202", 90, "LECTURE", 1, 1, a1],
  ["A1-301", 60, "LECTURE", 1, 1, a1],
  ["A1-302", 60, "LECTURE", 1, 1, a1],
  ["A1-401", 40, "LECTURE", 1, 1, a1],
  ["A1-501", 80, "SEMINAR", 1, 1, a1],
  // ─── อาคาร A2 (เรียนรวม A-Zone) ───
  ["A2-101", 100, "LECTURE", 1, 1, a2],
  ["A2-201", 70, "LECTURE", 1, 1, a2],
  ["A2-202", 70, "LECTURE", 1, 1, a2],
  ["A2-301", 45, "LECTURE", 1, 0, a2],
  ["A2-302", 45, "LECTURE", 1, 0, a2],
  ["A2-401", 30, "MEETING", 0, 1, a2],
  // ─── อาคาร C5 (หอสมุดและคลังความรู้) — ห้องกลุ่ม/ประชุม ───
  ["C5-101", 20, "MEETING", 1, 1, c5],
  ["C5-102", 20, "MEETING", 1, 1, c5],
  ["C5-201", 35, "LAB", 1, 1, c5],
  ["C5-301", 50, "LECTURE", 1, 1, c5],
  ["C5-401", 30, "SEMINAR", 0, 1, c5, "MAINTENANCE"],
  // ─── อาคาร C7 (เรียนรวม C-Zone) ───
  ["C7-101", 80, "LECTURE", 1, 1, c7],
  ["C7-102", 80, "LECTURE", 1, 1, c7],
  ["C7-201", 50, "LECTURE", 1, 1, c7],
  ["C7-202", 50, "LECTURE", 1, 1, c7],
  ["C7-301", 40, "SEMINAR", 1, 1, c7],
  ["C7-401", 25, "MEETING", 0, 1, c7],
  // ─── อาคาร C9 (เรียนรวม C-Zone) ───
  ["C9-101", 60, "LECTURE", 1, 1, c9],
  ["C9-201", 45, "LECTURE", 1, 1, c9],
  ["C9-202", 45, "LECTURE", 1, 1, c9],
  ["C9-301", 30, "MEETING", 1, 0, c9],
  // ─── อาคาร C11 (คณะเทคโนโลยีสารสนเทศและนวัตกรรม) ───
  ["C11-301", 40, "LECTURE", 1, 1, it],
  ["C11-302", 40, "LECTURE", 1, 1, it],
  ["C11-503", 30, "LAB", 1, 0, it],
  ["C11-701", 25, "SEMINAR", 1, 1, it],
  ["C11-901", 60, "LECTURE", 1, 1, it],
  ["C11-1001", 35, "LAB", 1, 1, it],
  ["C11-1002", 35, "LAB", 1, 1, it],
  // ─── อาคาร C13 (ห้องปฏิบัติการกลาง) ───
  ["C13-101", 36, "LAB", 1, 1, c13],
  ["C13-102", 36, "LAB", 1, 1, c13],
  ["C13-201", 28, "LAB", 1, 0, c13],
  ["C13-202", 28, "LAB", 1, 0, c13],
  ["C13-301", 45, "LECTURE", 1, 1, c13],
  // ─── อาคาร K (วิทยาลัยนวัตกรรมอุตสาหกรรมและเทคโนโลยี) ───
  ["K-201", 55, "LECTURE", 1, 1, k],
  ["K-301", 40, "LAB", 1, 1, k],
  ["K-401", 20, "MEETING", 1, 1, k],
  ["K-501", 65, "SEMINAR", 1, 1, k, "MAINTENANCE"],
  ];
  const insertRoom = db.prepare(
    `INSERT INTO rooms (room_code, capacity, room_type, has_projector, has_whiteboard, status, building_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  for (const [code, capacity, type, projector, whiteboard, buildingId, status = "AVAILABLE"] of rooms) {
    insertRoom.run(code, capacity, type, projector, whiteboard, status, buildingId);
  }

  // ─── INSERT: ใบจอง (+ ใบยกเลิกสำหรับรายการที่ถูกยกเลิก) ───
  // [ห้อง, วัน(นับจากวันนี้), เริ่ม, สิ้นสุด, ผู้จอง, วัตถุประสงค์, จำนวนคน, สถานะ, ส่งเมื่อ(ชม.ที่แล้ว), ผู้ยกเลิก?, เหตุผล?]
  const reservations = [
  // วันนี้
  ["C11-301", 0, 9, 12, T1, "สอนชดเชยวิชา IT422 ระบบฐานข้อมูล", 38, "APPROVED", 70],
  ["C11-503", 0, 13, 16, T1, "ปฏิบัติการ SQL เบื้องต้น", 28, "APPROVED", 72],
  ["A1-101", 0, 10, 12, STAFF, "ปฐมนิเทศนักศึกษารุ่น Freshy BU", 90, "APPROVED", 120],
  ["C7-101", 0, 8, 10, T2, "สอบย่อยวิชากลศาสตร์วิศวกรรม", 45, "APPROVED", 96],
  ["A2-401", 0, 14, 15, STAFF, "ประชุมคณะกรรมการหลักสูตร", 12, "APPROVED", 50],
  ["C11-901", 0, 17, 19, S1, "กิจกรรมชมรมถ่ายภาพ", 35, "APPROVED", 40],
  // พรุ่งนี้
  ["C11-301", 1, 9, 12, T1, "สอนวิชา IT422 ระบบฐานข้อมูล", 40, "APPROVED", 150],
  ["C11-701", 1, 14, 17, S1, "ประชุมกลุ่มโปรเจกต์วิชา CS430", 6, "PENDING", 5],
  ["A2-201", 1, 13, 16, T2, "สัมมนาโครงงานพิเศษ", 60, "APPROVED", 48],
  ["C13-101", 1, 9, 11, S2, "ซ้อมนำเสนองานกลุ่มวิชาวงจรไฟฟ้า", 8, "PENDING", 3],
  ["A2-401", 1, 10, 12, STAFF, "ประชุมภาควิชาประจำเดือน", 15, "PENDING", 26],
  // อีก 2–7 วัน
  ["C11-302", 2, 10, 12, T1, "สอนเสริมวิชา IT234 โครงสร้างข้อมูล", 35, "APPROVED", 60],
  ["C11-503", 2, 9, 12, S2, "ติวเขียนโปรแกรมก่อนสอบกลางภาค", 20, "PENDING", 8],
  ["C11-901", 2, 18, 20, S1, "จัดงานเลี้ยงสังสรรค์รุ่น", 55, "REJECTED", 30],
  ["A1-101", 3, 13, 16, T2, "สอบกลางภาควิชาฟิสิกส์ทั่วไป", 110, "APPROVED", 200],
  ["C11-701", 3, 9, 11, S1, "ติวหนังสือกลุ่มย่อย", 5, "PENDING", 2],
  ["A2-201", 4, 9, 10, S1, "ประชุมชมรมดนตรีไทย", 25, "CANCELLED", 90, S1, "ย้ายไปซ้อมที่หอประชุมแทน"],
  ["C9-202", 2, 13, 15, T1, "สอนเสริมวิชา IT234 โครงสร้างข้อมูล (กลุ่ม 2)", 40, "CANCELLED", 50, ADMIN, "ห้องปิดซ่อมเครื่องปรับอากาศชั่วคราว"],
  ["C11-302", 1, 15, 17, S2, "ติวสอบกลางภาคกลุ่มเล็ก", 12, "CANCELLED", 20, S2, null],
  ["C7-101", 5, 13, 15, T2, "บรรยายพิเศษ BU Startup Talk โดยศิษย์เก่า", 48, "APPROVED", 100],
  ["C11-301", 7, 9, 12, T1, "สอนวิชา IT422 ระบบฐานข้อมูล", 40, "APPROVED", 150],
  // ที่ผ่านมาแล้ว
  ["C11-701", -2, 13, 15, S1, "ติวสอบย่อยวิชาสถิติ", 6, "APPROVED", 80],
  ["A2-401", -1, 10, 11, S1, "สัมภาษณ์งานโครงงาน", 4, "APPROVED", 60],
  // ─── ห้องอาคารอื่น ๆ ทั่ววิทยาเขต ───
  ["A1-102", 0, 9, 11, T1, "สอนวิชา IT201 การเขียนโปรแกรมคอมพิวเตอร์", 105, "APPROVED", 90],
  ["A1-301", 0, 13, 15, T2, "สอนวิชา IT352 การวิเคราะห์และออกแบบระบบ", 55, "APPROVED", 66],
  ["A2-101", 0, 10, 12, T1, "ปฐมนิเทศนักศึกษารุ่น Freshy BU", 95, "APPROVED", 120],
  ["A2-201", 0, 14, 16, STAFF, "อบรมการใช้ระบบลงทะเบียนของเจ้าหน้าที่", 60, "APPROVED", 48],
  ["C7-102", 0, 9, 12, T2, "สอบกลางภาควิชาวิทยาการคอมพิวเตอร์", 70, "APPROVED", 100],
  ["C7-201", 0, 13, 15, T1, "สอนวิชา IT301 การเขียนโปรแกรมเชิงวัตถุ", 45, "APPROVED", 55],
  ["C9-101", 0, 10, 12, STAFF, "ประชุมเตรียมงาน BU Open House", 50, "APPROVED", 40],
  ["C13-101", 0, 9, 12, T2, "ปฏิบัติการวิชา IT224 วงจรดิจิทัล", 30, "APPROVED", 72],
  ["C5-101", 0, 15, 16, S1, "ประชุมชมรมนักศึกษา SIT", 15, "PENDING", 4],
  ["C5-301", 1, 9, 11, T1, "สอนวิชา IT497 เตรียมความพร้อมสู่โลกการทำงาน", 45, "APPROVED", 130],
  ["A1-201", 1, 13, 16, T2, "สอบย่อยวิชา IT213 คณิตศาสตร์สำหรับวิทยาการคอมพิวเตอร์", 85, "APPROVED", 96],
  ["A2-301", 1, 9, 10, S1, "ประชุมสโมสรนักศึกษาคณะ SIT", 40, "PENDING", 6],
  ["C7-301", 1, 10, 12, STAFF, "สัมมนาแนะแนวการศึกษาต่อระดับปริญญาโท", 35, "APPROVED", 60],
  ["C13-201", 1, 13, 16, T1, "ปฏิบัติการวิชา IT301 การเขียนโปรแกรมเชิงวัตถุ", 25, "APPROVED", 84],
  ["K-201", 1, 9, 12, T2, "สอนวิชานวัตกรรมเทคโนโลยี 3D Printing เบื้องต้น", 50, "APPROVED", 110],
  ["C9-201", 2, 9, 11, T1, "สอนเสริมวิชา IT234 โครงสร้างข้อมูล", 42, "APPROVED", 70],
  ["A1-401", 2, 13, 15, S1, "ติวหนังสือกลุ่มย่อยวิชาคณิตศาสตร์ 1", 35, "PENDING", 9],
  ["A2-202", 2, 10, 12, T2, "สอนวิชา IT352 การวิเคราะห์และออกแบบระบบ", 60, "APPROVED", 88],
  ["C7-202", 2, 14, 17, STAFF, "อบรมพนักงานมหาวิทยาลัยเรื่องงานบริการนักศึกษา", 45, "APPROVED", 52],
  ["C13-202", 2, 9, 12, T1, "ปฏิบัติการวิชา IT224 วงจรดิจิทัล (กลุ่ม 2)", 26, "APPROVED", 78],
  ["K-301", 2, 13, 16, T2, "ปฏิบัติการโปรเจกต์พิเศษวิชาโทนวัตกรรม", 38, "APPROVED", 64],
  ["C5-102", 3, 10, 11, STAFF, "ประชุมคณะกรรมการกิจการนักศึกษา", 18, "APPROVED", 100],
  ["A1-501", 3, 13, 17, T1, "สัมมนาวิชาการระดับชาติเรื่อง AI for Education", 70, "APPROVED", 140],
  ["A1-101", 3, 9, 12, T1, "สอบกลางภาควิชา IT201 การเขียนโปรแกรมคอมพิวเตอร์", 110, "APPROVED", 160],
  ["C7-401", 3, 9, 10, S1, "ประชุมกรรมการนักศึกษา", 20, "PENDING", 7],
  ["K-501", 4, 9, 12, T2, "บรรยายพิเศษ BU Startup Talk โดยศิษย์เก่า", 60, "APPROVED", 150],
  ["A2-401", 4, 13, 15, STAFF, "ประชุมหน่วยงานกิจการนักศึกษา", 25, "APPROVED", 44],
  ["C9-301", 4, 10, 12, S1, "ซ้อมการแสดงคอนเสิร์ตประจำปี", 25, "PENDING", 5],
  ["C13-301", 5, 9, 11, T1, "สอนชดเชยวิชา IT224 วงจรดิจิทัล", 42, "APPROVED", 92],
  ["A1-201", 5, 13, 15, T2, "สอบปลายภาควิชาคณิตศาสตร์สำหรับวิทยาการคอมพิวเตอร์", 80, "APPROVED", 120],
  ["C7-102", 5, 13, 16, T1, "สอบปลายภาควิชาวิทยาการคอมพิวเตอร์", 68, "APPROVED", 130],
  ["A1-102", 7, 9, 12, T1, "สอนวิชา IT201 การเขียนโปรแกรมคอมพิวเตอร์ (กลุ่ม 2)", 108, "APPROVED", 145],
  ["A2-101", 7, 13, 16, T2, "สอนวิชา IT352 การวิเคราะห์และออกแบบระบบ (กลุ่ม 2)", 90, "APPROVED", 132],
  ["K-201", 8, 9, 11, T1, "สอนวิชานวัตกรรมเทคโนโลยี 3D Printing เบื้องต้น (กลุ่ม 2)", 52, "APPROVED", 118],
  ["C5-101", 9, 13, 14, STAFF, "ประชุมทีมพัฒนาระบบห้องสมุดดิจิทัล", 12, "APPROVED", 36],
  ["A1-301", 10, 9, 12, T2, "สอบปลายภาควิชา IT352 การวิเคราะห์และออกแบบระบบ", 55, "APPROVED", 155],
  ["C13-101", 11, 13, 16, T1, "ปฏิบัติการสอบวิชา IT224 วงจรดิจิทัล", 32, "APPROVED", 165],
];

  // กันข้อมูลตัวอย่างผิดกฎ: ใบจองที่ยังกันเวลา (รออนุมัติ/อนุมัติ) ของห้องเดียวกันต้องไม่ทับกัน
  const blocking = reservations.filter((r) => r[7] === "PENDING" || r[7] === "APPROVED");
  for (const [i, a] of blocking.entries()) {
    for (const c of blocking.slice(i + 1)) {
      if (a[0] === c[0] && a[1] === c[1] && a[2] < c[3] && c[2] < a[3]) {
        throw new Error(`ข้อมูลตัวอย่างจองทับกัน: ${a[0]} วัน ${a[1]} ${a[2]}-${a[3]} กับ ${c[2]}-${c[3]}`);
      }
    }
  }

  const insertReservation = db.prepare(
    `INSERT INTO reservations (purpose, start_datetime, end_datetime, attendees, status, created_at, decided_at, room_code, reserved_by, approved_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertCancellation = db.prepare(
    `INSERT INTO cancellations (reason, cancelled_at, reservation_id, cancelled_by) VALUES (?, ?, ?, ?)`
  );
  for (const [roomCode, day, start, end, by, purpose, attendees, status, sentHoursAgo, cancelledBy, reason] of reservations) {
    const decided = status === "APPROVED" || status === "REJECTED";
    const { lastInsertRowid } = insertReservation.run(
      purpose,
      at(day, start),
      at(day, end),
      attendees,
      status,
      hoursAgo(sentHoursAgo),
      decided ? hoursAgo(Math.max(sentHoursAgo - 2, 1)) : null,
      roomCode,
      by,
      decided ? ADMIN : null
    );
    if (status === "CANCELLED") {
      insertCancellation.run(reason ?? null, hoursAgo(Math.max(sentHoursAgo - 5, 1)), lastInsertRowid, cancelledBy ?? by);
    }
  }

  // ─── UPDATE: สถานะห้อง — มีใบจองที่ยังไม่สิ้นสุด = ถูกจอง, ไม่มี = ว่าง (ไม่แตะห้องที่ปิดปรับปรุง) ───
  db.prepare(
    `UPDATE rooms SET status = CASE
       WHEN EXISTS (SELECT 1 FROM reservations res WHERE res.room_code = rooms.room_code
                    AND res.status IN ('PENDING', 'APPROVED') AND res.end_datetime > ?)
       THEN 'RESERVED' ELSE 'AVAILABLE' END
     WHERE status <> 'MAINTENANCE'`
  ).run(hoursAgo(0));

  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}

const count = (table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
console.log("เติมข้อมูลตัวอย่างเสร็จ:");
console.log(
  `  คณะ ${count("faculties")} · ผู้ใช้ ${count("users")} · อาคาร ${count("buildings")} · ห้อง ${count("rooms")} · ` +
    `ใบจอง ${count("reservations")} · ใบยกเลิก ${count("cancellations")}`
);
console.log("  บัญชีทดลอง (รหัสผ่าน password123): 5000000001 ผู้ดูแลระบบ · 5100000001 อาจารย์ · 5200000001 เจ้าหน้าที่ · 1650012345 นักศึกษา");
db.close();
