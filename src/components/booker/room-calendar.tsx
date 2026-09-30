"use client";

// ปฏิทินเลือกวันของห้องหนึ่งห้อง (แบบ Cal.com): วันที่จองได้เป็นช่องสีเทา วันที่เลือกเป็นสีดำ
// ใช้ทั้งในหน้าจองห้อง (Booker) และตัวอย่างบนหน้าแรก
import type { ComponentProps } from "react";
import { th } from "react-day-picker/locale";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { formatDateLong, formatMonthShort, formatMonthYear, fromDateKey, toDateKey } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  /** วันที่เลือกอยู่ ("YYYY-MM-DD") */
  selectedKey: string;
  /** เดือนที่แสดง */
  month: Date;
  onMonthChange: (month: Date) => void;
  onSelect: (dateKey: string) => void;
  /** วันนี้จองได้ไหม (ยังมีช่วงว่างพอสำหรับระยะเวลาที่เลือก) */
  isBookable: (dateKey: string) => boolean;
  todayKey: string;
  maxKey: string;
  className?: string;
};

export function RoomCalendar({
  selectedKey,
  month,
  onMonthChange,
  onSelect,
  isBookable,
  todayKey,
  maxKey,
  className,
}: Props) {
  return (
    <Calendar
      mode="single"
      locale={th}
      required
      selected={fromDateKey(selectedKey)}
      onSelect={(date) => date && onSelect(toDateKey(date))}
      month={month}
      onMonthChange={onMonthChange}
      startMonth={fromDateKey(todayKey)}
      endMonth={fromDateKey(maxKey)}
      showOutsideDays={false}
      disabled={(date) => !isBookable(toDateKey(date))}
      modifiers={{ bookable: (date) => isBookable(toDateKey(date)) }}
      modifiersClassNames={{
        bookable:
          "[&>button]:bg-emphasis [&>button]:text-foreground [&>button]:hover:bg-emphasis [&>button]:hover:ring-1 [&>button]:hover:ring-foreground/60",
      }}
      formatters={{
        formatCaption: (date) => {
          const { month: name, year } = formatMonthYear(date);
          return `${name} ${year}`;
        },
      }}
      className={cn("w-full p-0 [--cell-radius:var(--radius-lg)]", className)}
      classNames={{
        month: "flex w-full flex-col gap-3",
        month_caption: "flex h-9 items-center justify-start",
        caption_label: "text-base",
        nav: "absolute top-0 right-0 flex items-center gap-1",
        weekdays: "flex gap-1",
        weekday: "flex-1 pb-1 text-xs text-body select-none",
        week: "mt-1 flex w-full gap-1",
        day: "group/day relative aspect-square w-full p-0 text-center select-none",
        disabled: "text-muted-foreground",
        today:
          "[&>button]:after:absolute [&>button]:after:bottom-1.5 [&>button]:after:left-1/2 [&>button]:after:size-1 [&>button]:after:-translate-x-1/2 [&>button]:after:rounded-full [&>button]:after:bg-current",
      }}
      labels={{
        // โปรแกรมอ่านหน้าจออ่านวันที่แบบเดียวกับที่แสดง (ปี พ.ศ.) เช่น "วันพฤหัสบดีที่ 1 ตุลาคม 2569"
        labelDayButton: (date, modifiers) =>
          `${formatDateLong(date)}${modifiers.selected ? " (เลือกอยู่)" : ""}${modifiers.disabled ? " (จองไม่ได้)" : ""}`,
        labelNext: () => "เดือนถัดไป",
        labelPrevious: () => "เดือนก่อนหน้า",
      }}
      components={{ CaptionLabel: MonthCaption, DayButton: DayCell }}
    />
  );
}

// ส่วนย่อยของปฏิทิน (ประกาศนอกคอมโพเนนต์หลัก เพื่อไม่ให้ถูกสร้างใหม่ทุกครั้งที่เรนเดอร์)

/** หัวเดือน "ตุลาคม 2569" → ชื่อเดือนตัวหนา ปีสีจาง (แบบ Cal.com) */
function MonthCaption({ children, ...props }: ComponentProps<"span">) {
  const text = String(children);
  const split = text.lastIndexOf(" ");
  return (
    <span {...props}>
      <span className="font-bold text-foreground">{text.slice(0, split)}</span>{" "}
      <span className="text-muted-foreground">{text.slice(split + 1)}</span>
    </span>
  );
}

/** ช่องวันที่: วันที่ 1 ของเดือนมีชื่อเดือนย่อกำกับด้านบน (ยกเว้นตอนถูกเลือก เพื่อไม่ให้ช่องแน่น) */
function DayCell(props: ComponentProps<typeof CalendarDayButton>) {
  return (
    <CalendarDayButton {...props} locale={th} className="text-sm">
      {props.day.date.getDate() === 1 && !props.modifiers.selected ? (
        <span className="text-[10px] leading-none font-bold">{formatMonthShort(props.day.date)}</span>
      ) : null}
      {props.children}
    </CalendarDayButton>
  );
}
