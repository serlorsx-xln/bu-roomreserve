"use client";

// ตัวอย่างหน้าจองบนหน้าแรก (แบบวิดเจ็ตในหน้าแรกของ Cal.com)
// ใช้ข้อมูลจริงของห้องหนึ่งห้อง: เลือกระยะเวลาแล้ววันที่จองได้จะเปลี่ยนตาม
// กดวันที่แล้วไปหน้าจองจริงของห้องนั้นพร้อมวันที่และระยะเวลาที่เลือก
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RoomType } from "@/lib/types";
import { RoomCalendar } from "@/components/booker/room-calendar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { hasAvailability, type BookedRange } from "@/lib/availability";
import { CLOSE_HOUR, DURATION_OPTIONS, OPEN_HOUR, ROOM_TYPE_LABEL } from "@/lib/constants";
import { addDays, formatHour, fromDateKey, toDateKey } from "@/lib/format";
import { bookRoomHref } from "@/lib/routes";

export type HeroRoom = {
  code: string;
  capacity: number;
  roomType: RoomType;
  hasProjector: boolean;
  hasWhiteboard: boolean;
  buildingName: string;
};

type Props = {
  room: HeroRoom;
  reservations: BookedRange[];
  todayKey: string;
  maxKey: string;
};

export function HeroBooker({ room, reservations, todayKey, maxKey }: Props) {
  const router = useRouter();
  const [duration, setDuration] = useState(1);

  // วันที่ทั้งหมดในช่วงที่จองได้ (วันนี้ → +14 วัน)
  const windowKeys: string[] = [];
  for (let d = fromDateKey(todayKey); toDateKey(d) <= maxKey; d = addDays(d, 1)) windowKeys.push(toDateKey(d));

  // เปิดที่เดือนที่มีวันในช่วงจองมากที่สุด (เช่น ปลายเดือนจะเปิดเดือนถัดไปเลย)
  const [month, setMonth] = useState(() => {
    const count = (monthKey: string) => windowKeys.filter((key) => key.startsWith(monthKey)).length;
    const busiest = [todayKey.slice(0, 7), maxKey.slice(0, 7)].reduce((a, b) => (count(b) > count(a) ? b : a));
    return fromDateKey(`${busiest}-01`);
  });

  const isBookable = (key: string) =>
    key >= todayKey && key <= maxKey && hasAvailability(key, reservations, duration);

  // วันที่ไฮไลต์: วันแรกที่ยังจองได้ในเดือนที่แสดงอยู่
  const monthKey = toDateKey(month).slice(0, 7);
  const selectedKey =
    windowKeys.find((key) => key.startsWith(monthKey) && isBookable(key)) ??
    windowKeys.find((key) => isBookable(key)) ??
    todayKey;

  const equipment = [room.hasProjector && "โปรเจกเตอร์", room.hasWhiteboard && "ไวท์บอร์ด"].filter(Boolean);

  return (
    <div className="grid overflow-hidden rounded-lg border bg-background md:w-[44rem] md:grid-cols-[15.5rem_minmax(0,1fr)]">
      <div className="border-b p-6 md:border-r md:border-b-0">
        <p className="text-sm text-muted-foreground">{room.buildingName}</p>
        <p className="mt-1 text-xl font-bold text-foreground tabular-nums">{room.code}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {ROOM_TYPE_LABEL[room.roomType]} {room.capacity} ที่นั่ง
          {equipment.map((name, i) => (
            <span key={String(name)} className="whitespace-nowrap">
              {i === 0 ? " มี" : "และ"}
              {name}
            </span>
          ))}
        </p>

        <ToggleGroup
          aria-label="ระยะเวลาที่ต้องการใช้ห้อง"
          value={[String(duration)]}
          onValueChange={(value) => value[0] && setDuration(Number(value[0]))}
          className="mt-5 w-fit gap-0.5 rounded-lg bg-muted p-1"
        >
          {DURATION_OPTIONS.map((hours) => (
            <ToggleGroupItem
              key={hours}
              value={String(hours)}
              size="sm"
              className="h-7 rounded-md px-2.5 text-muted-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-(--shadow-elevation-low)"
            >
              {hours} ชม.
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">เวลาเปิดจอง</dt>
            <dd className="mt-0.5 text-body tabular-nums">
              {formatHour(OPEN_HOUR)}–{formatHour(CLOSE_HOUR)} น.
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">การอนุมัติ</dt>
            <dd className="mt-0.5 text-body">ผู้ดูแลระบบอนุมัติทุกคำขอ</dd>
          </div>
        </dl>
      </div>

      <div className="p-5 md:p-6">
        {/* จอใหญ่: วิดเจ็ตล้นขอบการ์ด จึงซ่อนปุ่มเปลี่ยนเดือนที่อยู่ริมขวา (แบบ Cal.com) */}
        <RoomCalendar
          className="lg:[&_nav]:hidden"
          selectedKey={selectedKey}
          month={month}
          onMonthChange={setMonth}
          onSelect={(key) => router.push(bookRoomHref(room.code, key, undefined, duration))}
          isBookable={isBookable}
          todayKey={todayKey}
          maxKey={maxKey}
        />
      </div>
    </div>
  );
}
