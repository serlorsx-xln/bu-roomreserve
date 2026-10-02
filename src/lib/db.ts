// ─────────────────────────────────────────────────────────────────────────────
// ชั้นเข้าถึงฐานข้อมูลด้วยคำสั่ง SQL ตรง (Data Access Layer)
// ─────────────────────────────────────────────────────────────────────────────
// ไฟล์นี้คือที่เดียวที่เขียนคำสั่ง SQL ครบทั้ง 5 คำสั่ง:
//   CONNECT — เปิดการเชื่อมต่อฐานข้อมูล (getDb)
//   SELECT  — อ่านข้อมูล            (getRooms, getReservations, countReservations, …)
//   INSERT  — เพิ่มข้อมูลใหม่        (insertUser, insertRoom, createReservationAtomically, cancelReservation, …)
//   UPDATE  — แก้ไขข้อมูล           (decideReservation, updateRoom, refreshRoomStatuses, …)
//   DELETE  — ลบข้อมูล             (deleteRoom, deleteBuilding)
//
// หลักการเขียนที่สำคัญ:
// 1. ทุกคำสั่งที่มีค่าจากผู้ใช้ ใช้ "พารามิเตอร์ ?" เสมอ (prepared statement)
//    เพื่อกัน SQL Injection — ห้ามต่อข้อความผู้ใช้เข้าไปใน SQL โดยเด็ดขาด
// 2. เวลาทั้งหมดเก็บเป็นข้อความรูปแบบ ISO 8601 ตามเวลาไทย (Asia/Bangkok)
//    เพราะ SQLite ไม่มีชนิดวันที่ เก็บ TEXT แล้วเรียงลำดับได้ถูกต้องตามตัวอักษร
// 3. การเขียนหลายตารางที่ต้องสำเร็จพร้อมกัน (จองห้อง, ยกเลิก) อยู่ในธุรกรรม BEGIN IMMEDIATE … COMMIT
//    ซึ่งล็อกฐานข้อมูลตั้งแต่เริ่ม ธุรกรรมที่สองต้องรอ จึงไม่มีทางจองซ้อนหรือยกเลิกซ้ำ
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  Building,
  Faculty,
  Reservation,
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

declare const globalThis: { __db?: DatabaseSync; __roomStatusRefreshedAt?: number };

/**
 * การเชื่อมต่อฐานข้อมูลของทั้งแอป — เชื่อมแบบ "ขี้เกียจ" (lazy)
 * เปิดไฟล์ฐานข้อมูลครั้งแรกเมื่อมีการ query จริงเท่านั้น
 * เพราะตอน build หน้าเว็บ Next.js จะโหลดโมดูลนี้หลาย worker พร้อมกัน ซึ่งไม่ควรแตะฐานข้อมูล
 * เก็บไว้ในตัวแปร global เพื่อไม่ให้เปิด connection ใหม่ซ้ำ ๆ ตอน hot-reload
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
    // สร้างตารางถ้ายังไม่มี (เช่นเปิดแอปครั้งแรกหลัง deploy)
    if (!connection.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='cancellations'`).get()) {
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

/** รันฟังก์ชันภายในธุรกรรม: สำเร็จ = COMMIT, ผิดพลาด = ROLLBACK ทุกอย่างที่ทำค้างไว้ */
function transaction<T>(work: () => T): T {
  conn().exec("BEGIN IMMEDIATE");
  try {
    const result = work();
    conn().exec("COMMIT");
    return result;
  } catch (error) {
    conn().exec("ROLLBACK");
    throw error;
  }
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

// แถวดิบจากฐานข้อมูล (ชื่อคอลัมน์แบบ snake_case ตาม sql/schema.sql)

type RawUser = {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  role: string;
  created_at: string;
  faculty_id: number | null;
};

type RawRoom = {
  room_code: string;
  capacity: number;
  room_type: string;
  has_projector: number;
  has_whiteboard: number;
  status: string;
  building_id: number;
};

type RawReservation = {
  reservation_id: number;
  purpose: string;
  start_datetime: string;
  end_datetime: string;
  attendees: number;
  status: string;
  created_at: string;
  decided_at: string | null;
  room_code: string;
  reserved_by: string;
  approved_by: string | null;
};

function toUser(row: RawUser): User {
  return {
    id: row.user_id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    role: row.role as UserRole,
    createdAt: fromSqliteDateTime(row.created_at),
    facultyId: row.faculty_id,
  };
}

function toRoom(row: RawRoom): Room {
  return {
    code: row.room_code,
    capacity: row.capacity,
    roomType: row.room_type as RoomType,
    hasProjector: row.has_projector === 1,
    hasWhiteboard: row.has_whiteboard === 1,
    status: row.status as RoomStatus,
    buildingId: row.building_id,
  };
}

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
    roomCode: row.room_code,
    reservedById: row.reserved_by,
    approvedById: row.approved_by,
  };
}

