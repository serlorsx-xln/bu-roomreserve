"use client";

// แท็บที่เก็บค่าไว้ใน URL (?tab=...) เพื่อให้กดย้อนกลับและแชร์ลิงก์ได้
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function UrlTabs({
  value,
  tabs,
}: {
  value: string;
  tabs: { value: string; label: string; count?: number }[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Tabs
      value={value}
      onValueChange={(next) => router.push(`${pathname}?tab=${next}`, { scroll: false })}
      className="mb-4"
    >
      {/* มือถือ: ตาราง 2×2 ให้ข้อความแท็บไม่ถูกตัด · จอใหญ่: แถวเดียวตามแบบ shadcn
          (ใช้ group-data-horizontal/tabs: เพื่อแทนความสูงคงที่ h-8 ของ TabsList ต้นฉบับ) */}
      <TabsList className="grid w-full grid-cols-2 gap-1 group-data-horizontal/tabs:h-auto sm:inline-flex sm:w-fit sm:gap-0 sm:group-data-horizontal/tabs:h-9">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="h-8 gap-1.5 px-3 sm:h-[calc(100%-1px)]">
            {tab.label}
            {tab.count ? (
              <span className="rounded-sm bg-emphasis px-1.5 text-xs text-foreground tabular-nums">{tab.count}</span>
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
