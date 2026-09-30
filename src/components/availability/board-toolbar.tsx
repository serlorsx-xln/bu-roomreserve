"use client";

// แถบเครื่องมือเหนือตารางห้องว่าง: เลื่อนวัน เลือกวันที่ และตัวกรอง
// ค่าทั้งหมดเก็บไว้ใน URL (?date=&building=&capacity=&equipment=) เพื่อให้แชร์ลิงก์ได้
import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { th } from "react-day-picker/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CAPACITY_FILTERS } from "@/lib/constants";
import {
  addDays,
  formatDateLong,
  formatDateMedium,
  formatMonthYear,
  fromDateKey,
  relativeDayLabel,
  toDateKey,
} from "@/lib/format";

export type BoardFilters = {
  building: string; // "all" หรือ id ของอาคาร
  capacity: string; // "all" หรือจำนวนที่นั่งขั้นต่ำ
  equipment: string[]; // "projector" | "whiteboard"
};

const CAPACITY_ITEMS: Record<string, string> = {
  all: "ทุกขนาด",
  ...Object.fromEntries(CAPACITY_FILTERS.map((seats) => [String(seats), `${seats} ที่นั่งขึ้นไป`])),
};

export function BoardToolbar({
  dateKey,
  todayKey,
  maxKey,
  buildings,
  filters,
}: {
  dateKey: string;
  todayKey: string;
  maxKey: string;
  buildings: { id: number; name: string }[];
  filters: BoardFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  /** เปลี่ยนค่าบางตัว แล้วสร้าง URL ใหม่ (ค่าเริ่มต้นจะไม่ใส่ใน URL) */
  function navigate(changes: Partial<BoardFilters & { date: string }>) {
    const next = { date: dateKey, ...filters, ...changes };
    const params = new URLSearchParams();
    if (next.date !== todayKey) params.set("date", next.date);
    if (next.building !== "all") params.set("building", next.building);
    if (next.capacity !== "all") params.set("capacity", next.capacity);
    if (next.equipment.length > 0) params.set("equipment", next.equipment.join(","));
    const query = params.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  const date = fromDateKey(dateKey);
  // เทียบกับ "วันนี้" ของเซิร์ฟเวอร์ (ไม่ใช้นาฬิกาของเบราว์เซอร์ เพื่อให้สองฝั่งแสดงตรงกัน)
  const relative = relativeDayLabel(date, fromDateKey(todayKey));
  const buildingItems = {
    all: "ทุกอาคาร",
    ...Object.fromEntries(buildings.map((b) => [String(b.id), b.name])),
  };

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      {/* เลื่อนวัน */}
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={dateKey === todayKey} onClick={() => navigate({ date: todayKey })}>
          วันนี้
        </Button>
        <ButtonGroup>
          <Button
            variant="outline"
            size="icon"
            aria-label="วันก่อนหน้า"
            disabled={dateKey <= todayKey}
            onClick={() => navigate({ date: toDateKey(addDays(date, -1)) })}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="วันถัดไป"
            disabled={dateKey >= maxKey}
            onClick={() => navigate({ date: toDateKey(addDays(date, 1)) })}
          >
            <ChevronRightIcon />
          </Button>
        </ButtonGroup>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger
            render={<Button variant="ghost" className="h-9 gap-1 px-2 text-base font-bold text-foreground" />}
          >
            <span className="sm:hidden">{formatDateMedium(date)}</span>
            <span className="hidden sm:inline">{formatDateLong(date)}</span>
            <ChevronDownIcon className="text-muted-foreground" />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              locale={th}
              selected={date}
              defaultMonth={date}
              disabled={{ before: fromDateKey(todayKey), after: fromDateKey(maxKey) }}
              formatters={{
                formatCaption: (month) => {
                  const { month: name, year } = formatMonthYear(month);
                  return `${name} ${year}`;
                },
              }}
              onSelect={(selected) => {
                if (!selected) return;
                setCalendarOpen(false);
                navigate({ date: toDateKey(selected) });
              }}
            />
          </PopoverContent>
        </Popover>

        {relative ? <Badge variant="secondary" className="rounded-md">{relative}</Badge> : null}
        {isPending ? <Spinner className="text-muted-foreground" /> : null}
      </div>

      {/* ตัวกรอง */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <Select
          items={buildingItems}
          value={filters.building}
          onValueChange={(value) => navigate({ building: value ?? "all" })}
        >
          <SelectTrigger className="h-9 w-full sm:w-56" aria-label="อาคาร">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(buildingItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          items={CAPACITY_ITEMS}
          value={filters.capacity}
          onValueChange={(value) => navigate({ capacity: value ?? "all" })}
        >
          <SelectTrigger className="h-9 w-full sm:w-40" aria-label="จำนวนที่นั่ง">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CAPACITY_ITEMS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ToggleGroup
          multiple
          variant="outline"
          aria-label="อุปกรณ์ในห้อง"
          className="col-span-2"
          value={filters.equipment}
          onValueChange={(value) => navigate({ equipment: value })}
        >
          <ToggleGroupItem value="projector" className="h-9 px-3">
            โปรเจกเตอร์
          </ToggleGroupItem>
          <ToggleGroupItem value="whiteboard" className="h-9 px-3">
            ไวท์บอร์ด
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
