// ตารางห้อง × ชั่วโมงของหนึ่งวัน (Server Component)
// เดสก์ท็อป: ตารางเต็ม ห้องเป็นแถว ชั่วโมงเป็นคอลัมน์ | มือถือ: รายการห้องพร้อมแถบชั่วโมงย่อ
import Link from "next/link";
import type { RoomStatus, RoomType } from "@/lib/types";
import { NowLine } from "@/components/availability/now-line";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { RowSegment, SlotReservation } from "@/lib/availability";
import {
  isRoomBookable,
  RESERVATION_STATUS_LABEL,
  ROOM_STATUS_LABEL,
  ROOM_TYPE_LABEL,
  START_HOURS,
} from "@/lib/constants";
import { atHour, formatDateLong, formatHour } from "@/lib/format";
import { bookRoomHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type BoardRoom = {
  code: string;
  capacity: number;
  roomType: RoomType;
  status: RoomStatus;
  segments: RowSegment[];
};

export type BoardBuilding = { id: number; name: string; rooms: BoardRoom[] };

type Viewer = { userId: string | null; now: Date };

// คอลัมน์แรก (ชื่อห้อง) กว้างคงที่ ที่เหลือแบ่งเท่า ๆ กัน 12 ชั่วโมง
const GRID_STYLE = {
  gridTemplateColumns: `var(--room-col) repeat(${START_HOURS.length}, minmax(0, 1fr))`,
};

export function AvailabilityBoard({
  buildings,
  dateKey,
  viewer,
}: {
  buildings: BoardBuilding[];
  dateKey: string;
  viewer: Viewer;
}) {
  return (
    <>
      <DesktopBoard buildings={buildings} dateKey={dateKey} viewer={viewer} />
      <MobileBoard buildings={buildings} dateKey={dateKey} viewer={viewer} />
    </>
  );
}

// ─── เดสก์ท็อป ───

function DesktopBoard({ buildings, dateKey, viewer }: { buildings: BoardBuilding[]; dateKey: string; viewer: Viewer }) {
  return (
    <div
      className="hidden overflow-x-auto rounded-lg border bg-card md:block"
      style={{ "--room-col": "11.5rem" } as React.CSSProperties}
    >
      <div className="relative min-w-[58rem]">
        {/* หัวตาราง: ชั่วโมง (สูง h-10 — NowLine เริ่มวาดเส้นต่อจากความสูงนี้) */}
        <div className="grid h-10 border-b" style={GRID_STYLE}>
          <div className="sticky left-0 z-20 flex items-center bg-card px-4 text-xs text-muted-foreground">ห้อง</div>
          {START_HOURS.map((hour) => (
            <div key={hour} className="flex items-center border-l px-2 text-xs text-muted-foreground tabular-nums">
              {formatHour(hour)}
            </div>
          ))}
        </div>

        <div>
          {buildings.map((building) => (
            <section key={building.id} aria-label={building.name}>
              <div className="border-b bg-canvas px-4 py-2">
                <div className="sticky left-4 inline-flex items-baseline gap-2 text-sm">
                  <h2 className="font-bold text-foreground">{building.name}</h2>
                  <span className="text-xs text-muted-foreground">{building.rooms.length} ห้อง</span>
                </div>
              </div>
              {building.rooms.map((room) => (
                <div key={room.code} className="grid border-b last:border-b-0" style={GRID_STYLE}>
                  <RoomCell room={room} dateKey={dateKey} />
                  {!isRoomBookable(room.status) ? (
                    <ClosedRow status={room.status} />
                  ) : (
                    room.segments.map((segment) => (
                      <SegmentCell
                        key={segmentKey(segment)}
                        segment={segment}
                        room={room}
                        dateKey={dateKey}
                        viewer={viewer}
                      />
                    ))
                  )}
                </div>
              ))}
            </section>
          ))}
        </div>
        <NowLine dateKey={dateKey} />
      </div>
    </div>
  );
}

function RoomCell({ room, dateKey }: { room: BoardRoom; dateKey: string }) {
  return (
    <Link
      href={bookRoomHref(room.code, dateKey)}
      className="group sticky left-0 z-10 flex flex-col justify-center bg-card px-4 py-2 outline-none hover:bg-canvas focus-visible:bg-canvas focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
    >
      <span className="text-sm font-bold text-foreground tabular-nums group-hover:underline">{room.code}</span>
      <span className="text-xs text-muted-foreground">
        {room.capacity} ที่นั่ง · {ROOM_TYPE_LABEL[room.roomType]}
      </span>
    </Link>
  );
}

function ClosedRow({ status }: { status: RoomStatus }) {
  return (
    <div
      className="flex h-14 items-center border-l bg-canvas px-3 text-xs text-muted-foreground"
      style={{ gridColumn: `span ${START_HOURS.length}` }}
    >
      {ROOM_STATUS_LABEL[status]} · ไม่เปิดให้จองในขณะนี้
    </div>
  );
}

function SegmentCell({
  segment,
  room,
  dateKey,
  viewer,
}: {
  segment: RowSegment;
  room: BoardRoom;
  dateKey: string;
  viewer: Viewer;
}) {
  if (segment.kind === "past") {
    return <div className="h-14 border-l bg-canvas" title="ผ่านไปแล้ว" />;
  }

  if (segment.kind === "free") {
    return (
      <Link
        href={bookRoomHref(room.code, dateKey, segment.hour)}
        aria-label={`จองห้อง ${room.code} ${formatDateLong(atHour(dateKey, segment.hour))} เวลา ${formatHour(segment.hour)} น.`}
        className="flex h-14 items-center justify-center border-l text-xs text-transparent tabular-nums outline-none transition-colors duration-100 hover:bg-canvas hover:text-muted-foreground focus-visible:bg-canvas focus-visible:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        {formatHour(segment.hour)}
      </Link>
    );
  }

  const span = segment.endHour - segment.startHour;
  return (
    <div className="h-14 border-l p-1" style={{ gridColumn: `span ${span}` }}>
      <ReservationBlock segment={segment} dateKey={dateKey} viewer={viewer} />
    </div>
  );
}

function ReservationBlock({
  segment,
  dateKey,
  viewer,
}: {
  segment: Extract<RowSegment, { kind: "reservation" }>;
  dateKey: string;
  viewer: Viewer;
}) {
  const { reservation } = segment;
  const tone = reservationTone(reservation, viewer.userId);
  const isOver = reservation.endAt <= viewer.now;
  const time = `${formatHour(segment.startHour)}–${formatHour(segment.endHour)}`;
  // ผู้ที่ยังไม่เข้าสู่ระบบจะไม่เห็นวัตถุประสงค์ของการจอง
  const title = viewer.userId ? reservation.purpose : "มีการจอง";
  const statusText = tone === "mine" ? `การจองของคุณ · ${RESERVATION_STATUS_LABEL[reservation.status]}` : RESERVATION_STATUS_LABEL[reservation.status];

  return (
    <Tooltip>
      {/* ปุ่มจริง (กด Tab มาถึงได้) เพื่อให้คนที่ใช้คีย์บอร์ดเปิดรายละเอียดได้เหมือนเอาเมาส์ชี้ */}
      <TooltipTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex h-full w-full flex-col justify-center overflow-hidden rounded-md px-2 text-left text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring",
              TONE_STYLE[tone],
              isOver && "opacity-55"
            )}
          />
        }
      >
        <span className="truncate font-bold">{title}</span>
        <span className="truncate opacity-80 tabular-nums">
          {time} · {statusText}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64">
        <p className="font-bold">{title}</p>
        <p className="tabular-nums opacity-80">
          {formatDateLong(atHour(dateKey, 0))} · {time} น.
        </p>
        <p className="opacity-80">{statusText}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ─── มือถือ ───

