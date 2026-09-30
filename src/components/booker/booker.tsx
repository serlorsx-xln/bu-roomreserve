"use client";

// หน้าจองห้อง 3 คอลัมน์ (แบบ Booker ของ Cal.com)
// ขั้นที่ 1: เลือกวันและเวลา → ขั้นที่ 2: กรอกวัตถุประสงค์และจำนวนคน → ส่งคำขอ
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { RoomStatus, RoomType } from "@/lib/types";
import { RoomCalendar } from "@/components/booker/room-calendar";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { buildStartOptions, hasAvailability, type BookedRange } from "@/lib/availability";
import {
  DURATION_OPTIONS,
  PURPOSE_PRESETS,
  ROOM_STATUS_LABEL,
  ROOM_TYPE_LABEL,
} from "@/lib/constants";
import {
  addDays,
  atHour,
  formatDateLong,
  formatDayMonth,
  formatHour,
  formatTimeRange,
  formatWeekday,
  fromDateKey,
  toDateKey,
} from "@/lib/format";
import { availabilityHref, reservationHref } from "@/lib/routes";

export type BookerRoom = {
  id: number;
  code: string;
  capacity: number;
  roomType: RoomType;
  status: RoomStatus;
  hasProjector: boolean;
  hasWhiteboard: boolean;
  buildingName: string;
};

type Props = {
  room: BookerRoom;
  reservations: BookedRange[];
  signedIn: boolean;
  todayKey: string;
  maxKey: string;
  initial: { dateKey?: string; start?: number; duration?: number };
};

export function Booker({ room, reservations, signedIn, todayKey, maxKey, initial }: Props) {
  const router = useRouter();

  // วันที่ทั้งหมดในช่วงที่จองได้ (วันนี้ → +14 วัน)
  const windowKeys = useMemo(() => {
    const keys: string[] = [];
    for (let d = fromDateKey(todayKey); toDateKey(d) <= maxKey; d = addDays(d, 1)) keys.push(toDateKey(d));
    return keys;
  }, [todayKey, maxKey]);

  const [duration, setDuration] = useState<number>(
    DURATION_OPTIONS.includes(initial.duration as never) ? initial.duration! : 1
  );
  const isBookable = (key: string, hours = duration) =>
    room.status === "AVAILABLE" && windowKeys.includes(key) && hasAvailability(key, reservations, hours);

  const [dateKey, setDateKey] = useState<string>(() => {
    if (initial.dateKey && isBookable(initial.dateKey)) return initial.dateKey;
    return windowKeys.find((key) => isBookable(key)) ?? todayKey;
  });
  const [month, setMonth] = useState<Date>(fromDateKey(dateKey));

  const options = buildStartOptions(dateKey, reservations, duration);
  const [start, setStart] = useState<number | null>(() => {
    const valid = options.some((o) => o.hour === initial.start && o.available);
    return valid ? initial.start! : null;
  });

  const selectedRange =
    start !== null ? formatTimeRange(atHour(dateKey, start), atHour(dateKey, start + duration)) : null;

  function changeDuration(next: number) {
    setDuration(next);
    // ถ้าเวลาเดิมใช้ไม่ได้กับระยะเวลาใหม่ ให้กลับไปเลือกเวลาใหม่
    if (start !== null) {
      const stillFree = buildStartOptions(dateKey, reservations, next).some((o) => o.hour === start && o.available);
      if (!stillFree) setStart(null);
    }
  }

  function changeDate(key: string) {
    setDateKey(key);
    setStart(null);
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="grid md:grid-cols-[17.5rem_minmax(0,1fr)] lg:grid-cols-[17.5rem_minmax(0,1fr)_16.5rem]">
        <RoomPanel
          room={room}
          duration={duration}
          onDurationChange={changeDuration}
          selected={start !== null ? { date: formatDateLong(fromDateKey(dateKey)), range: selectedRange! } : null}
        />

        {room.status !== "AVAILABLE" ? (
          <ClosedPanel status={room.status} />
        ) : start === null ? (
          <>
            <CalendarPanel
              dateKey={dateKey}
              month={month}
              onMonthChange={setMonth}
              onSelect={changeDate}
              isBookable={(key) => isBookable(key)}
              todayKey={todayKey}
              maxKey={maxKey}
            />
            <SlotPanel
              dateKey={dateKey}
              duration={duration}
              options={options}
              onPick={setStart}
            />
          </>
        ) : signedIn ? (
          <RequestForm
            room={room}
            dateKey={dateKey}
            start={start}
            duration={duration}
            onBack={() => setStart(null)}
            onConflict={() => {
              setStart(null);
              router.refresh();
            }}
          />
        ) : (
          <SignInPanel
            returnTo={`/rooms/${room.id}?date=${dateKey}&start=${start}&duration=${duration}`}
            onBack={() => setStart(null)}
          />
        )}
      </div>
    </div>
  );
}

