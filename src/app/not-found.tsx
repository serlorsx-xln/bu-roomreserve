import Link from "next/link";
import { Button } from "@/components/ui/button";
import { availabilityHref } from "@/lib/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-canvas px-4 text-center">
      <p className="text-sm font-bold text-muted-foreground tabular-nums">404</p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">ไม่พบหน้าที่คุณต้องการ</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        ลิงก์อาจไม่ถูกต้อง หรือรายการนี้ถูกลบไปแล้ว ลองกลับไปเลือกห้องจากตารางห้องว่าง
      </p>
      <Button className="mt-6" render={<Link href={availabilityHref()} />}>
        กลับหน้าห้องว่าง
      </Button>
    </div>
  );
}
