// ภาพประกอบในการ์ดของหน้าแรก วาดจากคอมโพเนนต์จริงของระบบ (ปุ่ม ป้ายสถานะ แท็บ ตัวเลือก)
// เพื่อให้หน้าตาตรงกับของจริงทุกจุด ทั้งหมดเป็นภาพนิ่ง: inert = กดไม่ได้และโปรแกรมอ่านหน้าจอข้ามไป
import { ReservationStatusBadge } from "@/components/reservation-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CLOSE_HOUR, MAX_ADVANCE_DAYS, OPEN_HOUR } from "@/lib/constants";
import { addDays, formatDateShort, formatHour, formatWeekday, fromDateKey } from "@/lib/format";
import { cn } from "@/lib/utils";

/** กรอบของภาพประกอบ: หน้าต่างสีขาววางใต้ข้อความของการ์ด แล้วล้นขอบการ์ดด้านล่าง/ขวา (แบบ Cal.com) */
function Window({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div inert className={cn("absolute rounded-lg border bg-background select-none", className)}>
      {children}
    </div>
  );
}

// ─── ขั้นที่ 1: ตารางห้องว่าง ───

const BOARD_HOURS = [9, 10, 11, 12, 13];

// แต่ละช่องในแถว: เริ่มชั่วโมงไหน กินกี่ชั่วโมง และเป็นการจองแบบไหน (ไม่ระบุ = ว่าง)
type BoardCell = { start: number; span: number; tone?: "approved" | "pending"; label?: string; focus?: boolean };

const BOARD_ROWS: { code: string; cells: BoardCell[] }[] = [
  {
    code: "IF-3M101",
    cells: [
      { start: 9, span: 2, tone: "approved", label: "สอนชดเชย" },
      { start: 11, span: 1 },
      { start: 12, span: 1 },
      { start: 13, span: 1 },
    ],
  },
  {
    code: "IF-3M102",
    cells: [
      { start: 9, span: 1 },
      { start: 10, span: 1, focus: true },
      { start: 11, span: 1 },
      { start: 12, span: 2, tone: "pending", label: "ประชุม" },
    ],
  },
  {
    code: "IF-4M210",
    cells: [
      { start: 9, span: 1 },
      { start: 10, span: 1 },
      { start: 11, span: 3, tone: "approved", label: "สอบ" },
    ],
  },
  {
    code: "IF-5T201",
    cells: [
      { start: 9, span: 1 },
      { start: 10, span: 2, tone: "approved", label: "ติวหนังสือ" },
      { start: 12, span: 1 },
      { start: 13, span: 1 },
    ],
  },
];

export function BoardIllustration({ todayKey }: { todayKey: string }) {
  return (
    <Window className="top-2 -right-24 left-6 text-xs">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <span className="font-bold text-foreground">{formatDateShort(fromDateKey(todayKey))}</span>
        <span className="text-muted-foreground">ทุกอาคาร</span>
      </div>
      <div className="grid grid-cols-[5.5rem_repeat(5,minmax(0,1fr))]">
        <div className="border-b px-3 py-2 text-muted-foreground">ห้อง</div>
        {BOARD_HOURS.map((hour) => (
          <div key={hour} className="border-b border-l px-2 py-2 text-muted-foreground tabular-nums">
            {formatHour(hour)}
          </div>
        ))}
        {BOARD_ROWS.map((row) => [
          <div key={row.code} className="border-b px-3 py-3 font-bold text-foreground tabular-nums">
            {row.code}
          </div>,
          ...row.cells.map((cell) => (
            <div
              key={`${row.code}-${cell.start}`}
              style={{ gridColumn: `span ${cell.span}` }}
              className="border-b border-l p-1"
            >
              {cell.tone ? (
                <div
                  className={cn(
                    "h-full truncate rounded-md px-2 py-1.5",
                    cell.tone === "approved"
                      ? "bg-emphasis text-body"
                      : "bg-pending-stripes text-attention-foreground ring-1 ring-attention-foreground/20 ring-inset"
                  )}
                >
                  {cell.label}
                </div>
              ) : cell.focus ? (
                <div className="flex h-full items-center justify-center rounded-md bg-background text-foreground tabular-nums ring-2 ring-foreground">
                  {formatHour(cell.start)}
                </div>
              ) : null}
            </div>
          )),
        ])}
      </div>
    </Window>
  );
}

