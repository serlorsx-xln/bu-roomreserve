// หน้า "ห้องเรียนทั้งหมด": รายชื่อห้องแยกตามอาคาร (แบบหน้า Event Types ของ Cal.com)
import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROOM_STATUS_LABEL, ROOM_TYPE_LABEL } from "@/lib/constants";
import { getBuildings, getRooms } from "@/lib/db";
import { bookRoomHref } from "@/lib/routes";
import type { SearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "ห้องเรียนทั้งหมด" };

export default async function RoomsPage({ searchParams }: { searchParams: SearchParams }) {
  const { building } = await searchParams;
  const buildingId = typeof building === "string" && /^\d+$/.test(building) ? Number(building) : undefined;

  // SQL: SELECT buildings + SELECT rooms (WHERE building_id = ? เมื่อเลือกอาคาร)
  const allBuildings = getBuildings();
  const buildings = allBuildings
    .filter((b) => buildingId === undefined || b.id === buildingId)
    .map((b) => ({ ...b, rooms: getRooms({ buildingId: b.id }) }));
  const roomCount = buildings.reduce((sum, b) => sum + b.rooms.length, 0);

  return (
    <PageContainer className="max-w-[1000px]">
      <PageHeader
        title="ห้องเรียนทั้งหมด"
        description={`${roomCount} ห้องใน ${buildings.length} อาคาร เลือกห้องเพื่อดูวันและเวลาที่ว่าง`}
        actions={
          buildingId ? (
            <Button variant="outline" render={<Link href="/rooms" />}>
              แสดงทุกอาคาร
            </Button>
          ) : null
        }
      />

      <div className="space-y-8">
        {buildings.map((b) => (
          <section key={b.id} aria-labelledby={`building-${b.id}`}>
            <div className="mb-3 flex items-baseline gap-2">
              <h2 id={`building-${b.id}`} className="text-base font-bold text-foreground">
                {b.name}
              </h2>
              <span className="text-sm text-muted-foreground">
                {b.numberOfFloors} ชั้น · {b.rooms.length} ห้อง
              </span>
            </div>

            <ul className="divide-y rounded-lg border bg-card">
              {b.rooms.map((room) => {
                const bookable = room.status === "AVAILABLE";
                return (
                  <li key={room.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={bookRoomHref(room.id)}
                          className="text-sm font-bold text-foreground tabular-nums hover:underline"
                        >
                          {room.code}
                        </Link>
                        {!bookable ? (
                          <Badge variant="secondary" className="rounded-md">
                            {ROOM_STATUS_LABEL[room.status]}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Badge variant="secondary" className="rounded-md font-normal text-body">
                          {room.capacity} ที่นั่ง
                        </Badge>
                        <Badge variant="secondary" className="rounded-md font-normal text-body">
                          {ROOM_TYPE_LABEL[room.roomType]}
                        </Badge>
                        {room.hasProjector ? (
                          <Badge variant="secondary" className="rounded-md font-normal text-body">
                            โปรเจกเตอร์
                          </Badge>
                        ) : null}
                        {room.hasWhiteboard ? (
                          <Badge variant="secondary" className="rounded-md font-normal text-body">
                            ไวท์บอร์ด
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      variant={bookable ? "outline" : "ghost"}
                      disabled={!bookable}
                      render={bookable ? <Link href={bookRoomHref(room.id)} /> : undefined}
                    >
                      {bookable ? "ดูเวลาว่าง" : "ไม่เปิดให้จอง"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