function MobileBoard({ buildings, dateKey, viewer }: { buildings: BoardBuilding[]; dateKey: string; viewer: Viewer }) {
  return (
    <div className="space-y-6 md:hidden">
      {buildings.map((building) => (
        <section key={building.id} aria-label={building.name}>
          <h2 className="mb-2 text-sm font-bold text-foreground">{building.name}</h2>
          <div className="divide-y rounded-lg border bg-card">
            {building.rooms.map((room) => (
              <MobileRoomRow key={room.code} room={room} dateKey={dateKey} viewer={viewer} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MobileRoomRow({ room, dateKey, viewer }: { room: BoardRoom; dateKey: string; viewer: Viewer }) {
  const hours = expandToHours(room.segments);
  const freeCount = hours.filter((h) => h.kind === "free").length;
  const closed = !isRoomBookable(room.status);

  return (
    <div className="px-4 py-3">
      <div className="flex items-baseline justify-between gap-3">
        <Link href={bookRoomHref(room.code, dateKey)} className="text-sm font-bold text-foreground tabular-nums">
          {room.code}
        </Link>
        <span className="text-xs text-muted-foreground">
          {closed ? ROOM_STATUS_LABEL[room.status] : `${room.capacity} ที่นั่ง · ว่าง ${freeCount} ชม.`}
        </span>
      </div>

      <div role="group" className="mt-2.5 grid grid-cols-6 gap-1" aria-label={`ช่วงเวลาของห้อง ${room.code}`}>
        {hours.map((cell) => {
          if (!closed && cell.kind === "free") {
            return (
              <Link
                key={cell.hour}
                href={bookRoomHref(room.code, dateKey, cell.hour)}
                aria-label={`จองห้อง ${room.code} เวลา ${formatHour(cell.hour)} น.`}
                className="flex h-10 items-center justify-center rounded-md bg-background text-xs text-body tabular-nums ring-1 ring-input ring-inset active:bg-emphasis"
              >
                {formatHour(cell.hour)}
              </Link>
            );
          }
          const tone =
            !closed && cell.kind === "reservation" ? TONE_STYLE[reservationTone(cell.reservation, viewer.userId)] : "bg-canvas";
          return (
            <div
              key={cell.hour}
              className={cn(
                "flex h-10 items-center justify-center rounded-md text-xs tabular-nums",
                tone === "bg-canvas" ? "bg-canvas text-faint ring-1 ring-border ring-inset" : tone
              )}
            >
              {formatHour(cell.hour)}
              {/* สีบอกสถานะได้เฉพาะคนที่มองเห็น — บอกเป็นข้อความให้โปรแกรมอ่านหน้าจอด้วย */}
              <span className="sr-only"> {mobileCellStatus(cell, closed, viewer.userId)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ส่วนช่วย ───

/** ข้อความสถานะของช่องชั่วโมงบนมือถือ (สำหรับโปรแกรมอ่านหน้าจอ) */
function mobileCellStatus(cell: HourCell, closed: boolean, userId: string | null): string {
  if (closed) return "ปิด ไม่เปิดให้จอง";
  if (cell.kind === "past") return "ผ่านไปแล้ว";
  if (cell.kind === "reservation") {
    const status = RESERVATION_STATUS_LABEL[cell.reservation.status];
    return reservationTone(cell.reservation, userId) === "mine" ? `การจองของคุณ ${status}` : `มีการจอง ${status}`;
  }
  return "ว่าง";
}

type Tone = "mine" | "pending" | "approved";

const TONE_STYLE: Record<Tone, string> = {
  mine: "bg-primary text-primary-foreground",
  pending: "bg-pending-stripes text-attention-foreground ring-1 ring-attention-border ring-inset",
  approved: "bg-emphasis text-body",
};

function reservationTone(reservation: SlotReservation, userId: string | null): Tone {
  if (userId !== null && reservation.reservedById === userId) return "mine";
  return reservation.status === "PENDING" ? "pending" : "approved";
}

function segmentKey(segment: RowSegment): string {
  return segment.kind === "reservation" ? `r${segment.reservation.id}` : `${segment.kind}${segment.hour}`;
}

type HourCell =
  | { kind: "free" | "past"; hour: number }
  | { kind: "reservation"; hour: number; reservation: SlotReservation };

/** แตกช่วงการจองที่กินหลายชั่วโมงออกเป็นทีละชั่วโมง (ใช้ในแถบย่อบนมือถือ) */
function expandToHours(segments: RowSegment[]): HourCell[] {
  return segments.flatMap((segment): HourCell[] =>
    segment.kind === "reservation"
      ? Array.from({ length: segment.endHour - segment.startHour }, (_, i) => ({
          kind: "reservation" as const,
          hour: segment.startHour + i,
          reservation: segment.reservation,
        }))
      : [{ kind: segment.kind, hour: segment.hour }]
  );
}

// ─── คำอธิบายสัญลักษณ์ ───

export function BoardLegend({ showMine }: { showMine: boolean }) {
  const items: { swatch: string; label: string }[] = [
    { swatch: "bg-background ring-1 ring-input ring-inset", label: "ว่าง — คลิกเพื่อจอง" },
    { swatch: TONE_STYLE.approved, label: "อนุมัติแล้ว" },
    { swatch: TONE_STYLE.pending, label: "รออนุมัติ" },
    ...(showMine ? [{ swatch: TONE_STYLE.mine, label: "การจองของคุณ" }] : []),
    { swatch: "bg-canvas ring-1 ring-border ring-inset", label: "ผ่านไปแล้ว / ปิดใช้งาน" },
  ];
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span aria-hidden className={cn("size-3.5 rounded-[3px]", item.swatch)} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