// ─── SELECT: faculties และ users ─────────────────────────────────────────────

/** รายชื่อคณะทั้งหมด (ตัวเลือกในฟอร์มสมัครใช้งาน) */
export function getFaculties(): Faculty[] {
  const rows = conn()
    .prepare(`SELECT faculty_id, faculty_name FROM faculties ORDER BY faculty_id ASC`)
    .all() as { faculty_id: number; faculty_name: string }[];
  return rows.map((row) => ({ id: row.faculty_id, name: row.faculty_name }));
}

/** ค้นหาผู้ใช้ด้วยรหัส 10 หลัก (ใช้ตอนเข้าสู่ระบบ อ่าน session และตรวจรหัสซ้ำ) */
export function findUserById(userId: string): User | null {
  const row = conn().prepare(`SELECT * FROM users WHERE user_id = ?`).get(userId) as RawUser | undefined;
  return row ? toUser(row) : null;
}

/** ค้นหาผู้ใช้ด้วยอีเมล (ใช้ตอนตรวจอีเมลซ้ำ) */
export function findUserByEmail(email: string): User | null {
  const row = conn().prepare(`SELECT * FROM users WHERE email = ?`).get(email.toLowerCase()) as RawUser | undefined;
  return row ? toUser(row) : null;
}

/** ผู้ใช้ + ชื่อคณะ (แสดงในเมนูผู้ใช้) */
export function findFacultyName(facultyId: number | null): string | null {
  if (facultyId === null) return null;
  const row = conn().prepare(`SELECT faculty_name FROM faculties WHERE faculty_id = ?`).get(facultyId) as
    | { faculty_name: string }
    | undefined;
  return row?.faculty_name ?? null;
}

// ─── SELECT: rooms และ buildings ─────────────────────────────────────────────

