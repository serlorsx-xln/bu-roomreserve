// หน้า "ห้องว่าง": ตารางห้อง × ชั่วโมงของวันที่เลือก
import type { Metadata } from "next";
import Link from "next/link";
import {
  AvailabilityBoard,
  BoardLegend,
  type BoardBuilding,
} from "@/components/availability/availability-board";
import { BoardToolbar, type BoardFilters } from "@/components/availability/board-toolbar";
import { PageContainer, PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { getCurrentUser } from "@/lib/auth";
import { buildDaySegments, isWithinBookingWindow } from "@/lib/availability";
import { BLOCKING_STATUSES, CAPACITY_FILTERS, CLOSE_HOUR, MAX_ADVANCE_DAYS, OPEN_HOUR } from "@/lib/constants";
import { addDays, atHour, formatHour, isDateKey, toDateKey } from "@/lib/format";
import { getBuildings, getReservations, getRooms } from "@/lib/db";
import { availabilityHref } from "@/lib/routes";
import { firstParam, type SearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "ห้องว่าง" };

export default async function AvailabilityPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const now = new Date();
  const todayKey = toDateKey(now);
  const maxKey = toDateKey(addDays(now, MAX_ADVANCE_DAYS));

  // วันที่ที่ดู (ถ้าไม่ระบุ หรืออยู่นอกช่วงจอง ให้ใช้วันนี้)
  const dateKey =
    isDateKey(params.date) && isWithinBookingWindow(params.date, now) ? params.date : todayKey;
  const filters = parseFilters(params);

  const user = await getCurrentUser();

  // ดึงอาคาร → ห้อง → การจองของวันนั้น ในคำสั่งเดียว (ใช้ JOIN ผ่าน include)
  // SQL: SELECT buildings / SELECT rooms ตามตัวกรอง / SELECT reservations ของวันนั้น
  const buildingOptions = getBuildings();
  const dayStart = atHour(dateKey, 0);
  const dayEnd = atHour(dateKey, 24);
  const buildings = buildingOptions
    .filter((b) => filters.building === "all" || b.id === Number(filters.building))
    .map((b) => ({
      ...b,
      rooms: getRooms({
        buildingId: b.id,
        minCapacity: filters.capacity === "all" ? undefined : Number(filters.capacity),
        hasProjector: filters.equipment.includes("projector") || undefined,
        hasWhiteboard: filters.equipment.includes("whiteboard") || undefined,
      }).map((room) => ({
        ...room,
        reservations: getReservations({
          roomId: room.id,
          statuses: BLOCKING_STATUSES,
          endAfter: dayStart,
          startBefore: dayEnd,
          order: "start_asc",
        }),
      })),
    }));

  const board: BoardBuilding[] = buildings
    .filter((building) => building.rooms.length > 0)
    .map((building) => ({
      id: building.id,
      name: building.name,
      rooms: building.rooms.map((room) => ({
        id: room.id,
        code: room.code,
        capacity: room.capacity,
        roomType: room.roomType,
        status: room.status,
        segments: buildDaySegments(dateKey, room.reservations, now),
      })),
    }));

  const roomCount = board.reduce((sum, b) => sum + b.rooms.length, 0);
  const hasFilters = filters.building !== "all" || filters.capacity !== "all" || filters.equipment.length > 0;

  return (
    <PageContainer>
      <PageHeader
        title="ห้องว่าง"
        description="เลือกช่วงเวลาที่ว่างในตารางเพื่อจองห้อง ทุกคำขอต้องรอผู้ดูแลระบบอนุมัติก่อนใช้งาน"
      />

      <BoardToolbar
        dateKey={dateKey}
        todayKey={todayKey}
        maxKey={maxKey}
        buildings={buildingOptions}
        filters={filters}
      />

      <div className="mt-5 mb-3 flex flex-wrap items-center justify-between gap-3">
        <BoardLegend showMine={user !== null} />
        <p className="text-xs text-muted-foreground">
          {roomCount} ห้อง · เปิดให้จอง {formatHour(OPEN_HOUR)}–{formatHour(CLOSE_HOUR)} น. ·
          จองล่วงหน้าได้ไม่เกิน {MAX_ADVANCE_DAYS} วัน
        </p>
      </div>

      {board.length > 0 ? (
        <AvailabilityBoard buildings={board} dateKey={dateKey} viewer={{ userId: user?.id ?? null, now }} />
      ) : (
        <Empty className="rounded-lg border bg-card py-16">
          <EmptyHeader>
            <EmptyTitle>ไม่พบห้องที่ตรงกับตัวกรอง</EmptyTitle>
            <EmptyDescription>ลองลดจำนวนที่นั่งขั้นต่ำ หรือเลือกอาคารอื่น</EmptyDescription>
          </EmptyHeader>
          {hasFilters ? (
            <EmptyContent>
              <Button variant="outline" render={<Link href={availabilityHref(dateKey === todayKey ? undefined : dateKey)} />}>
                ล้างตัวกรอง
              </Button>
            </EmptyContent>
          ) : null}
        </Empty>
      )}
    </PageContainer>
  );
}

/** อ่านค่าตัวกรองจาก URL (ค่าที่ไม่ถูกต้องจะถูกละไว้) */
function parseFilters(params: Record<string, string | string[] | undefined>): BoardFilters {
  const building = firstParam(params.building);
  const capacity = firstParam(params.capacity);
  const equipment = firstParam(params.equipment)?.split(",") ?? [];
  return {
    building: building && /^\d+$/.test(building) ? building : "all",
    capacity: CAPACITY_FILTERS.some((seats) => String(seats) === capacity) ? capacity! : "all",
    equipment: equipment.filter((e) => e === "projector" || e === "whiteboard"),
  };
}
