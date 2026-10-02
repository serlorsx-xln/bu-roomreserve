// หน้า "จัดการอาคาร/ห้อง" (เฉพาะผู้ดูแลระบบ): เพิ่ม แก้ไข ลบ อาคารและห้องเรียน
// เป็นส่วนเดียวของระบบที่ใช้คำสั่ง DELETE (ผ่าน /api/admin/rooms)
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { BuildingForm, DeleteRoomButton, MaintenanceSelect, RoomForm } from "@/components/admin/room-manager";
import { RoomStatusBadge } from "@/components/room-status";
import { requireAdmin } from "@/lib/auth";
import { ROOM_TYPE_LABEL } from "@/lib/constants";
import { getBuildings, getRooms } from "@/lib/db";

export const metadata: Metadata = { title: "จัดการอาคาร/ห้อง" };

export default async function AdminRoomsPage() {
  await requireAdmin("/admin/rooms");

  // SQL: SELECT buildings / SELECT rooms (เรียงตามอาคาร แล้วรหัสห้อง)
  const buildings = getBuildings();
  const roomsByBuilding = buildings.map((b) => ({ building: b, rooms: getRooms({ buildingId: b.id }) }));

  return (
    <PageContainer className="max-w-[1000px]">
      <PageHeader
        title="จัดการอาคาร/ห้อง"
        description="เพิ่มอาคารและห้องเรียน ปิดห้องเพื่อปรับปรุง และลบข้อมูลที่ไม่ใช้แล้ว สถานะว่าง/ถูกจองระบบเปลี่ยนให้เองตามใบจอง ลบได้เฉพาะห้องที่ไม่มีประวัติการจอง"
      />

      <div className="space-y-8">
        {/* ─── ฟอร์มเพิ่มข้อมูลใหม่ ─── */}
        <section aria-labelledby="add-building" className="rounded-lg border bg-card p-5">
          <h2 id="add-building" className="mb-3 text-base font-bold">เพิ่มอาคาร</h2>
          <BuildingForm />
        </section>

        <section aria-labelledby="add-room" className="rounded-lg border bg-card p-5">
          <h2 id="add-room" className="mb-3 text-base font-bold">เพิ่มห้องเรียน</h2>
          <RoomForm buildings={buildings.map((b) => ({ id: b.id, name: b.name }))} />
        </section>

        {/* ─── รายการอาคารและห้องทั้งหมด ─── */}
        <section aria-labelledby="list">
          <h2 id="list" className="mb-3 text-base font-bold">
            อาคารและห้องทั้งหมด
          </h2>

          <div className="space-y-6">
            {roomsByBuilding.map(({ building, rooms }) => (
              <div key={building.id} className="rounded-lg border bg-card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
                  <div>
                    <h3 className="text-sm font-bold">{building.name}</h3>
                    <p className="text-xs text-muted-foreground">{building.numberOfFloors} ชั้น · {rooms.length} ห้อง</p>
                  </div>
                  <DeleteRoomButton
                    kind="building"
                    id={building.id}
                    label={`อาคาร${building.name}`}
                    reason={`จะลบอาคาร "${building.name}" ออกจากระบบ ลบได้เฉพาะอาคารที่ไม่มีห้องเหลืออยู่`}
                  />
                </div>

                <ul className="divide-y">
                  {rooms.map((room) => (
                    <li key={room.code} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                      <span className="text-sm font-bold tabular-nums">{room.code}</span>
                      <RoomStatusBadge status={room.status} />
                      <Badge variant="secondary" className="rounded-md font-normal text-body">
                        {room.capacity} ที่นั่ง
                      </Badge>
                      <Badge variant="secondary" className="rounded-md font-normal text-body">
                        {ROOM_TYPE_LABEL[room.roomType]}
                      </Badge>
                      <div className="ms-auto flex items-center gap-2">
                        <MaintenanceSelect roomCode={room.code} maintenance={room.status === "MAINTENANCE"} />
                        <DeleteRoomButton
                          kind="room"
                          id={room.code}
                          label={`ห้อง ${room.code}`}
                          reason={`จะลบห้อง ${room.code} ออกจากระบบ ลบได้เฉพาะห้องที่ไม่มีประวัติการจอง (ห้องที่เคยถูกจองให้เปลี่ยนเป็น "ปิดปรับปรุง" แทน)`}
                        />
                      </div>
                    </li>
                  ))}
                  {rooms.length === 0 ? (
                    <li className="px-5 py-4 text-sm text-muted-foreground">ยังไม่มีห้องในอาคารนี้</li>
                  ) : null}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