// ─── ขั้นที่ 2: เลือกเวลาเริ่มและกรอกวัตถุประสงค์ ───

export function SlotsIllustration({ todayKey }: { todayKey: string }) {
  const tomorrow = addDays(fromDateKey(todayKey), 1);
  return (
    <Window className="top-2 right-6 left-6 p-4 md:-right-10">
      <p className="text-sm">
        <span className="font-bold text-foreground">{formatWeekday(tomorrow)}</span>{" "}
        <span className="text-muted-foreground">{formatDateShort(tomorrow).split(" ").slice(1).join(" ")}</span>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" className="font-normal tabular-nums">09:00</Button>
        <Button className="font-normal tabular-nums">10:00</Button>
        <div className="col-span-2 flex h-9 items-center justify-between rounded-md border border-dashed px-3 text-sm text-muted-foreground">
          <span className="tabular-nums">11:00</span>
          <span className="text-xs">มีการจองแล้ว</span>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">วัตถุประสงค์การใช้ห้อง</p>
      <Input className="mt-1.5" defaultValue="ติวหนังสือก่อนสอบกลางภาค" />
    </Window>
  );
}

// ─── ขั้นที่ 3: สถานะเปลี่ยนเป็นอนุมัติแล้ว ───

export function StatusIllustration({ todayKey }: { todayKey: string }) {
  const day = formatDateShort(addDays(fromDateKey(todayKey), 1));
  return (
    <div inert className="absolute inset-x-6 top-14 select-none">
      <RequestRow
        className="absolute inset-x-5 -top-10 opacity-60"
        day={day}
        status="PENDING"
        meta="ส่งคำขอแล้ว"
      />
      <RequestRow className="relative shadow-(--shadow-card)" day={day} status="APPROVED" meta="อนุมัติโดยผู้ดูแลระบบ" />
    </div>
  );
}

function RequestRow({
  day,
  status,
  meta,
  className,
}: {
  day: string;
  status: "PENDING" | "APPROVED";
  meta: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-background p-4 text-sm", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-foreground">ติวหนังสือ</span>
        <ReservationStatusBadge status={status} />
      </div>
      <p className="mt-1 text-muted-foreground tabular-nums">IF-4M210 · {day} 13:00–15:00 น.</p>
      <p className="mt-2 border-t pt-2 text-xs text-muted-foreground">{meta}</p>
    </div>
  );
}

// ─── จุดเด่น: ไม่มีการจองซ้อน ───

const SLOT_ROWS: { hour: number; state: "free" | "booked" | "pending" }[] = [
  { hour: 8, state: "free" },
  { hour: 9, state: "booked" },
  { hour: 10, state: "booked" },
  { hour: 11, state: "free" },
  { hour: 12, state: "free" },
  { hour: 13, state: "pending" },
  { hour: 14, state: "pending" },
  { hour: 15, state: "free" },
  { hour: 16, state: "free" },
  { hour: 17, state: "booked" },
  { hour: 18, state: "free" },
  { hour: 19, state: "free" },
];

export function ConflictIllustration() {
  return (
    <Window className="top-2 right-6 left-6 p-4 md:right-auto md:w-[26rem]">
      <div className="grid grid-cols-2 gap-2 text-sm">
        {SLOT_ROWS.map(({ hour, state }) =>
          state === "free" ? (
            <Button key={hour} variant="outline" className="font-normal tabular-nums">
              {formatHour(hour)}
            </Button>
          ) : (
            <div
              key={hour}
              className={cn(
                "flex h-9 items-center justify-between gap-2 rounded-md px-3",
                state === "booked"
                  ? "border border-dashed text-muted-foreground"
                  : "bg-pending-stripes text-attention-foreground ring-1 ring-attention-foreground/20 ring-inset"
              )}
            >
              <span className="tabular-nums">{formatHour(hour)}</span>
              {/* จอแคบใช้คำสั้น เพื่อไม่ให้ข้อความขึ้นบรรทัดใหม่ไปชนเวลา */}
              <span className="text-xs whitespace-nowrap">
                {state === "booked" ? (
                  <>
                    <span className="md:hidden">จองแล้ว</span>
                    <span className="hidden md:inline">มีการจองแล้ว</span>
                  </>
                ) : (
                  "รออนุมัติ"
                )}
              </span>
            </div>
          )
        )}
      </div>
    </Window>
  );
}

