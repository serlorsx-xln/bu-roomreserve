// ─────────────────────────────────────────────────────────────────────────────
// ชั้นเข้าถึงฐานข้อมูลด้วยคำสั่ง SQL ตรง (Data Access Layer)
// ─────────────────────────────────────────────────────────────────────────────
// ไฟล์นี้คือที่เดียวที่เขียนคำสั่ง SQL ครบทั้ง 5 คำสั่ง:
//   CONNECT — เปิดการเชื่อมต่อฐานข้อมูล (connectDB)
//   SELECT  — อ่านข้อมูล            (getRooms, getReservations, countReservations, …)
//   INSERT  — เพิ่มข้อมูลใหม่        (insertReservation, insertUser, insertRoom, …)
//   UPDATE  — แก้ไขข้อมูล           (updateReservationStatus, updateRoom, …)
//   DELETE  — ลบข้อมูล             (deleteRoom, deleteBuilding)
//
// หลักการเขียนที่สำคัญ:
// 1. ทุกคำสั่งที่มีค่าจากผู้ใช้ ใช้ "พารามิเตอร์ ?" เสมอ (prepared statement)
//    เพื่อกัน SQL Injection — ห้ามต่อข้อความผู้ใช้เข้าไปใน SQL โดยเด็ดขาด
// 2. เวลาทั้งหมดเก็บเป็นข้อความรูปแบบ ISO 8601 ตามเวลาไทย (Asia/Bangkok)
//    เพราะ SQLite ไม่มีชนิดวันที่ เก็บ TEXT แล้วเรียงลำดับได้ถูกต้องตามตัวอักษร
// 3. การเขียนที่ต้องกันคำขอพร้อมกัน (เช่น จองห้องช่วงเวลาเดียวกัน)
//    ใช้ BEGIN IMMEDIATE ซึ่งล็อกฐานข้อมูลตั้งแต่เริ่มธุรกรรม
//    ทำให้ธุรกรรมที่สองต้องรอ แล้วจะเห็นการจองแรกเสมอ จึงไม่มีทางจองซ้อนกัน
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  Building,
  Reservation,
  ReservationDetail,
  ReservationStatus,
  ReservationWithDetails,
  Room,
  RoomStatus,
  RoomType,
  RoomWithBuilding,
  User,
  UserRole,
} from "@/lib/types";

// ─── CONNECT ─────────────────────────────────────────────────────────────────
// เปิดการเชื่อมต่อฐานข้อมูล SQLite (ไฟล์ prisma/dev.db)
// ใช้ตัวแปรระดับ global เพื่อไม่ให้เปิด connection ใหม่ซ้ำ ๆ ตอน hot-reload

declare const globalThis: { __db?: DatabaseSync };

/**
 * การเชื่อมต่อฐานข้อมูลของทั้งแอป — เชื่อมแบบ "ขี้เกียจ" (lazy)
 * เปิดไฟล์ฐานข้อมูลครั้งแรกเมื่อมีการ query จริงเท่านั้น
 * เพราะตอน build หน้าเว็บ Next.js จะโหลดโมดูลนี้หลาย worker พร้อมกัน ซึ่งไม่ควรแตะฐานข้อมูล
 */
