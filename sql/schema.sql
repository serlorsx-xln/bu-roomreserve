-- ─────────────────────────────────────────────────────────────────────────────
-- โครงสร้างฐานข้อมูล ระบบจองห้องเรียน มหาวิทยาลัยกรุงเทพ (SQLite)
-- ตรงกับแบบ "Tables (Relational Schema)" ทุกชื่อตารางและคอลัมน์
-- รันครั้งเดียวตอนสร้างฐานข้อมูลใหม่:  npm run db:init
-- ─────────────────────────────────────────────────────────────────────────────

-- ตารางอาคาร
CREATE TABLE IF NOT EXISTS buildings (
  building_id       INTEGER PRIMARY KEY AUTOINCREMENT,  -- PK
  building_name     TEXT    NOT NULL,                   -- ชื่ออาคาร
  number_of_floors  INTEGER NOT NULL DEFAULT 1           -- จำนวนชั้น
);

-- ตารางห้องเรียน
CREATE TABLE IF NOT EXISTS rooms (
  room_id        INTEGER PRIMARY KEY AUTOINCREMENT,      -- PK
  room_code      TEXT    NOT NULL UNIQUE,                -- รหัสห้อง เช่น "IF-3M101"
  capacity       INTEGER NOT NULL,                       -- จำนวนที่นั่ง
  room_type      TEXT    NOT NULL DEFAULT 'LECTURE',     -- LECTURE | LAB | SEMINAR | MEETING
  has_projector  INTEGER NOT NULL DEFAULT 0,             -- 0 = ไม่มี, 1 = มี
  has_whiteboard INTEGER NOT NULL DEFAULT 1,             -- 0 = ไม่มี, 1 = มี
  status         TEXT    NOT NULL DEFAULT 'AVAILABLE',   -- AVAILABLE | MAINTENANCE | CLOSED
  building_id    INTEGER NOT NULL,                       -- FK → buildings.building_id
  FOREIGN KEY (building_id) REFERENCES buildings (building_id) ON DELETE RESTRICT
);

-- ตารางผู้ใช้งาน
CREATE TABLE IF NOT EXISTS users (
  user_id       INTEGER PRIMARY KEY AUTOINCREMENT,       -- PK
  student_id    TEXT    UNIQUE,                          -- รหัสนักศึกษา (เฉพาะนักศึกษา, NULL ได้)
  full_name     TEXT    NOT NULL,                        -- ชื่อ-นามสกุล
  email         TEXT    NOT NULL UNIQUE,                 -- อีเมล (ใช้ล็อกอิน)
  phone         TEXT,                                    -- เบอร์โทรศัพท์ (NULL ได้)
  password_hash TEXT    NOT NULL,                        -- รหัสผ่านที่เข้ารหัสด้วย bcrypt
  role          TEXT    NOT NULL DEFAULT 'STUDENT',      -- STUDENT | TEACHER | STAFF | ADMIN
  created_at    TEXT    NOT NULL DEFAULT (datetime('now', '+7 hours'))  -- วันที่สมัคร (เวลาไทย)
);

-- ตารางการจอง
CREATE TABLE IF NOT EXISTS reservations (
  reservation_id  INTEGER PRIMARY KEY AUTOINCREMENT,     -- PK
  purpose         TEXT    NOT NULL,                      -- วัตถุประสงค์การใช้ห้อง
  start_datetime  TEXT    NOT NULL,                      -- เริ่มใช้ห้อง (ISO 8601 เวลาไทย)
  end_datetime    TEXT    NOT NULL,                      -- สิ้นสุด (ต้องหลัง start_datetime)
  attendees       INTEGER NOT NULL,                      -- จำนวนผู้เข้าร่วม
  status          TEXT    NOT NULL DEFAULT 'PENDING',    -- PENDING | APPROVED | REJECTED | CANCELLED
  created_at      TEXT    NOT NULL DEFAULT (datetime('now', '+7 hours')),
  decided_at      TEXT,                                  -- เวลาที่อนุมัติ/ปฏิเสธ (NULL ได้)
  room_id         INTEGER NOT NULL,                      -- FK → rooms.room_id
  user_id         INTEGER NOT NULL,                      -- FK → users.user_id (ผู้จอง)
  approved_by     INTEGER,                               -- FK → users.user_id (ผู้อนุมัติ, NULL ได้)
  FOREIGN KEY (room_id)     REFERENCES rooms (room_id)      ON DELETE RESTRICT,
  FOREIGN KEY (user_id)     REFERENCES users (user_id)      ON DELETE RESTRICT,
  FOREIGN KEY (approved_by) REFERENCES users (user_id)      ON DELETE SET NULL
);

-- ดัชนีสำหรับค้นหาการจองทับช่วงเวลาของห้อง (ใช้บ่อยที่สุดในระบบ)
CREATE INDEX IF NOT EXISTS idx_reservations_room_time
  ON reservations (room_id, start_datetime, end_datetime);

-- ดัชนีค้นหาการจองของผู้ใช้แต่ละคน (หน้า "การจองของฉัน")
CREATE INDEX IF NOT EXISTS idx_reservations_user
  ON reservations (user_id, start_datetime);
