// ป้ายสถานะห้อง: ว่าง / ถูกจอง / ปิดปรับปรุง — ใช้ทั้งสีและข้อความ (ไม่พึ่งสีอย่างเดียว)
import { Badge } from "@/components/ui/badge";
import { ROOM_STATUS_LABEL } from "@/lib/constants";
import type { RoomStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<RoomStatus, string> = {
  AVAILABLE: "bg-success text-success-foreground",
  RESERVED: "bg-attention text-attention-foreground",
  MAINTENANCE: "bg-muted text-muted-foreground",
};

export function RoomStatusBadge({ status, className }: { status: RoomStatus; className?: string }) {
  return (
    <Badge className={cn("h-5 rounded-md px-1.5 font-bold", STATUS_STYLE[status], className)}>
      {ROOM_STATUS_LABEL[status]}
    </Badge>
  );
}
