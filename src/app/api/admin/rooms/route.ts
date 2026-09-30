// API ผู้ดูแลระบบ: จัดการอาคารและห้องเรียน (เฉพาะ ADMIN)
// SQL ครบทั้ง INSERT / UPDATE / DELETE — ผ่านฟังก์ชันของ src/lib/db.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteBuilding, deleteRoom, insertBuilding, insertRoom, updateBuilding, updateRoom } from "@/lib/db";
import { z } from "zod";

/** ตรวจว่าผู้ที่เรียกเป็นผู้ดูแลระบบ — ไม่ใช่จะไม่มีสิทธิ์แก้ข้อมูลอาคาร/ห้องเด็ดขาด */
async function requireAdminApi() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 }) };
  if (user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" }, { status: 403 }) };
  }
  return { user };
}

// ─── รูปแบบข้อมูล (Zod ตรวจก่อนใช้เสมอ) ───
const roomType = z.enum(["LECTURE", "LAB", "SEMINAR", "MEETING"]);
const roomStatus = z.enum(["AVAILABLE", "MAINTENANCE", "CLOSED"]);

const buildingSchema = z.object({
  kind: z.literal("building"),
  name: z.string({ error: "กรุณากรอกชื่ออาคาร" }).trim().min(2, "กรุณากรอกชื่ออาคาร").max(100, "ชื่ออาคารยาวได้ไม่เกิน 100 ตัวอักษร"),
  numberOfFloors: z.coerce.number({ error: "จำนวนชั้นต้องเป็นตัวเลข" }).int().min(1, "อาคารต้องมีอย่างน้อย 1 ชั้น").max(100, "จำนวนชั้นมากเกินไป"),
});

// สำหรับ PATCH: ทุกฟิลด์เป็นทางเลือก (ส่งมาแก้เฉพาะฟิลด์ที่ต้องการ)
const roomPatchSchema = z.object({
  kind: z.literal("room"),
  id: z.coerce.number().int().positive(),
  code: z.string().trim().min(2).max(20).optional(),
  capacity: z.coerce.number().int().min(1).max(1000).optional(),
  roomType: roomType.optional(),
  hasProjector: z.boolean().optional(),
  hasWhiteboard: z.boolean().optional(),
  status: roomStatus.optional(),
  buildingId: z.coerce.number().int().positive().optional(),
});

const roomSchema = z.object({
  kind: z.literal("room"),
  code: z.string({ error: "กรุณากรอกรหัสห้อง" }).trim().min(2, "กรุณากรอกรหัสห้อง").max(20, "รหัสห้องยาวได้ไม่เกิน 20 ตัวอักษร"),
  capacity: z.coerce.number({ error: "จำนวนที่นั่งต้องเป็นตัวเลข" }).int().min(1, "ห้องต้องมีอย่างน้อย 1 ที่นั่ง").max(1000, "จำนวนที่นั่งมากเกินไป"),
  roomType,
  hasProjector: z.boolean().default(false),
  hasWhiteboard: z.boolean().default(true),
  status: roomStatus.default("AVAILABLE"),
  buildingId: z.coerce.number().int().positive("กรุณาเลือกอาคาร"),
});

/** POST /api/admin/rooms — เพิ่มอาคารใหม่หรือห้องใหม่ (SQL: INSERT) */
export async function POST(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = (body?.kind === "room" ? roomSchema : buildingSchema).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    if (parsed.data.kind === "building") {
      // SQL: INSERT INTO buildings (building_name, number_of_floors) VALUES (?, ?)
      const id = insertBuilding({ name: parsed.data.name, numberOfFloors: parsed.data.numberOfFloors });
      return NextResponse.json({ id }, { status: 201 });
    }
    // SQL: INSERT INTO rooms (...) VALUES (?, ?, ...) — รหัสห้องซ้ำจะถูก UNIQUE ปฏิเสธ
    const id = insertRoom({
      code: parsed.data.code,
      capacity: parsed.data.capacity,
      roomType: parsed.data.roomType,
      hasProjector: parsed.data.hasProjector,
      hasWhiteboard: parsed.data.hasWhiteboard,
      status: parsed.data.status,
      buildingId: parsed.data.buildingId,
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    if (String((err as Error).message).includes("UNIQUE constraint failed")) {
      return NextResponse.json({ error: "รหัสห้องนี้มีอยู่แล้ว" }, { status: 409 });
    }
    throw err;
  }
}

/** PATCH /api/admin/rooms — แก้ไขอาคารหรือห้อง (SQL: UPDATE) */
export async function PATCH(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "คำขอไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    if (body?.kind === "building") {
      const parsed = buildingSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
      }
      // SQL: UPDATE buildings SET building_name = ?, number_of_floors = ? WHERE building_id = ?
      const ok = updateBuilding(id, { name: parsed.data.name, numberOfFloors: parsed.data.numberOfFloors });
      return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "ไม่พบอาคารนี้" }, { status: 404 });
    }
    if (body?.kind === "room") {
      // PATCH ส่งได้ทีละฟิลด์ (เช่นแค่เปลี่ยนสถานะ) — schema แยกต่างหากจาก POST ที่ต้องกรอกครบ
      const parsed = roomPatchSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
      }
      // SQL: UPDATE rooms SET ... WHERE room_id = ? (SET เฉพาะฟิลด์ที่ส่งมา)
      const ok = updateRoom(id, parsed.data);
      return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "ไม่พบห้องนี้" }, { status: 404 });
    }
    return NextResponse.json({ error: "คำขอไม่ถูกต้อง" }, { status: 400 });
  } catch (err) {
    if (String((err as Error).message).includes("UNIQUE constraint failed")) {
      return NextResponse.json({ error: "รหัสห้องนี้มีอยู่แล้ว" }, { status: 409 });
    }
    throw err;
  }
}

/** DELETE /api/admin/rooms?kind=room&id=3 — ลบห้องหรืออาคาร (SQL: DELETE) */
export async function DELETE(request: Request) {
  const { error } = await requireAdminApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  const kind = searchParams.get("kind");
  if (!Number.isInteger(id) || id <= 0 || !["room", "building"].includes(kind ?? "")) {
    return NextResponse.json({ error: "คำขอไม่ถูกต้อง" }, { status: 400 });
  }

  // SQL: DELETE FROM rooms WHERE room_id = ? (หรือ buildings) — ลบได้เฉพาะที่ไม่มีข้อมูลผูกอยู่
  const result = kind === "room" ? deleteRoom(id) : deleteBuilding(id);
  switch (result) {
    case "ok":
      return NextResponse.json({ ok: true });
    case "has_reservations":
      return NextResponse.json(
        { error: "ห้องนี้มีประวัติการจองอยู่ ลบไม่ได้ (เปลี่ยนสถานะเป็นปิดใช้งานแทนได้)" },
        { status: 409 }
      );
    case "has_rooms":
      return NextResponse.json({ error: "อาคารนี้ยังมีห้องอยู่ ลบห้องออกก่อนจึงจะลบอาคารได้" }, { status: 409 });
    default:
      return NextResponse.json({ error: "ไม่พบข้อมูลนี้" }, { status: 404 });
  }
}