export function getDb(): DatabaseSync {
  if (!globalThis.__db) {
    // เปิด foreign key enforcement: SQLite ปกติปิดอยู่
    // เปิดแล้วจะบังคับกฎ ON DELETE RESTRICT / SET NULL ตามที่ประกาศใน sql/schema.sql
    const connection = new DatabaseSync(process.env.DATABASE_PATH ?? "prisma/dev.db", {
      enableForeignKeyConstraints: true,
    });
    // journal_mode ต้องตั้งก่อนการเขียนครั้งแรกเสมอ — บน exFAT ของไดรฟ์ภายนอก
    // journal แบบปกติ (DELETE) เขียนไม่ได้ จึงบังคับใช้ WAL ที่นี่และในสคริปต์ db ทุกตัว
    connection.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
    // ตรวจว่าตารางพร้อมใช้ (สร้างตารางถ้ายังไม่มี — เช่นเปิดแอปครั้งแรกหลัง deploy)
    if (!connection.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='reservations'`).get()) {
      connection.exec(readFileSync(join(process.cwd(), "sql", "schema.sql"), "utf-8"));
    }
    globalThis.__db = connection;
  }
  return globalThis.__db;
}

/** การเชื่อมต่อปัจจุบัน (ชื่อสั้นสำหรับใช้ในฟังก์ชันด้านล่าง) */
function conn(): DatabaseSync {
  return getDb();
}

// ─── ตัวช่วยแปลงค่าระหว่างฐานข้อมูลกับโค้ด ────────────────────────────────────

/** Date → ข้อความ ISO 8601 เวลาไทย เช่น "2026-10-01 13:00:00" (รูปแบบเดียวกับ datetime('now','+7 hours')) */
export function toSqliteDateTime(date: Date): string {
  const thailand = new Date(date.getTime() + 7 * 3_600_000); // +07:00
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${thailand.getUTCFullYear()}-${pad(thailand.getUTCMonth() + 1)}-${pad(thailand.getUTCDate())} ` +
    `${pad(thailand.getUTCHours())}:${pad(thailand.getUTCMinutes())}:${pad(thailand.getUTCSeconds())}`
  );
}

/** ข้อความในฐานข้อมูล → Date (เวลาที่เก็บเป็นเวลาไทย แปลงกลับโดยบวก +07:00) */
export function fromSqliteDateTime(value: string): Date {
  return new Date(`${value.replace(" ", "T")}+07:00`);
}

/** แถวดิบจากตาราง → ออบเจกต์ที่โค้ดใช้ */
/** แถวดิบจากฐานข้อมูล (ชื่อคอลัมน์แบบ snake_case ตาม sql/schema.sql) */
type RawReservation = {
  reservation_id: number;
  purpose: string;
  start_datetime: string;
  end_datetime: string;
  attendees: number;
  status: string;
  created_at: string;
  decided_at: string | null;
  room_id: number;
  user_id: number;
  approved_by: number | null;
};

function toReservation(row: RawReservation): Reservation {
  return {
    id: row.reservation_id,
    purpose: row.purpose,
    startAt: fromSqliteDateTime(row.start_datetime),
    endAt: fromSqliteDateTime(row.end_datetime),
    attendees: row.attendees,
    status: row.status as ReservationStatus,
    createdAt: fromSqliteDateTime(row.created_at),
    decidedAt: row.decided_at ? fromSqliteDateTime(row.decided_at) : null,
    roomId: row.room_id,
    userId: row.user_id,
    approvedById: row.approved_by,
  };
}

function toRoom(row: {
  room_id: number;
  room_code: string;
  capacity: number;
  room_type: string;
  has_projector: number;
  has_whiteboard: number;
  status: string;
  building_id: number;
}): Room {
  return {
    id: row.room_id,
    code: row.room_code,
    capacity: row.capacity,
    roomType: row.room_type as RoomType,
    hasProjector: row.has_projector === 1,
    hasWhiteboard: row.has_whiteboard === 1,
    status: row.status as RoomStatus,
    buildingId: row.building_id,
  };
}

function toUser(row: {
  user_id: number;
  student_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  role: string;
  created_at: string;
}): User {
  return {
    id: row.user_id,
    studentId: row.student_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    role: row.role as UserRole,
    createdAt: fromSqliteDateTime(row.created_at),
  };
}

// ─── SELECT: users ───────────────────────────────────────────────────────────

/** ค้นหาผู้ใช้ด้วยอีเมล (ใช้ตอนล็อกอินและตรวจอีเมลซ้ำ) */
export function findUserByEmail(email: string): User | null {
  const row = conn()
    .prepare(`SELECT * FROM users WHERE email = ?`)
    .get(email.toLowerCase()) as ReturnType<typeof toUser> extends never
    ? never
    : Parameters<typeof toUser>[0] | undefined;
  return row ? toUser(row) : null;
}

/** ค้นหาผู้ใช้ด้วยรหัส (ใช้ตอนตรวจรหัสนักศึกษาซ้ำ) */
export function findUserByStudentId(studentId: string): User | null {
  const row = conn().prepare(`SELECT * FROM users WHERE student_id = ?`).get(studentId) as
    | Parameters<typeof toUser>[0]
    | undefined;
  return row ? toUser(row) : null;
}

/** ค้นหาผู้ใช้ด้วยรหัสผู้ใช้ */
export function findUserById(userId: number): User | null {
  const row = conn().prepare(`SELECT * FROM users WHERE user_id = ?`).get(userId) as
    | Parameters<typeof toUser>[0]
    | undefined;
  return row ? toUser(row) : null;
}

// ─── SELECT: rooms และ buildings ─────────────────────────────────────────────

type RoomRowFilter = {
  buildingId?: number;
  minCapacity?: number;
  hasProjector?: boolean;
  hasWhiteboard?: boolean;
  status?: RoomStatus;
};

/** รายการอาคารเรียงตามรหัส (ใช้ทุกหน้าที่แสดงที่มาของอาคาร) */
export function getBuildings(): (Building & { roomCount: number })[] {
  // SQL: SELECT รวมด้วย LEFT JOIN เพื่อนับจำนวนห้องของแต่ละอาคาร
  const rows = conn()
    .prepare(
      `SELECT b.building_id, b.building_name, b.number_of_floors, COUNT(r.room_id) AS room_count
       FROM buildings b
       LEFT JOIN rooms r ON r.building_id = b.building_id
       GROUP BY b.building_id
       ORDER BY b.building_id ASC`
    )
    .all() as { building_id: number; building_name: string; number_of_floors: number; room_count: number }[];
  return rows.map((row) => ({
    id: row.building_id,
    name: row.building_name,
    numberOfFloors: row.number_of_floors,
    roomCount: row.room_count,
  }));
}

/** ห้องทั้งหมด (หรือตามเงื่อนไข) เรียงตามอาคารแล้วรหัสห้อง */
export function getRooms(filter: RoomRowFilter = {}): Room[] {
  // SQL: SELECT ... WHERE เงื่อนไขแบบไดนามิก — ทุกค่าผ่านพารามิเตอร์ ?
  const conditions: string[] = [];
  const params: (number | string)[] = [];
  if (filter.buildingId !== undefined) {
    conditions.push("building_id = ?");
    params.push(filter.buildingId);
  }
  if (filter.minCapacity !== undefined) {
    conditions.push("capacity >= ?");
    params.push(filter.minCapacity);
  }
  if (filter.hasProjector !== undefined) {
    conditions.push("has_projector = ?");
    params.push(filter.hasProjector ? 1 : 0);
  }
  if (filter.hasWhiteboard !== undefined) {
    conditions.push("has_whiteboard = ?");
    params.push(filter.hasWhiteboard ? 1 : 0);
  }
  if (filter.status !== undefined) {
    conditions.push("status = ?");
    params.push(filter.status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = conn()
    .prepare(`SELECT * FROM rooms ${where} ORDER BY building_id ASC, room_code ASC`)
    .all(...params) as Parameters<typeof toRoom>[0][];
  return rows.map(toRoom);
}

/** ห้องเดียวพร้อมชื่ออาคาร (หน้าจองห้อง) */
export function findRoomWithBuilding(roomId: number): RoomWithBuilding | null {
  const row = conn()
    .prepare(
      `SELECT r.*, b.building_name
       FROM rooms r JOIN buildings b ON b.building_id = r.building_id
       WHERE r.room_id = ?`
    )
    .get(roomId) as (Parameters<typeof toRoom>[0] & { building_name: string }) | undefined;
  if (!row) return null;
  return {
    ...toRoom(row),
    building: { id: row.building_id, name: row.building_name },
  };
}

// ─── SELECT: reservations ────────────────────────────────────────────────────

export type ReservationFilter = {
  roomId?: number;
  userId?: number;
  statuses?: ReservationStatus[];
  /** จองที่เริ่มก่อนเวลานี้ */
  startBefore?: Date;
  /** จองที่จบหลังเวลานี้ */
  endAfter?: Date;
  /** จองที่จบไม่หลังเวลานี้ */
  endAtOrBefore?: Date;
  limit?: number;
  order?: "start_asc" | "start_desc" | "created_asc" | "decided_desc";
};

const ORDER_BY: Record<NonNullable<ReservationFilter["order"]>, string> = {
  start_asc: "start_datetime ASC",
  start_desc: "start_datetime DESC",
  created_asc: "created_at ASC",
  decided_desc: "decided_at DESC",
};

/** อ่านการจองตามเงื่อนไข (SELECT พร้อม WHERE แบบไดนามิก) */
export function getReservations(filter: ReservationFilter = {}): Reservation[] {
  const conditions: string[] = [];
  const params: (number | string)[] = [];
  if (filter.roomId !== undefined) {
    conditions.push("room_id = ?");
    params.push(filter.roomId);
  }
  if (filter.userId !== undefined) {
    conditions.push("user_id = ?");
    params.push(filter.userId);
  }
  if (filter.statuses?.length) {
    conditions.push(`status IN (${filter.statuses.map(() => "?").join(", ")})`);
    params.push(...filter.statuses);
  }
  if (filter.startBefore !== undefined) {
    conditions.push("start_datetime < ?");
    params.push(toSqliteDateTime(filter.startBefore));
  }
  if (filter.endAfter !== undefined) {
    conditions.push("end_datetime > ?");
    params.push(toSqliteDateTime(filter.endAfter));
  }
  if (filter.endAtOrBefore !== undefined) {
    conditions.push("end_datetime <= ?");
    params.push(toSqliteDateTime(filter.endAtOrBefore));
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filter.limit !== undefined ? `LIMIT ${Math.floor(filter.limit)}` : "";
  const rows = conn()
    .prepare(
      `SELECT * FROM reservations ${where} ORDER BY ${ORDER_BY[filter.order ?? "start_asc"]}${limit}`
    )
    .all(...params) as RawReservation[];
  return rows.map(toReservation);
}

/** นับจำนวนการจองตามเงื่อนไข (ใช้ทำตัวเลขบนแท็บ) */
export function countReservations(
  filter: Omit<ReservationFilter, "limit" | "order"> = {}
): number {
  const conditions: string[] = [];
  const params: (number | string)[] = [];
  if (filter.roomId !== undefined) {
    conditions.push("room_id = ?");
    params.push(filter.roomId);
  }
  if (filter.userId !== undefined) {
    conditions.push("user_id = ?");
    params.push(filter.userId);
  }
  if (filter.statuses?.length) {
    conditions.push(`status IN (${filter.statuses.map(() => "?").join(", ")})`);
    params.push(...filter.statuses);
  }
  if (filter.startBefore !== undefined) {
    conditions.push("start_datetime < ?");
    params.push(toSqliteDateTime(filter.startBefore));
  }
  if (filter.endAfter !== undefined) {
    conditions.push("end_datetime > ?");
    params.push(toSqliteDateTime(filter.endAfter));
  }
  if (filter.endAtOrBefore !== undefined) {
    conditions.push("end_datetime <= ?");
    params.push(toSqliteDateTime(filter.endAtOrBefore));
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const row = conn()
    .prepare(`SELECT COUNT(*) AS n FROM reservations ${where}`)
    .get(...params) as { n: number };
  return row.n;
}

/** การจองเดียวพร้อมข้อมูลห้อง อาคาร และผู้จอง (หน้ารายการ) */
export function findReservationsWithDetails(
  filter: ReservationFilter = {}
): ReservationWithDetails[] {
  const rows = rawDetailedRows(filter);
  return rows.map((row) => ({
    ...toReservation(row),
    room: { code: row.room_code, capacity: row.room_capacity, roomType: row.room_type as RoomType, building: { name: row.building_name } },
    user: { fullName: row.user_full_name, role: row.user_role as UserRole, email: row.user_email },
  }));
}

/** การจองเดียวพร้อมทุกอย่างรวมชื่อผู้อนุมัติ (หน้ารายละเอียด) */
export function findReservationDetail(reservationId: number): ReservationDetail | null {
  const rows = rawDetailedRows({ roomId: undefined, userId: undefined }, reservationId);
  const row = rows[0];
  if (!row) return null;
  return {
    ...toReservation(row),
    room: { code: row.room_code, capacity: row.room_capacity, roomType: row.room_type as RoomType, building: { name: row.building_name } },
    user: { fullName: row.user_full_name, role: row.user_role as UserRole, email: row.user_email },
    approvedBy: row.approver_name ? { fullName: row.approver_name } : null,
  };
}

type DetailedRow = RawReservation & {
  room_code: string;
  room_capacity: number;
  room_type: string;
  building_name: string;
  user_full_name: string;
  user_role: string;
  user_email: string;
  approver_name: string | null;
};

/** SELECT การจองแบบ JOIN 3 ตาราง: rooms, buildings, users (ผู้จอง + ผู้อนุมัติ) */
function rawDetailedRows(
  filter: ReservationFilter,
  exactId?: number
): DetailedRow[] {
  const conditions: string[] = [];
  const params: (number | string)[] = [];
  if (exactId !== undefined) {
    conditions.push("res.reservation_id = ?");
    params.push(exactId);
  }
  if (filter.roomId !== undefined) {
    conditions.push("res.room_id = ?");
    params.push(filter.roomId);
  }
  if (filter.userId !== undefined) {
    conditions.push("res.user_id = ?");
    params.push(filter.userId);
  }
  if (filter.statuses?.length) {
    conditions.push(`res.status IN (${filter.statuses.map(() => "?").join(", ")})`);
    params.push(...filter.statuses);
  }
  if (filter.startBefore !== undefined) {
    conditions.push("res.start_datetime < ?");
    params.push(toSqliteDateTime(filter.startBefore));
  }
  if (filter.endAfter !== undefined) {
    conditions.push("res.end_datetime > ?");
    params.push(toSqliteDateTime(filter.endAfter));
  }
  if (filter.endAtOrBefore !== undefined) {
    conditions.push("res.end_datetime <= ?");
    params.push(toSqliteDateTime(filter.endAtOrBefore));
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filter.limit !== undefined ? `LIMIT ${Math.floor(filter.limit)}` : "";
  // JOIN ซ้ำกับตาราง users สองครั้ง: ครั้งแรกหาผู้จอง (user_id) ครั้งที่สองหาผู้อนุมัติ (approved_by)
  return conn()
    .prepare(
      `SELECT res.*, r.room_code, r.capacity AS room_capacity, b.building_name,
              u.full_name AS user_full_name, u.role AS user_role, u.email AS user_email,
              a.full_name AS approver_name
       FROM reservations res
       JOIN rooms r ON r.room_id = res.room_id
       JOIN buildings b ON b.building_id = r.building_id
       JOIN users u ON u.user_id = res.user_id
       LEFT JOIN users a ON a.user_id = res.approved_by
       ${where}
       ORDER BY res.${ORDER_BY[filter.order ?? "start_asc"]}${limit}`
    )
    .all(...params) as DetailedRow[];
}

// ─── INSERT ──────────────────────────────────────────────────────────────────

/** เพิ่มคำขอจองใหม่ — คืนรหัสการจองที่สร้าง (lastInsertRowid) */
export function insertReservation(data: {
  roomId: number;
  userId: number;
  purpose: string;
  startAt: Date;
  endAt: Date;
  attendees: number;
}): number {
  // SQL: INSERT INTO ... VALUES (?, ?, ...) — ทุกค่าผ่านพารามิเตอร์ กัน SQL Injection
  const { lastInsertRowid } = conn()
    .prepare(
      `INSERT INTO reservations (purpose, start_datetime, end_datetime, attendees, status, room_id, user_id)
       VALUES (?, ?, ?, ?, 'PENDING', ?, ?)`
    )
    .run(
      data.purpose,
      toSqliteDateTime(data.startAt),
      toSqliteDateTime(data.endAt),
      data.attendees,
      data.roomId,
      data.userId
    );
  return Number(lastInsertRowid);
}

/** เพิ่มผู้ใช้ใหม่ (สมัครใช้งาน) — คืนรหัสผู้ใช้ */
export function insertUser(data: {
  fullName: string;
  studentId: string | null;
  email: string;
  phone: string | null;
  passwordHash: string;
  role?: UserRole;
}): number {
  const { lastInsertRowid } = conn()
    .prepare(
      `INSERT INTO users (full_name, student_id, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, ?, COALESCE(?, 'STUDENT'))`
    )
    .run(
      data.fullName,
      data.studentId,
      data.email.toLowerCase(),
      data.phone,
      data.passwordHash,
      data.role ?? null
    );
  return Number(lastInsertRowid);
}

/** เพิ่มอาคาร (ผู้ดูแลระบบ) — คืนรหัสอาคาร */
export function insertBuilding(data: { name: string; numberOfFloors: number }): number {
  const { lastInsertRowid } = conn()
    .prepare(`INSERT INTO buildings (building_name, number_of_floors) VALUES (?, ?)`)
    .run(data.name, data.numberOfFloors);
  return Number(lastInsertRowid);
}

/** เพิ่มห้อง (ผู้ดูแลระบบ) — คืนรหัสห้อง */
export function insertRoom(data: {
  code: string;
  capacity: number;
  roomType: RoomType;
  hasProjector: boolean;
  hasWhiteboard: boolean;
  status?: RoomStatus;
  buildingId: number;
}): number {
  const { lastInsertRowid } = conn()
    .prepare(
      `INSERT INTO rooms (room_code, capacity, room_type, has_projector, has_whiteboard, status, building_id)
       VALUES (?, ?, ?, ?, ?, COALESCE(?, 'AVAILABLE'), ?)`
    )
    .run(
      data.code,
      data.capacity,
      data.roomType,
      data.hasProjector ? 1 : 0,
      data.hasWhiteboard ? 1 : 0,
      data.status ?? null,
      data.buildingId
    );
  return Number(lastInsertRowid);
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

/**
 * เปลี่ยนสถานะการจองพร้อมเงื่อนไขเสมอ (WHERE ตรวจสถานะเดิมก่อนแก้)
 * กันสถานการณ์สองคนตัดสินการจองเดียวกันพร้อมกัน: คนที่สองจะอัปเดตไม่สำเร็จ (changed = 0)
 * คืนจำนวนแถวที่ถูกแก้จริง (0 = เงื่อนไขไม่ตรง สถานะถูกเปลี่ยนไปแล้ว)
 */
export function updateReservationStatus(data: {
  reservationId: number;
  from: ReservationStatus[];
  to: ReservationStatus;
  approverId?: number;
  endAfter?: Date;
}): number {
  const now = new Date();
  let sql = `UPDATE reservations SET status = ?`;
  const params: (number | string | null)[] = [data.to];
  if (data.to === "APPROVED" || data.to === "REJECTED") {
    // บันทึกว่าใครตัดสินและเมื่อไร (ความสัมพันธ์ APPROVES)
    sql += `, approved_by = ?, decided_at = ?`;
    params.push(data.approverId ?? null, toSqliteDateTime(now));
  }
  sql += ` WHERE reservation_id = ? AND status IN (${data.from.map(() => "?").join(", ")})`;
  params.push(data.reservationId, ...data.from);
  if (data.endAfter !== undefined) {
    sql += ` AND end_datetime > ?`;
    params.push(toSqliteDateTime(data.endAfter));
  }
  const { changes } = conn().prepare(sql).run(...params);
  return Number(changes);
}

/** แก้ไขอาคาร (ผู้ดูแลระบบ) */
export function updateBuilding(
  buildingId: number,
  data: { name: string; numberOfFloors: number }
): boolean {
  const { changes } = conn()
    .prepare(`UPDATE buildings SET building_name = ?, number_of_floors = ? WHERE building_id = ?`)
    .run(data.name, data.numberOfFloors, buildingId);
  return changes > 0;
}

/** แก้ไขห้อง (ผู้ดูแลระบบ) — ส่งเฉพาะฟิลด์ที่ต้องการแก้ */
export function updateRoom(
  roomId: number,
  data: Partial<{
    code: string;
    capacity: number;
    roomType: RoomType;
    hasProjector: boolean;
    hasWhiteboard: boolean;
    status: RoomStatus;
    buildingId: number;
  }>
): boolean {
  // สร้าง "SET column = ?" เฉพาะฟิลด์ที่ส่งมา (ค่าคงที่ทั้งหมด ไม่มีข้อความผู้ใช้ในชื่อคอลัมน์)
  const sets: string[] = [];
  const params: (number | string)[] = [];
  if (data.code !== undefined) { sets.push("room_code = ?"); params.push(data.code); }
  if (data.capacity !== undefined) { sets.push("capacity = ?"); params.push(data.capacity); }
  if (data.roomType !== undefined) { sets.push("room_type = ?"); params.push(data.roomType); }
  if (data.hasProjector !== undefined) { sets.push("has_projector = ?"); params.push(data.hasProjector ? 1 : 0); }
  if (data.hasWhiteboard !== undefined) { sets.push("has_whiteboard = ?"); params.push(data.hasWhiteboard ? 1 : 0); }
  if (data.status !== undefined) { sets.push("status = ?"); params.push(data.status); }
  if (data.buildingId !== undefined) { sets.push("building_id = ?"); params.push(data.buildingId); }
  if (!sets.length) return false;
  const { changes } = conn()
    .prepare(`UPDATE rooms SET ${sets.join(", ")} WHERE room_id = ?`)
    .run(...params, roomId);
  return changes > 0;
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

/**
 * ลบห้อง (ผู้ดูแลระบบ) — ลบได้เฉพาะห้องที่ไม่มีประวัติการจอง
 * เพราะกฎ FK ON DELETE RESTRICT ใน sql/schema.sql จะปฏิเสธการลบเอง จึงตรวจก่อนเพื่อแจ้งข้อความที่เข้าใจง่าย
 * คืน "ok" | "has_reservations" | "not_found"
 */
export function deleteRoom(roomId: number): "ok" | "has_reservations" | "not_found" {
  const used = conn()
    .prepare(`SELECT COUNT(*) AS n FROM reservations WHERE room_id = ?`)
    .get(roomId) as { n: number };
  if (used.n > 0) return "has_reservations"; // มีประวัติการจอง — ต้องเปลี่ยนสถานะเป็น CLOSED แทน
  const { changes } = conn().prepare(`DELETE FROM rooms WHERE room_id = ?`).run(roomId);
  return changes > 0 ? "ok" : "not_found";
}

/**
 * ลบอาคาร (ผู้ดูแลระบบ) — ลบได้เฉพาะอาคารว่าง (ไม่มีห้องอยู่ข้างใน)
 * กฎ FK ON DELETE RESTRICT จะปฏิเสธการลบอาคารที่ยังมีห้อง จึงตรวจก่อนเพื่อแจ้งข้อความชัดเจน
 */
export function deleteBuilding(buildingId: number): "ok" | "has_rooms" | "not_found" {
  const used = conn()
    .prepare(`SELECT COUNT(*) AS n FROM rooms WHERE building_id = ?`)
    .get(buildingId) as { n: number };
  if (used.n > 0) return "has_rooms"; // ยังมีห้องอยู่ — ลบห้องออกก่อน
  const { changes } = conn().prepare(`DELETE FROM buildings WHERE building_id = ?`).run(buildingId);
  return changes > 0 ? "ok" : "not_found";
}

// ─── TRANSACTION: จองห้องกันคำขอพร้อมกัน ─────────────────────────────────────

/**
 * ส่งคำขอจองภายในธุรกรรมเดียว:
 *   BEGIN IMMEDIATE → นับการจองที่ทับช่วงเวลา → ถ้าไม่ทับจึง INSERT → COMMIT
 * ถ้ามีคำขอสองรายการเข้ามาพร้อมกัน รายการที่สองต้องรอล็อก (busy_timeout 5 วินาที)
 * แล้วจะเห็นการจองแรกแน่นอน จึงไม่มีทางมีสองคำขอกินช่วงเวลาเดียวกันของห้องเดียวกัน
 * คืนรหัสการจอง หรือ null ถ้าช่วงเวลาถูกจองไปก่อนแล้ว
 */
export function createReservationAtomically(data: {
  roomId: number;
  userId: number;
  purpose: string;
  startAt: Date;
  endAt: Date;
  attendees: number;
}): number | null {
  const start = toSqliteDateTime(data.startAt);
  const end = toSqliteDateTime(data.endAt);
  conn().exec("BEGIN IMMEDIATE");
  try {
    // SELECT: นับการจองที่ "ทับ" ช่วงเวลา [start, end) — ทับ = เริ่มก่อน end และจบหลัง start
    const { n } = conn()
      .prepare(
        `SELECT COUNT(*) AS n FROM reservations
         WHERE room_id = ? AND status IN ('PENDING', 'APPROVED')
           AND start_datetime < ? AND end_datetime > ?`
      )
      .get(data.roomId, end, start) as { n: number };
    if (n > 0) {
      conn().exec("ROLLBACK");
      return null;
    }
    // INSERT คำขอใหม่
    const { lastInsertRowid } = conn()
      .prepare(
        `INSERT INTO reservations (purpose, start_datetime, end_datetime, attendees, status, room_id, user_id)
         VALUES (?, ?, ?, ?, 'PENDING', ?, ?)`
      )
      .run(data.purpose, start, end, data.attendees, data.roomId, data.userId);
    conn().exec("COMMIT");
    return Number(lastInsertRowid);
  } catch (error) {
    conn().exec("ROLLBACK"); // ยกเลิกทุกอย่างที่ทำค้างไว้ในธุรกรรมนี้
    throw error;
  }
}
