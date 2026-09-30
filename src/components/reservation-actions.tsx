"use client";

// ปุ่มดำเนินการกับการจอง: ยกเลิก (เจ้าของ) / อนุมัติ-ปฏิเสธ (ผู้ดูแลระบบ)
// ทุกปุ่มเรียก PATCH /api/reservations/[id] แล้วรีเฟรชข้อมูลบนหน้า
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type Action = "approve" | "reject" | "cancel";

const SUCCESS_MESSAGE: Record<Action, string> = {
  approve: "อนุมัติคำขอแล้ว",
  reject: "ปฏิเสธคำขอแล้ว",
  cancel: "ยกเลิกการจองแล้ว",
};

function useReservationAction(reservationId: number) {
  const router = useRouter();
  const [running, setRunning] = useState<Action | null>(null);

  async function run(action: Action) {
    setRunning(action);
    let res: Response;
    try {
      res = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    } catch {
      setRunning(null);
      toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองอีกครั้ง");
      return;
    }
    const data = await res.json().catch(() => ({}));
    setRunning(null);
    if (!res.ok) {
      toast.error(data.error ?? "ทำรายการไม่สำเร็จ");
      return;
    }
    toast.success(SUCCESS_MESSAGE[action]);
    router.refresh();
  }

  return { running, run };
}

/** ปุ่มยกเลิกการจอง (ยืนยันก่อนเสมอ) */
export function CancelReservationButton({
  reservationId,
  summary,
  size = "sm",
}: {
  reservationId: number;
  summary: string;
  size?: "sm" | "default";
}) {
  const { running, run } = useReservationAction(reservationId);
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" size={size} disabled={running !== null} />}>
        {running ? <Spinner /> : null}
        ยกเลิกการจอง
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยกเลิกการจองนี้?</AlertDialogTitle>
          <AlertDialogDescription>
            {summary} — เมื่อยกเลิกแล้ว ช่วงเวลานี้จะเปิดให้ผู้อื่นจองได้ทันที และไม่สามารถกู้คืนได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ไม่ยกเลิก</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => run("cancel")}>
            ยกเลิกการจอง
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** ปุ่มอนุมัติ / ปฏิเสธ สำหรับผู้ดูแลระบบ */
export function DecisionButtons({ reservationId, summary }: { reservationId: number; summary: string }) {
  const { running, run } = useReservationAction(reservationId);
  return (
    <div className="flex items-center gap-2">
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="outline" size="sm" disabled={running !== null} />}>
          {running === "reject" ? <Spinner /> : null}
          ปฏิเสธ
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ปฏิเสธคำขอนี้?</AlertDialogTitle>
            <AlertDialogDescription>
              {summary} — ผู้ขอจะเห็นสถานะ “ถูกปฏิเสธ” ในหน้าการจองของตน และช่วงเวลานี้จะว่างทันที
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>กลับ</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => run("reject")}>
              ปฏิเสธคำขอ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button size="sm" disabled={running !== null} onClick={() => run("approve")}>
        {running === "approve" ? <Spinner /> : null}
        อนุมัติ
      </Button>
    </div>
  );
}
