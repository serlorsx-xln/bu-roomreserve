-- ─────────────────────────────────────────────────────────────────────────────
-- โครงสร้างฐานข้อมูล ระบบจองห้องเรียน มหาวิทยาลัยกรุงเทพ (SQLite)
-- ตรงกับแบบ "Tables (Relational Schema)" ทุกชื่อตารางและคอลัมน์
-- รันครั้งเดียวตอนสร้างฐานข้อมูลใหม่:  npm run db:reset
--
-- 6 ตาราง: faculties, users, buildings, rooms, reservations (ใบจอง), cancellations (ใบยกเลิก)
-- ─────────────────────────────────────────────────────────────────────────────

-- ตารางคณะ (ใช้เป็นตัวเลือกตอนสมัครใช้งาน)
CREATE TABLE IF NOT EXISTS faculties (
  faculty_id    INTEGER PRIMARY KEY AUTOINCREMENT,       -- PK
  faculty_name  TEXT    NOT NULL UNIQUE                  -- ชื่อคณะ
);

-- ตารางผู้ใช้งาน — user_id คือรหัสนักศึกษา/รหัสบุคลากร 10 หลัก (ใช้เข้าสู่ระบบ)
CREATE TABLE IF NOT EXISTS users (
  user_id       TEXT    PRIMARY KEY                      -- PK รหัส 10 หลัก เช่น "1650012345"
                CHECK (length(user_id) = 10 AND user_id NOT GLOB '*[^0-9]*'),
  full_name     TEXT    NOT NULL,                        -- ชื่อ-นามสกุล
  email         TEXT    NOT NULL UNIQUE,                 -- อีเมล (ใช้ติดต่อ)
  phone         TEXT,                                    -- เบอร์โทรศัพท์ (NULL ได้)
  password_hash TEXT    NOT NULL,                        -- รหัสผ่านที่เข้ารหัสด้วย bcrypt
  role          TEXT    NOT NULL DEFAULT 'STUDENT'       -- STUDENT | TEACHER | STAFF | ADMIN
                CHECK (role IN ('STUDENT', 'TEACHER', 'STAFF', 'ADMIN')),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now', '+7 hours')),  -- วันที่สมัคร (เวลาไทย)
  faculty_id    INTEGER,                                 -- FK → faculties (NULL ได้ เช่น เจ้าหน้าที่ส่วนกลาง)
  FOREIGN KEY (faculty_id) REFERENCES faculties (faculty_id) ON DELETE RESTRICT
);

-- ตารางอาคาร
CREATE TABLE IF NOT EXISTS buildings (
  building_id       INTEGER PRIMARY KEY AUTOINCREMENT,  -- PK
  building_name     TEXT    NOT NULL,                   -- ชื่ออาคาร
  number_of_floors  INTEGER NOT NULL DEFAULT 1           -- จำนวนชั้น
);

-- ตารางห้องเรียน — room_code คือรหัสห้องและเป็น PK ตัวเดียว (ไม่มีเลขรันแยก)
CREATE TABLE IF NOT EXISTS rooms (
  room_code      TEXT    PRIMARY KEY,                    -- PK รหัสห้อง เช่น "A1-101"
  capacity       INTEGER NOT NULL CHECK (capacity > 0),  -- จำนวนที่นั่ง
  room_type      TEXT    NOT NULL DEFAULT 'LECTURE'      -- LECTURE | LAB | SEMINAR | MEETING
                 CHECK (room_type IN ('LECTURE', 'LAB', 'SEMINAR', 'MEETING')),
  has_projector  INTEGER NOT NULL DEFAULT 0,             -- 0 = ไม่มี, 1 = มี
  has_whiteboard INTEGER NOT NULL DEFAULT 1,             -- 0 = ไม่มี, 1 = มี
  status         TEXT    NOT NULL DEFAULT 'AVAILABLE'    -- AVAILABLE ว่าง | RESERVED ถูกจอง | MAINTENANCE ปิดปรับปรุง
                 CHECK (status IN ('AVAILABLE', 'RESERVED', 'MAINTENANCE')),
  building_id    INTEGER NOT NULL,                       -- FK → buildings
  FOREIGN KEY (building_id) REFERENCES buildings (building_id) ON DELETE RESTRICT
);

-- ตารางการจอง (ใบจอง)
CREATE TABLE IF NOT EXISTS reservations (
  reservation_id  INTEGER PRIMARY KEY AUTOINCREMENT,     -- PK เลขที่ใบจอง
  purpose         TEXT    NOT NULL,                      -- วัตถุประสงค์การใช้ห้อง
  start_datetime  TEXT    NOT NULL,                      -- เริ่มใช้ห้อง (ISO 8601 เวลาไทย)
  end_datetime    TEXT    NOT NULL,                      -- สิ้นสุด
  attendees       INTEGER NOT NULL CHECK (attendees > 0),-- จำนวนผู้เข้าร่วม
  status          TEXT    NOT NULL DEFAULT 'PENDING'     -- PENDING | APPROVED | REJECTED | CANCELLED
                  CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  created_at      TEXT    NOT NULL DEFAULT (datetime('now', '+7 hours')),  -- วันเวลาที่จอง
  decided_at      TEXT,                                  -- เวลาที่อนุมัติ/ปฏิเสธ (NULL ได้)
  room_code       TEXT    NOT NULL,                      -- FK → rooms (ห้องที่จอง)
  reserved_by     TEXT    NOT NULL,                      -- FK → users (ผู้จอง)
  approved_by     TEXT,                                  -- FK → users (ผู้อนุมัติ, NULL ได้)
  CHECK (end_datetime > start_datetime),
  FOREIGN KEY (room_code)   REFERENCES rooms (room_code)  ON DELETE RESTRICT,
  FOREIGN KEY (reserved_by) REFERENCES users (user_id)    ON DELETE RESTRICT,
  FOREIGN KEY (approved_by) REFERENCES users (user_id)    ON DELETE SET NULL
);

-- ตารางการยกเลิก (ใบยกเลิก) — ใบจอง 1 ใบ ยกเลิกได้ครั้งเดียว (reservation_id เป็น UNIQUE)
CREATE TABLE IF NOT EXISTS cancellations (
  cancellation_id INTEGER PRIMARY KEY AUTOINCREMENT,     -- PK เลขที่ใบยกเลิก
  reason          TEXT,                                  -- เหตุผลที่ยกเลิก (NULL ได้)
  cancelled_at    TEXT    NOT NULL DEFAULT (datetime('now', '+7 hours')),  -- วันเวลาที่ยกเลิก
  reservation_id  INTEGER NOT NULL UNIQUE,               -- FK → reservations (ใบจองที่ถูกยกเลิก)
  cancelled_by    TEXT    NOT NULL,                      -- FK → users (ผู้ยกเลิก)
  FOREIGN KEY (reservation_id) REFERENCES reservations (reservation_id) ON DELETE RESTRICT,
  FOREIGN KEY (cancelled_by)   REFERENCES users (user_id)               ON DELETE RESTRICT
);

-- ดัชนีสำหรับค้นหาการจองทับช่วงเวลาของห้อง (ใช้บ่อยที่สุดในระบบ)
CREATE INDEX IF NOT EXISTS idx_reservations_room_time
  ON reservations (room_code, start_datetime, end_datetime);

-- ดัชนีค้นหาการจองของผู้ใช้แต่ละคน (หน้า "การจองของฉัน")
CREATE INDEX IF NOT EXISTS idx_reservations_reserved_by
  ON reservations (reserved_by, start_datetime);
