// ป้ายสถานะการจอง — ใช้ทั้งสีและข้อความ (ไม่พึ่งสีอย่างเดียว)
import { Badge } from "@/components/ui/badge";
import { RESERVATION_STATUS_LABEL } from "@/lib/constants";
import type { DisplayStatus } from "@/lib/reservation-rules";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<DisplayStatus, string> = { ...RESERVATION_STATUS_LABEL, EXPIRED: "หมดอายุ" };

const STATUS_STYLE: Record<DisplayStatus, string> = {
  PENDING: "bg-attention text-attention-foreground",
  APPROVED: "bg-success text-success-foreground",
  REJECTED: "bg-error text-error-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
  EXPIRED: "bg-muted text-muted-foreground",
};

export function ReservationStatusBadge({
  status,
  className,
}: {
  status: DisplayStatus;
  className?: string;
}) {
  return (
    <Badge className={cn("h-5 rounded-md px-1.5 font-bold", STATUS_STYLE[status], className)}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