// ─── จุดเด่น: กฎการจอง (หน้าตาแบบหน้าตั้งค่า) ───

const RULES = [
  { label: "เวลาเปิดจอง", value: `${formatHour(OPEN_HOUR)} – ${formatHour(CLOSE_HOUR)} น.`, wide: true },
  { label: "ระยะเวลาต่อครั้ง", value: "1 – 4 ชั่วโมง" },
  { label: "จองล่วงหน้าได้", value: `ไม่เกิน ${MAX_ADVANCE_DAYS} วัน` },
  { label: "จำนวนผู้เข้าร่วม", value: "ไม่เกินความจุของห้อง", wide: true },
];

export function RulesIllustration() {
  return (
    <Window className="top-2 right-6 left-6 p-5">
      <p className="text-base font-bold text-foreground">กฎการจอง</p>
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3.5">
        {RULES.map((rule) => (
          <div key={rule.label} className={rule.wide ? "col-span-2" : undefined}>
            <p className="mb-1.5 text-sm text-foreground">{rule.label}</p>
            <Select items={[{ value: rule.label, label: rule.value }]} defaultValue={rule.label}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
            </Select>
          </div>
        ))}
      </div>
    </Window>
  );
}

// ─── จุดเด่น: การจองของฉัน ───

export function MyReservationsIllustration({ todayKey }: { todayKey: string }) {
  const rows = [
    { day: formatDateShort(addDays(fromDateKey(todayKey), 1)), time: "10:00–12:00", purpose: "ประชุม", status: "PENDING" as const },
    { day: formatDateShort(addDays(fromDateKey(todayKey), 3)), time: "13:00–16:00", purpose: "สอนชดเชย", status: "APPROVED" as const },
    { day: formatDateShort(addDays(fromDateKey(todayKey), 6)), time: "09:00–11:00", purpose: "สอบ", status: "APPROVED" as const },
  ];
  return (
    <Window className="top-2 -right-10 left-6">
      <div className="p-3">
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">กำลังจะถึง</TabsTrigger>
            <TabsTrigger value="pending">รออนุมัติ</TabsTrigger>
            <TabsTrigger value="past">ที่ผ่านมา</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {rows.map((row) => (
        <div key={row.day} className="grid grid-cols-[7rem_1fr] gap-3 border-t px-4 py-3 text-sm">
          <div>
            <p className="font-bold text-foreground">{row.day}</p>
            <p className="text-muted-foreground tabular-nums">{row.time} น.</p>
          </div>
          <div>
            <p className="flex items-center gap-2 font-bold text-foreground">
              {row.purpose} <ReservationStatusBadge status={row.status} />
            </p>
            <p className="text-muted-foreground">LC-2-301 · อาคารบรรยายรวม 1</p>
          </div>
        </div>
      ))}
    </Window>
  );
}

// ─── จุดเด่น: ผู้ดูแลระบบอนุมัติ (การ์ดซ้อนกันแบบกล่องแจ้งเตือน) ───

export function ApprovalIllustration({ todayKey }: { todayKey: string }) {
  const day = formatDateShort(addDays(fromDateKey(todayKey), 2));
  return (
    <div inert className="absolute inset-x-6 top-10 select-none md:inset-x-10">
      <div className="absolute inset-x-8 -top-6 h-12 rounded-lg border bg-background opacity-40" />
      <div className="absolute inset-x-4 -top-3 h-12 rounded-lg border bg-background opacity-70" />
      <div className="relative rounded-lg border bg-background p-4 text-sm shadow-(--shadow-card)">
        <div className="flex items-center justify-between gap-2">
          <span className="font-bold text-foreground">ประชุมกลุ่มโปรเจกต์</span>
          <ReservationStatusBadge status="PENDING" />
        </div>
        <p className="mt-1 text-muted-foreground tabular-nums">LC-2-301 · {day} 10:00–12:00 น. · 12/20 คน</p>
        <p className="mt-0.5 text-xs text-muted-foreground">นักศึกษา · ส่งคำขอ 5 นาทีที่แล้ว</p>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="sm">
            ปฏิเสธ
          </Button>
          <Button size="sm">อนุมัติ</Button>
        </div>
      </div>
    </div>
  );
}
