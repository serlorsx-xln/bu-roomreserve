// สถานะกำลังโหลดของทุกหน้าในแอป (แสดงโครงหน้าแทนตัวหมุน)
import { PageContainer } from "@/components/page";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageContainer aria-busy="true" aria-label="กำลังโหลด">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      <div className="mt-8 flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-64" />
      </div>
      <div className="mt-6 overflow-hidden rounded-lg border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-4 py-4 last:border-b-0">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 flex-1" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
