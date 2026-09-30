// ชนิดข้อมูลที่ใช้ทั่วทั้งแอป — ตรงกับตารางใน sql/schema.sql และแบบ Tables (ข้อ 4)
// เดิมใช้ชนิดจาก @prisma/client ตอนนี้ระบบใช้ SQL ตรงผ่าน src/lib/db.ts จึงนิยามเองที่นี่

export type UserRole = "STUDENT" | "TEACHER" | "STAFF" | "ADMIN";
export type RoomType = "LECTURE" | "LAB" | "SEMINAR" | "MEETING";
export type RoomStatus = "AVAILABLE" | "MAINTENANCE" | "CLOSED";
export type ReservationStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

/** แถวในตาราง users */
export type User = {
  id: number; // user_id (PK)
  studentId: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
};

/** แถวในตาราง buildings */
export type Building = {
  id: number; // building_id (PK)
  name: string; // building_name
  numberOfFloors: number;
};

/** แถวในตาราง rooms */
export type Room = {
  id: number; // room_id (PK)
  code: string;
  capacity: number;
  roomType: RoomType;
  hasProjector: boolean;
  hasWhiteboard: boolean;
  status: RoomStatus;
  buildingId: number; // FK → buildings
};

/** แถวในตาราง reservations */
export type Reservation = {
  id: number; // reservation_id (PK)
  purpose: string;
  startAt: Date; // start_datetime
  endAt: Date; // end_datetime
  attendees: number;
  status: ReservationStatus;
  createdAt: Date;
  decidedAt: Date | null;
  roomId: number; // FK → rooms
  userId: number; // FK → users (ผู้จอง)
  approvedById: number | null; // FK → users (ผู้อนุมัติ)
};

// ─── ข้อมูลที่ JOIN เพิ่มเพื่อแสดงผล ───

export type RoomWithBuilding = Room & {
  building: Pick<Building, "id" | "name">;
};

/** การจอง + ห้อง/อาคาร + ผู้จอง (ใช้ในหน้ารายการทั้งหลาย) */
export type ReservationWithDetails = Reservation & {
  room: { code: string; capacity: number; roomType: RoomType; building: { name: string } };
  user: { fullName: string; role: UserRole; email: string };
};

/** การจอง + ชื่อผู้อนุมัติ (หน้ารายละเอียดการจอง) */
export type ReservationDetail = ReservationWithDetails & {
  approvedBy: { fullName: string } | null;
};
