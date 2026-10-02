// ชนิดข้อมูลที่ใช้ทั่วทั้งแอป — ตรงกับตารางใน sql/schema.sql และแบบ Tables (ข้อ 4)

export type UserRole = "STUDENT" | "TEACHER" | "STAFF" | "ADMIN";
export type RoomType = "LECTURE" | "LAB" | "SEMINAR" | "MEETING";
/** AVAILABLE = ว่าง, RESERVED = ถูกจอง (มีใบจองที่ยังไม่สิ้นสุด), MAINTENANCE = ปิดปรับปรุง */
export type RoomStatus = "AVAILABLE" | "RESERVED" | "MAINTENANCE";
export type ReservationStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

/** แถวในตาราง faculties */
export type Faculty = {
  id: number; // faculty_id (PK)
  name: string; // faculty_name
};

/** แถวในตาราง users */
export type User = {
  id: string; // user_id (PK) รหัสนักศึกษา/บุคลากร 10 หลัก
  fullName: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  facultyId: number | null; // FK → faculties
};

/** แถวในตาราง buildings */
export type Building = {
  id: number; // building_id (PK)
  name: string; // building_name
  numberOfFloors: number;
};

/** แถวในตาราง rooms */
export type Room = {
  code: string; // room_code (PK)
  capacity: number;
  roomType: RoomType;
  hasProjector: boolean;
  hasWhiteboard: boolean;
  status: RoomStatus;
  buildingId: number; // FK → buildings
};

/** แถวในตาราง reservations (ใบจอง) */
export type Reservation = {
  id: number; // reservation_id (PK)
  purpose: string;
  startAt: Date; // start_datetime
  endAt: Date; // end_datetime
  attendees: number;
  status: ReservationStatus;
  createdAt: Date;
  decidedAt: Date | null;
  roomCode: string; // FK → rooms
  reservedById: string; // FK → users (ผู้จอง)
  approvedById: string | null; // FK → users (ผู้อนุมัติ)
};

/** แถวในตาราง cancellations (ใบยกเลิก) */
export type Cancellation = {
  id: number; // cancellation_id (PK)
  reason: string | null;
  cancelledAt: Date;
  reservationId: number; // FK → reservations
  cancelledById: string; // FK → users (ผู้ยกเลิก)
};

// ─── ข้อมูลที่ JOIN เพิ่มเพื่อแสดงผล ───

export type RoomWithBuilding = Room & {
  building: Pick<Building, "id" | "name">;
};

/** ผู้ใช้แบบย่อสำหรับแสดงชื่อในใบจอง/ใบยกเลิก */
export type UserSummary = { id: string; fullName: string; role: UserRole };

/** ใบยกเลิก + ชื่อผู้ยกเลิก */
export type CancellationWithCanceller = Omit<Cancellation, "cancelledById"> & { cancelledBy: UserSummary };

/** ใบจอง + ห้อง/อาคาร + ผู้จอง + ผู้อนุมัติ + ใบยกเลิก (ถ้ามี) */
export type ReservationWithDetails = Reservation & {
  room: { code: string; capacity: number; roomType: RoomType; building: { name: string } };
  reservedBy: UserSummary & { email: string; facultyName: string | null };
  approvedBy: { fullName: string } | null;
  cancellation: CancellationWithCanceller | null;
};