/** รายการอาคารเรียงตามรหัส พร้อมจำนวนห้อง */
export function getBuildings(): (Building & { roomCount: number })[] {
  // SQL: SELECT รวมด้วย LEFT JOIN เพื่อนับจำนวนห้องของแต่ละอาคาร
  const rows = conn()
    .prepare(
      `SELECT b.building_id, b.building_name, b.number_of_floors, COUNT(r.room_code) AS room_count
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

type RoomFilter = {
  buildingId?: number;
  minCapacity?: number;
  hasProjector?: boolean;
  hasWhiteboard?: boolean;
  statuses?: RoomStatus[];
};

/** ห้องทั้งหมด (หรือตามเงื่อนไข) เรียงตามอาคารแล้วรหัสห้อง */
export function getRooms(filter: RoomFilter = {}): Room[] {
  refreshRoomStatusesIfStale();
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
  if (filter.statuses?.length) {
    conditions.push(`status IN (${filter.statuses.map(() => "?").join(", ")})`);
    params.push(...filter.statuses);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = conn()
    .prepare(`SELECT * FROM rooms ${where} ORDER BY building_id ASC, room_code ASC`)
    .all(...params) as RawRoom[];
  return rows.map(toRoom);
}

/** ห้องเดียวพร้อมชื่ออาคาร (หน้าจองห้อง) */
export function findRoomWithBuilding(roomCode: string): RoomWithBuilding | null {
  refreshRoomStatusesIfStale();
  const row = conn()
    .prepare(
      `SELECT r.*, b.building_name
       FROM rooms r JOIN buildings b ON b.building_id = r.building_id
       WHERE r.room_code = ?`
    )
    .get(roomCode) as (RawRoom & { building_name: string }) | undefined;
  if (!row) return null;
  return { ...toRoom(row), building: { id: row.building_id, name: row.building_name } };
}

// ─── SELECT: reservations (ใบจอง) ────────────────────────────────────────────

export type ReservationFilter = {
  roomCode?: string;
  reservedById?: string;
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
  start_asc: "res.start_datetime ASC",
  start_desc: "res.start_datetime DESC",
  created_asc: "res.created_at ASC",
  decided_desc: "res.decided_at DESC",
};

/** สร้าง WHERE จากตัวกรอง — ชื่อคอลัมน์เป็นค่าคงที่ ค่าจากผู้ใช้ผ่าน ? ทั้งหมด */
function reservationWhere(filter: ReservationFilter): { where: string; params: (number | string)[] } {
  const conditions: string[] = [];
  const params: (number | string)[] = [];
  if (filter.roomCode !== undefined) {
    conditions.push("res.room_code = ?");
    params.push(filter.roomCode);
  }
  if (filter.reservedById !== undefined) {
    conditions.push("res.reserved_by = ?");
    params.push(filter.reservedById);
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
  return { where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "", params };
}

function limitClause(limit?: number): string {
  return limit !== undefined ? ` LIMIT ${Math.floor(limit)}` : "";
}

/** อ่านใบจองตามเงื่อนไข (SELECT พร้อม WHERE แบบไดนามิก) */
export function getReservations(filter: ReservationFilter = {}): Reservation[] {
  const { where, params } = reservationWhere(filter);
  const rows = conn()
    .prepare(
      `SELECT res.* FROM reservations res ${where}
       ORDER BY ${ORDER_BY[filter.order ?? "start_asc"]}${limitClause(filter.limit)}`
    )
    .all(...params) as RawReservation[];
  return rows.map(toReservation);
}

/** นับจำนวนใบจองตามเงื่อนไข (ใช้ทำตัวเลขบนแท็บ) */
export function countReservations(filter: Omit<ReservationFilter, "limit" | "order"> = {}): number {
  const { where, params } = reservationWhere(filter);
  const row = conn().prepare(`SELECT COUNT(*) AS n FROM reservations res ${where}`).get(...params) as { n: number };
  return row.n;
}

type DetailedRow = RawReservation & {
  room_capacity: number;
  room_type: string;
  building_name: string;
  reserver_name: string;
  reserver_role: string;
  reserver_email: string;
  reserver_faculty: string | null;
  approver_name: string | null;
  cancellation_id: number | null;
  cancel_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  canceller_name: string | null;
  canceller_role: string | null;
};

/**
 * SELECT ใบจองแบบ JOIN: rooms, buildings, faculties, cancellations และ users สามบทบาท
 *   u  = ผู้จอง (reserved_by), a = ผู้อนุมัติ (approved_by), cu = ผู้ยกเลิก (cancellations.cancelled_by)
 * ใช้ LEFT JOIN กับผู้อนุมัติ/ใบยกเลิก เพราะใบจองส่วนใหญ่ยังไม่มีข้อมูลเหล่านี้ (NULL)
 */
function detailedRows(filter: ReservationFilter, exactId?: number): DetailedRow[] {
  const { where, params } = reservationWhere(filter);
  const byId = exactId !== undefined ? `${where ? `${where} AND` : "WHERE"} res.reservation_id = ?` : where;
  return conn()
    .prepare(
      `SELECT res.*, r.capacity AS room_capacity, r.room_type, b.building_name,
              u.full_name AS reserver_name, u.role AS reserver_role, u.email AS reserver_email,
              f.faculty_name AS reserver_faculty,
              a.full_name AS approver_name,
              c.cancellation_id, c.reason AS cancel_reason, c.cancelled_at, c.cancelled_by,
              cu.full_name AS canceller_name, cu.role AS canceller_role
       FROM reservations res
       JOIN rooms r ON r.room_code = res.room_code
       JOIN buildings b ON b.building_id = r.building_id
       JOIN users u ON u.user_id = res.reserved_by
       LEFT JOIN faculties f ON f.faculty_id = u.faculty_id
       LEFT JOIN users a ON a.user_id = res.approved_by
       LEFT JOIN cancellations c ON c.reservation_id = res.reservation_id
       LEFT JOIN users cu ON cu.user_id = c.cancelled_by
       ${byId}
       ORDER BY ${ORDER_BY[filter.order ?? "start_asc"]}${limitClause(filter.limit)}`
    )
    .all(...params, ...(exactId !== undefined ? [exactId] : [])) as DetailedRow[];
}

function toDetailed(row: DetailedRow): ReservationWithDetails {
  return {
    ...toReservation(row),
    room: {
      code: row.room_code,
      capacity: row.room_capacity,
      roomType: row.room_type as RoomType,
      building: { name: row.building_name },
    },
    reservedBy: {
      id: row.reserved_by,
      fullName: row.reserver_name,
      role: row.reserver_role as UserRole,
      email: row.reserver_email,
      facultyName: row.reserver_faculty,
    },
    approvedBy: row.approver_name ? { fullName: row.approver_name } : null,
    cancellation:
      row.cancellation_id !== null
        ? {
            id: row.cancellation_id,
            reason: row.cancel_reason,
            cancelledAt: fromSqliteDateTime(row.cancelled_at!),
            reservationId: row.reservation_id,
            cancelledBy: {
              id: row.cancelled_by!,
              fullName: row.canceller_name!,
              role: row.canceller_role as UserRole,
            },
          }
        : null,
  };
}

/** ใบจองพร้อมข้อมูลห้อง อาคาร และผู้จอง (หน้ารายการ) */
export function findReservationsWithDetails(filter: ReservationFilter = {}): ReservationWithDetails[] {
  return detailedRows(filter).map(toDetailed);
}

/** ใบจองเดียวพร้อมทุกอย่าง รวมผู้อนุมัติและใบยกเลิก (หน้ารายละเอียด) */
export function findReservationDetail(reservationId: number): ReservationWithDetails | null {
  const row = detailedRows({}, reservationId)[0];
  return row ? toDetailed(row) : null;
}

// ─── INSERT ──────────────────────────────────────────────────────────────────

/** เพิ่มผู้ใช้ใหม่ (สมัครใช้งาน) — รหัสผู้ใช้คือรหัส 10 หลักที่ผู้ใช้กรอกเอง */
export function insertUser(data: {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  role?: UserRole;
  facultyId: number | null;
}): void {
  // SQL: INSERT INTO ... VALUES (?, ?, ...) — ทุกค่าผ่านพารามิเตอร์ กัน SQL Injection
  conn()
    .prepare(
      `INSERT INTO users (user_id, full_name, email, phone, password_hash, role, faculty_id)
       VALUES (?, ?, ?, ?, ?, COALESCE(?, 'STUDENT'), ?)`
    )
    .run(
      data.id,
      data.fullName,
      data.email.toLowerCase(),
      data.phone,
      data.passwordHash,
      data.role ?? null,
      data.facultyId
    );
}

/** เพิ่มอาคาร (ผู้ดูแลระบบ) — คืนรหัสอาคาร */
export function insertBuilding(data: { name: string; numberOfFloors: number }): number {
  const { lastInsertRowid } = conn()
    .prepare(`INSERT INTO buildings (building_name, number_of_floors) VALUES (?, ?)`)
    .run(data.name, data.numberOfFloors);
  return Number(lastInsertRowid);
}

/** เพิ่มห้อง (ผู้ดูแลระบบ) — รหัสห้องเป็น PK ถ้าซ้ำฐานข้อมูลจะปฏิเสธเอง */
export function insertRoom(data: {
  code: string;
  capacity: number;
  roomType: RoomType;
  hasProjector: boolean;
  hasWhiteboard: boolean;
  buildingId: number;
}): void {
  conn()
    .prepare(
      `INSERT INTO rooms (room_code, capacity, room_type, has_projector, has_whiteboard, status, building_id)
       VALUES (?, ?, ?, ?, ?, 'AVAILABLE', ?)`
    )
    .run(
      data.code,
      data.capacity,
      data.roomType,
      data.hasProjector ? 1 : 0,
      data.hasWhiteboard ? 1 : 0,
      data.buildingId
    );
}

// ─── TRANSACTION: ออกใบจอง ───────────────────────────────────────────────────

/**
 * ออกใบจองภายในธุรกรรมเดียว:
 *   BEGIN IMMEDIATE → นับใบจองที่ทับช่วงเวลา → ถ้าไม่ทับจึง INSERT
 *   → UPDATE สถานะห้องเป็น "ถูกจอง" → COMMIT
 * ถ้ามีคำขอสองรายการเข้ามาพร้อมกัน รายการที่สองต้องรอล็อก (busy_timeout 5 วินาที)
 * แล้วจะเห็นใบจองแรกแน่นอน จึงไม่มีทางมีสองใบจองกินช่วงเวลาเดียวกันของห้องเดียวกัน
 * คืนเลขที่ใบจอง หรือ null ถ้าช่วงเวลาถูกจองไปก่อนแล้ว
 */
export function createReservationAtomically(data: {
  roomCode: string;
  reservedById: string;
  purpose: string;
  startAt: Date;
  endAt: Date;
  attendees: number;
}): number | null {
  const start = toSqliteDateTime(data.startAt);
  const end = toSqliteDateTime(data.endAt);
  return transaction(() => {
    // SELECT: นับใบจองที่ "ทับ" ช่วงเวลา [start, end) — ทับ = เริ่มก่อน end และจบหลัง start
    const { n } = conn()
      .prepare(
        `SELECT COUNT(*) AS n FROM reservations
         WHERE room_code = ? AND status IN ('PENDING', 'APPROVED')
           AND start_datetime < ? AND end_datetime > ?`
      )
      .get(data.roomCode, end, start) as { n: number };
    if (n > 0) return null;
    // INSERT ใบจองใหม่ (สถานะเริ่มต้น: รออนุมัติ)
    const { lastInsertRowid } = conn()
      .prepare(
        `INSERT INTO reservations (purpose, start_datetime, end_datetime, attendees, status, room_code, reserved_by)
         VALUES (?, ?, ?, ?, 'PENDING', ?, ?)`
      )
      .run(data.purpose, start, end, data.attendees, data.roomCode, data.reservedById);
    // UPDATE: ห้องเปลี่ยนเป็น "ถูกจอง"
    refreshRoomStatuses(data.roomCode);
    return Number(lastInsertRowid);
  });
}

// ─── TRANSACTION: ออกใบยกเลิก ────────────────────────────────────────────────

/**
 * ยกเลิกใบจองภายในธุรกรรมเดียว:
 *   UPDATE ใบจองเป็น CANCELLED (มีเงื่อนไข) → INSERT ใบยกเลิก (ใครยกเลิก เมื่อไร เพราะอะไร)
 *   → UPDATE สถานะห้องกลับเป็น "ว่าง" ถ้าไม่มีใบจองอื่นค้างอยู่ → COMMIT
 * onlyReservedBy: ถ้าระบุ จะยกเลิกได้เฉพาะใบจองของผู้ใช้คนนี้ (เจ้าของ) — ผู้ดูแลระบบไม่ต้องระบุ
 * คืนเลขที่ใบยกเลิก หรือ null ถ้ายกเลิกไม่ได้แล้ว (ถูกยกเลิก/ปฏิเสธไปก่อน หรือเลยเวลา)
 */
export function cancelReservation(data: {
  reservationId: number;
  cancelledById: string;
  reason: string | null;
  onlyReservedBy?: string;
  now?: Date;
}): number | null {
  const now = toSqliteDateTime(data.now ?? new Date());
  return transaction(() => {
    // UPDATE แบบมีเงื่อนไข: ถ้าสถานะถูกเปลี่ยนไปก่อนแล้ว จะไม่มีแถวถูกแก้ (changes = 0)
    let sql = `UPDATE reservations SET status = 'CANCELLED'
               WHERE reservation_id = ? AND status IN ('PENDING', 'APPROVED') AND end_datetime > ?`;
    const params: (number | string)[] = [data.reservationId, now];
    if (data.onlyReservedBy !== undefined) {
      sql += ` AND reserved_by = ?`;
      params.push(data.onlyReservedBy);
    }
    if (Number(conn().prepare(sql).run(...params).changes) === 0) return null;

    // INSERT ใบยกเลิก
    const { lastInsertRowid } = conn()
      .prepare(
        `INSERT INTO cancellations (reason, cancelled_at, reservation_id, cancelled_by)
         VALUES (?, ?, ?, ?)`
      )
      .run(data.reason, now, data.reservationId, data.cancelledById);

    // UPDATE: สถานะห้องกลับเป็น "ว่าง" (ถ้าไม่มีใบจองอื่นของห้องนี้ค้างอยู่)
    const { room_code } = conn()
      .prepare(`SELECT room_code FROM reservations WHERE reservation_id = ?`)
      .get(data.reservationId) as { room_code: string };
    refreshRoomStatuses(room_code);
    return Number(lastInsertRowid);
  });
}

// ─── UPDATE ──────────────────────────────────────────────────────────────────

/**
 * อนุมัติ/ปฏิเสธใบจองที่รออนุมัติ (ผู้ดูแลระบบ) — บันทึกว่าใครตัดสินและเมื่อไร
 * WHERE ตรวจสถานะเดิมก่อนแก้ กันสองคนตัดสินใบจองเดียวกันพร้อมกัน: คนที่สองจะแก้ไม่สำเร็จ
 * ถ้าปฏิเสธ ห้องจะกลับเป็น "ว่าง" (ถ้าไม่มีใบจองอื่นค้างอยู่)
 * คืน true ถ้าแก้สำเร็จ
 */
export function decideReservation(data: {
  reservationId: number;
  decision: "APPROVED" | "REJECTED";
  approverId: string;
  now?: Date;
}): boolean {
  const now = toSqliteDateTime(data.now ?? new Date());
  return transaction(() => {
    const { changes } = conn()
      .prepare(
        `UPDATE reservations SET status = ?, approved_by = ?, decided_at = ?
         WHERE reservation_id = ? AND status = 'PENDING' AND end_datetime > ?`
      )
      .run(data.decision, data.approverId, now, data.reservationId, now);
    if (Number(changes) === 0) return false;
    if (data.decision === "REJECTED") {
      const { room_code } = conn()
        .prepare(`SELECT room_code FROM reservations WHERE reservation_id = ?`)
        .get(data.reservationId) as { room_code: string };
      refreshRoomStatuses(room_code);
    }
    return true;
  });
}

/**
 * ปรับสถานะห้องให้ตรงกับใบจองจริง:
 *   มีใบจองที่รออนุมัติ/อนุมัติแล้วและยังไม่สิ้นสุด → RESERVED (ถูกจอง)
 *   ไม่มี                                       → AVAILABLE (ว่าง)
 * ห้องที่ปิดปรับปรุง (MAINTENANCE) ผู้ดูแลระบบตั้งเอง ไม่ถูกเปลี่ยน
 * ระบุ roomCode = ปรับห้องเดียว, ไม่ระบุ = ปรับทุกห้อง (ใบจองที่เลยเวลาแล้วห้องจะกลับเป็นว่าง)
 */
export function refreshRoomStatuses(roomCode?: string): void {
  const params: string[] = [toSqliteDateTime(new Date())];
  if (roomCode !== undefined) params.push(roomCode);
  conn()
    .prepare(
      `UPDATE rooms SET status = CASE
         WHEN EXISTS (
           SELECT 1 FROM reservations res
           WHERE res.room_code = rooms.room_code
             AND res.status IN ('PENDING', 'APPROVED')
             AND res.end_datetime > ?
         ) THEN 'RESERVED' ELSE 'AVAILABLE' END
       WHERE status <> 'MAINTENANCE'${roomCode !== undefined ? " AND room_code = ?" : ""}`
    )
    .run(...params);
  if (roomCode === undefined) globalThis.__roomStatusRefreshedAt = Date.now();
}

/** ปรับสถานะทุกห้องไม่เกินนาทีละครั้ง (เรียกก่อนอ่านห้อง เพื่อให้ใบจองที่เลยเวลาแล้วไม่ค้างสถานะ "ถูกจอง") */
function refreshRoomStatusesIfStale(): void {
  if (Date.now() - (globalThis.__roomStatusRefreshedAt ?? 0) > 60_000) refreshRoomStatuses();
}

/** แก้ไขอาคาร (ผู้ดูแลระบบ) */
export function updateBuilding(buildingId: number, data: { name: string; numberOfFloors: number }): boolean {
  const { changes } = conn()
    .prepare(`UPDATE buildings SET building_name = ?, number_of_floors = ? WHERE building_id = ?`)
    .run(data.name, data.numberOfFloors, buildingId);
  return changes > 0;
}

/**
 * แก้ไขห้อง (ผู้ดูแลระบบ) — ส่งเฉพาะฟิลด์ที่ต้องการแก้
 * สถานะที่ผู้ดูแลระบบตั้งได้คือ "ปิดปรับปรุง" หรือ "เปิดใช้งาน" (ระบบคำนวณว่าง/ถูกจองให้เอง)
 * รหัสห้องเป็น PK จึงแก้ไม่ได้ (ใบจองอ้างถึงอยู่) — ต้องเพิ่มห้องใหม่แทน
 */
export function updateRoom(
  roomCode: string,
  data: Partial<{
    capacity: number;
    roomType: RoomType;
    hasProjector: boolean;
    hasWhiteboard: boolean;
    maintenance: boolean;
    buildingId: number;
  }>
): boolean {
  // สร้าง "SET column = ?" เฉพาะฟิลด์ที่ส่งมา (ชื่อคอลัมน์เป็นค่าคงที่ทั้งหมด)
  const sets: string[] = [];
  const params: (number | string)[] = [];
  if (data.capacity !== undefined) { sets.push("capacity = ?"); params.push(data.capacity); }
  if (data.roomType !== undefined) { sets.push("room_type = ?"); params.push(data.roomType); }
  if (data.hasProjector !== undefined) { sets.push("has_projector = ?"); params.push(data.hasProjector ? 1 : 0); }
  if (data.hasWhiteboard !== undefined) { sets.push("has_whiteboard = ?"); params.push(data.hasWhiteboard ? 1 : 0); }
  if (data.maintenance !== undefined) { sets.push("status = ?"); params.push(data.maintenance ? "MAINTENANCE" : "AVAILABLE"); }
  if (data.buildingId !== undefined) { sets.push("building_id = ?"); params.push(data.buildingId); }
  if (!sets.length) return false;
  const { changes } = conn()
    .prepare(`UPDATE rooms SET ${sets.join(", ")} WHERE room_code = ?`)
    .run(...params, roomCode);
  // เปิดใช้งานอีกครั้ง → คำนวณว่าห้องว่างหรือถูกจองจากใบจองจริง
  if (changes > 0 && data.maintenance === false) refreshRoomStatuses(roomCode);
  return changes > 0;
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

/**
 * ลบห้อง (ผู้ดูแลระบบ) — ลบได้เฉพาะห้องที่ไม่มีประวัติการจอง
 * เพราะกฎ FK ON DELETE RESTRICT ใน sql/schema.sql จะปฏิเสธการลบเอง จึงตรวจก่อนเพื่อแจ้งข้อความที่เข้าใจง่าย
 */
export function deleteRoom(roomCode: string): "ok" | "has_reservations" | "not_found" {
  const used = conn()
    .prepare(`SELECT COUNT(*) AS n FROM reservations WHERE room_code = ?`)
    .get(roomCode) as { n: number };
  if (used.n > 0) return "has_reservations"; // มีประวัติการจอง — เปลี่ยนเป็นปิดปรับปรุงแทน
  const { changes } = conn().prepare(`DELETE FROM rooms WHERE room_code = ?`).run(roomCode);
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