// ─── คอลัมน์ซ้าย: ข้อมูลห้อง ───

function RoomPanel({
  room,
  duration,
  onDurationChange,
  selected,
}: {
  room: BookerRoom;
  duration: number;
  onDurationChange: (hours: number) => void;
  selected: { date: string; range: string } | null;
}) {
  const equipment = [room.hasProjector && "โปรเจกเตอร์", room.hasWhiteboard && "ไวท์บอร์ด"].filter(Boolean);

  return (
    <div className="border-b p-6 md:border-r md:border-b-0 lg:row-span-1">
      <h1 className="text-2xl font-bold text-foreground tabular-nums">{room.code}</h1>
      <p className="mt-0.5 text-sm text-body">
        {ROOM_TYPE_LABEL[room.roomType]} · {room.buildingName}
      </p>

      <dl className="mt-6 space-y-4 text-sm">
        <MetaRow label="การอนุมัติ">ต้องรอผู้ดูแลระบบอนุมัติ</MetaRow>
        <MetaRow label="ความจุ">{room.capacity} ที่นั่ง</MetaRow>
        <MetaRow label="อุปกรณ์">{equipment.length > 0 ? equipment.join(" · ") : "ไม่มีอุปกรณ์นำเสนอ"}</MetaRow>
        {room.status === "AVAILABLE" ? (
          <MetaRow label="ระยะเวลา">
            <ToggleGroup
              variant="outline"
              size="sm"
              spacing={1}
              aria-label="ระยะเวลาที่ต้องการใช้ห้อง"
              value={[String(duration)]}
              onValueChange={(value) => value[0] && onDurationChange(Number(value[0]))}
              className="mt-1 flex-wrap"
            >
              {DURATION_OPTIONS.map((hours) => (
                <ToggleGroupItem
                  key={hours}
                  value={String(hours)}
                  className="px-2.5 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                >
                  {hours} ชม.
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </MetaRow>
        ) : null}
        {selected ? (
          <MetaRow label="เวลาที่เลือก">
            <span className="block font-bold text-foreground">{selected.date}</span>
            <span className="block tabular-nums">{selected.range}</span>
          </MetaRow>
        ) : null}
      </dl>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-body">{children}</dd>
    </div>
  );
}

// ─── คอลัมน์กลาง: ปฏิทินเดือน ───

function CalendarPanel({
  dateKey,
  month,
  onMonthChange,
  onSelect,
  isBookable,
  todayKey,
  maxKey,
}: {
  dateKey: string;
  month: Date;
  onMonthChange: (month: Date) => void;
  onSelect: (key: string) => void;
  isBookable: (key: string) => boolean;
  todayKey: string;
  maxKey: string;
}) {
  return (
    <div className="p-5 md:p-6">
      <RoomCalendar
        selectedKey={dateKey}
        month={month}
        onMonthChange={onMonthChange}
        onSelect={onSelect}
        isBookable={isBookable}
        todayKey={todayKey}
        maxKey={maxKey}
      />
    </div>
  );
}

// ─── คอลัมน์ขวา: ช่วงเวลา ───

function SlotPanel({
  dateKey,
  duration,
  options,
  onPick,
}: {
  dateKey: string;
  duration: number;
  options: ReturnType<typeof buildStartOptions>;
  onPick: (hour: number) => void;
}) {
  const date = fromDateKey(dateKey);
  // ซ่อนเวลาที่ผ่านไปแล้ว/เกินเวลาเปิด แสดงเฉพาะที่ว่างและที่ถูกจองไปแล้ว
  const visible = options.filter((o) => o.available || o.reason === "มีการจองแล้ว");
  const freeCount = options.filter((o) => o.available).length;

  return (
    <div
      key={dateKey}
      className="flex min-h-0 flex-col border-t p-5 duration-200 animate-in fade-in-0 slide-in-from-left-1 md:col-start-2 lg:col-start-auto lg:border-t-0 lg:border-l"
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="text-sm">
          <span className="font-bold text-foreground">{formatWeekday(date)}</span>{" "}
          <span className="text-muted-foreground">{formatDayMonth(date)}</span>
        </p>
        <span className="text-xs text-muted-foreground">ว่าง {freeCount} ช่วง</span>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          วันที่เลือกไม่มีช่วงว่างสำหรับ {duration} ชั่วโมง ลองลดระยะเวลาหรือเลือกวันอื่น
        </p>
      ) : (
        <ul className="space-y-2 lg:-mr-2 lg:max-h-[26rem] lg:overflow-y-auto lg:pr-2">
          {visible.map((option) => {
            const label = `${formatHour(option.hour)} – ${formatHour(option.hour + duration)}`;
            return (
              <li key={option.hour}>
                {option.available ? (
                  <Button
                    variant="outline"
                    className="h-10 w-full text-sm text-foreground tabular-nums hover:border-foreground"
                    onClick={() => onPick(option.hour)}
                  >
                    {label}
                  </Button>
                ) : (
                  <div className="flex h-10 items-center justify-between rounded-lg border border-dashed px-3 text-sm text-muted-foreground">
                    <span className="tabular-nums">{label}</span>
                    <span className="text-xs">{option.reason}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── ขั้นที่ 2: ฟอร์มคำขอ ───

function RequestForm({
  room,
  dateKey,
  start,
  duration,
  onBack,
  onConflict,
}: {
  room: BookerRoom;
  dateKey: string;
  start: number;
  duration: number;
  onBack: () => void;
  onConflict: () => void;
}) {
  const router = useRouter();
  const [purpose, setPurpose] = useState("");
  const [attendees, setAttendees] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const attendeeCount = Number(attendees);
  const overCapacity = attendeeCount > room.capacity;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    let res: Response;
    try {
      res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          purpose,
          date: dateKey,
          startTime: formatHour(start),
          endTime: formatHour(start + duration),
          attendees: attendeeCount,
        }),
      });
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง");
      setSubmitting(false);
      return;
    }
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (res.status === 409) {
      toast.error(data.error ?? "ช่วงเวลานี้เพิ่งถูกจองไป กรุณาเลือกเวลาใหม่");
      onConflict();
      return;
    }
    if (!res.ok) {
      setError(data.error ?? "ส่งคำขอไม่สำเร็จ กรุณาลองอีกครั้ง");
      return;
    }
    toast.success("ส่งคำขอจองแล้ว");
    router.push(reservationHref(data.reservation.id, true));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col p-5 duration-200 animate-in fade-in-0 slide-in-from-right-2 md:p-6 lg:col-span-2"
      noValidate
    >
      <h2 className="text-base font-bold text-foreground">รายละเอียดคำขอ</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">ข้อมูลนี้ช่วยให้ผู้ดูแลระบบพิจารณาคำขอได้เร็วขึ้น</p>

      <FieldGroup className="mt-6 gap-6">
        <Field>
          <FieldLabel htmlFor="purpose">วัตถุประสงค์การใช้ห้อง</FieldLabel>
          <Input
            id="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="เช่น สอนชดเชยวิชา CS430"
            autoComplete="off"
            maxLength={200}
            required
          />
          <div className="flex flex-wrap gap-1.5">
            {PURPOSE_PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant="secondary"
                size="xs"
                onClick={() => {
                  setPurpose(preset + " ");
                  document.getElementById("purpose")?.focus();
                }}
              >
                {preset}
              </Button>
            ))}
          </div>
          <FieldDescription>อย่างน้อย 3 ตัวอักษร เช่น ชื่อวิชาหรือชื่อกิจกรรม</FieldDescription>
        </Field>

        <Field data-invalid={overCapacity || undefined}>
          <FieldLabel htmlFor="attendees">จำนวนผู้เข้าร่วม</FieldLabel>
          <Input
            id="attendees"
            type="number"
            inputMode="numeric"
            min={1}
            max={room.capacity}
            value={attendees}
            onChange={(e) => setAttendees(e.target.value)}
            placeholder={`1–${room.capacity}`}
            aria-invalid={overCapacity || undefined}
            className="w-40 tabular-nums"
            required
          />
          {overCapacity ? (
            <FieldError>เกินความจุของห้อง ห้องนี้รองรับได้สูงสุด {room.capacity} คน</FieldError>
          ) : (
            <FieldDescription>ห้องนี้รองรับได้สูงสุด {room.capacity} คน</FieldDescription>
          )}
        </Field>
      </FieldGroup>

      {error ? (
        <p role="alert" className="mt-5 rounded-lg bg-error px-3 py-2 text-sm text-error-foreground">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">คำขอจะมีสถานะ “รออนุมัติ” จนกว่าผู้ดูแลระบบจะตรวจสอบ</p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onBack}>
            ย้อนกลับ
          </Button>
          <Button type="submit" disabled={submitting || purpose.trim().length < 3 || !attendeeCount || overCapacity}>
            {submitting ? <Spinner /> : null}
            ส่งคำขอจอง
          </Button>
        </div>
      </div>
    </form>
  );
}

// ─── กรณีพิเศษ ───

function SignInPanel({ returnTo, onBack }: { returnTo: string; onBack: () => void }) {
  const next = encodeURIComponent(returnTo);
  return (
    <div className="flex flex-col justify-center p-6 md:p-10 lg:col-span-2">
      <h2 className="text-base font-bold text-foreground">เข้าสู่ระบบเพื่อส่งคำขอจอง</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        เราจะจำห้องและเวลาที่คุณเลือกไว้ให้ เมื่อเข้าสู่ระบบแล้วจะกลับมาที่ขั้นตอนนี้ทันที
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button render={<Link href={`/login?next=${next}`} />}>เข้าสู่ระบบ</Button>
        <Button variant="outline" render={<Link href={`/register?next=${next}`} />}>
          สมัครใช้งาน
        </Button>
        <Button variant="ghost" onClick={onBack}>
          ย้อนกลับ
        </Button>
      </div>
    </div>
  );
}

function ClosedPanel({ status }: { status: RoomStatus }) {
  return (
    <div className="flex flex-col justify-center p-6 md:p-10 lg:col-span-2">
      <h2 className="text-base font-bold text-foreground">{ROOM_STATUS_LABEL[status]}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        ห้องนี้ไม่เปิดให้จองในขณะนี้ ลองเลือกห้องอื่นที่มีขนาดใกล้เคียงกันจากหน้าห้องว่าง
      </p>
      <div className="mt-5">
        <Button variant="outline" render={<Link href={availabilityHref()} />}>
          ดูห้องว่าง
        </Button>
      </div>
    </div>
  );
}
