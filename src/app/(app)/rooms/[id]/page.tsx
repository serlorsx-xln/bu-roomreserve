// หน้าจองห้อง: ดึงข้อมูลห้องและการจองในช่วงที่จองได้ แล้วส่งให้ Booker (client)
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Booker } from "@/components/booker/booker";
import { PageContainer } from "@/components/page";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getCurrentUser } from "@/lib/auth";
import { BLOCKING_STATUSES, MAX_ADVANCE_DAYS } from "@/lib/constants";
import { addDays, atHour, isDateKey, toDateKey } from "@/lib/format";
import { findRoomWithBuilding, getReservations } from "@/lib/db";
import { firstParam, type SearchParams } from "@/lib/search-params";

type Params = Promise<{ id: string }>;
// ห่อด้วย cache(): generateMetadata กับตัวหน้าเรียกซ้ำกันใน request เดียว แต่ query ฐานข้อมูลครั้งเดียว
const findRoom = cache(async (id: string) => {
  const roomId = Number(id);
  if (!Number.isInteger(roomId) || roomId <= 0) return null;
  // SQL: SELECT rooms JOIN buildings WHERE room_id = ?
  return findRoomWithBuilding(roomId);
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const room = await findRoom((await params).id);
  return { title: room ? `จองห้อง ${room.code}` : "ไม่พบห้อง" };
}

export default async function RoomBookingPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const room = await findRoom((await params).id);
  if (!room) notFound();

  const query = await searchParams;
  const now = new Date();
  const todayKey = toDateKey(now);
  const maxKey = toDateKey(addDays(now, MAX_ADVANCE_DAYS));

  // การจองที่ยังกันเวลาอยู่ ภายในช่วงที่จองได้ (ดึงเฉพาะเวลาและสถานะ ไม่ส่งข้อมูลผู้จองไปเบราว์เซอร์)
  // SQL: SELECT start_datetime, end_datetime, status WHERE room_id = ? AND status IN (...)
  const reservations = getReservations({
    roomId: room.id,
    statuses: BLOCKING_STATUSES,
    endAfter: now,
    startBefore: atHour(maxKey, 24),
    order: "start_asc",
  });
  const user = await getCurrentUser();

  const date = firstParam(query.date);
  const start = Number(firstParam(query.start));
  const duration = Number(firstParam(query.duration));

  return (
    <PageContainer className="max-w-[1100px]">
      <Breadcrumb className="mb-5">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/rooms" />}>ห้องเรียนทั้งหมด</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={`/rooms?building=${room.buildingId}`} />}>
              {room.building.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{room.code}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Booker
        room={{
          id: room.id,
          code: room.code,
          capacity: room.capacity,
          roomType: room.roomType,
          status: room.status,
          hasProjector: room.hasProjector,
          hasWhiteboard: room.hasWhiteboard,
          buildingName: room.building.name,
        }}
        reservations={reservations}
        signedIn={user !== null}
        todayKey={todayKey}
        maxKey={maxKey}
        initial={{
          dateKey: isDateKey(date) ? date : undefined,
          start: Number.isInteger(start) ? start : undefined,
          duration: Number.isInteger(duration) ? duration : undefined,
        }}
      />
    </PageContainer>
  );
}
