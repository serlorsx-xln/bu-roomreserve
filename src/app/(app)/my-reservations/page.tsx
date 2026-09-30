// หน้า "การจองของฉัน": แท็บ กำลังจะถึง / รออนุมัติ / ที่ผ่านมา / ยกเลิกและถูกปฏิเสธ
import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer, PageHeader } from "@/components/page";
import { CancelReservationButton } from "@/components/reservation-actions";
import { ReservationList } from "@/components/reservation-list";
import { UrlTabs } from "@/components/url-tabs";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { requireUser } from "@/lib/auth";
import { formatDateMedium, formatTimeRange } from "@/lib/format";
import { countReservations, findReservationsWithDetails } from "@/lib/db";
import type { ReservationStatus } from "@/lib/types";
import { availabilityHref } from "@/lib/routes";
import type { SearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "การจองของฉัน" };

type Tab = "upcoming" | "pending" | "past" | "cancelled";

const EMPTY: Record<Tab, { title: string; description: string }> = {
  upcoming: {
    title: "ยังไม่มีการจองที่กำลังจะถึง",
    description: "เมื่อผู้ดูแลระบบอนุมัติคำขอของคุณ การจองจะแสดงที่นี่",
  },
  pending: {
    title: "ไม่มีคำขอที่รออนุมัติ",
    description: "คำขอจองใหม่ทุกรายการจะรอผู้ดูแลระบบตรวจสอบก่อน",
  },
  past: { title: "ยังไม่มีประวัติการใช้ห้อง", description: "การจองที่อนุมัติแล้วและใช้งานเสร็จแล้วจะย้ายมาอยู่ที่นี่" },
  cancelled: {
    title: "ไม่มีการจองที่ยกเลิกหรือไม่ได้รับอนุมัติ",
    description: "รายการที่คุณยกเลิกเอง ที่ผู้ดูแลระบบปฏิเสธ หรือที่หมดอายุก่อนได้รับการพิจารณา จะแสดงที่นี่",
  },
};

export default async function MyReservationsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser("/my-reservations");
  const { tab: tabParam } = await searchParams;
  const tab: Tab = ["upcoming", "pending", "past", "cancelled"].includes(String(tabParam))
    ? (tabParam as Tab)
    : "upcoming";

  const now = new Date();
  // เงื่อนไข WHERE ของแต่ละแท็บ (ส่งเป็นตัวกรองให้ชั้น SQL)
  const statuses: Record<Tab, ReservationStatus[]> = {
    upcoming: ["APPROVED"],
    pending: ["PENDING"],
    past: ["APPROVED"],
    cancelled: ["CANCELLED", "REJECTED"],
  };
  const includePast = tab === "past" || tab === "cancelled";
  const newestFirst = includePast;

  // SQL: SELECT reservations JOIN rooms/buildings/users WHERE user_id = ? AND status IN (...) ...
  // แท็บ "ยกเลิก/ไม่อนุมัติ" รวมคำขอ PENDING ที่เลยเวลาแล้ว (หมดอายุ) ด้วย
  const cancelledExpired = countReservations({
    userId: user.id, statuses: ["PENDING"], endAtOrBefore: now,
  });
  const reservations = tab === "cancelled"
    ? [
        ...findReservationsWithDetails({ userId: user.id, statuses: statuses.cancelled, order: "start_desc" }),
        ...findReservationsWithDetails({ userId: user.id, statuses: ["PENDING"], endAtOrBefore: now, order: "start_desc" }),
      ]
    : findReservationsWithDetails({
        userId: user.id,
        statuses: statuses[tab],
        ...(includePast ? { endAtOrBefore: now } : { endAfter: now }),
        order: newestFirst ? "start_desc" : "start_asc",
      });
  const upcoming = countReservations({ userId: user.id, statuses: ["APPROVED"], endAfter: now });
  const pending = countReservations({ userId: user.id, statuses: ["PENDING"], endAfter: now });
  const past = countReservations({ userId: user.id, statuses: ["APPROVED"], endAtOrBefore: now });
  const cancelled = countReservations({ userId: user.id, statuses: ["CANCELLED", "REJECTED"] }) + cancelledExpired;

  const canCancel = tab === "upcoming" || tab === "pending";

  return (
    <PageContainer className="max-w-[1000px]">
      <PageHeader
        title="การจองของฉัน"
        description="ติดตามสถานะคำขอ ดูการจองที่กำลังจะถึง และยกเลิกการจองที่ไม่ได้ใช้"
        actions={<Button render={<Link href={availabilityHref()} />}>จองห้องใหม่</Button>}
      />

      <UrlTabs
        value={tab}
        tabs={[
          { value: "upcoming", label: "กำลังจะถึง", count: upcoming },
          { value: "pending", label: "รออนุมัติ", count: pending },
          { value: "past", label: "ที่ผ่านมา", count: past },
          { value: "cancelled", label: "ยกเลิก/ไม่อนุมัติ", count: cancelled },
        ]}
      />

      {reservations.length > 0 ? (
        <ReservationList
          reservations={reservations}
          actions={
            canCancel
              ? (r) => (
                  <CancelReservationButton
                    reservationId={r.id}
                    summary={`${r.room.code} ${formatDateMedium(r.startAt)} ${formatTimeRange(r.startAt, r.endAt)}`}
                  />
                )
              : undefined
          }
        />
      ) : (
        <Empty className="rounded-lg border bg-card py-16">
          <EmptyHeader>
            <EmptyTitle>{EMPTY[tab].title}</EmptyTitle>
            <EmptyDescription>{EMPTY[tab].description}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" render={<Link href={availabilityHref()} />}>
              ดูห้องว่าง
            </Button>
          </EmptyContent>
        </Empty>
      )}
    </PageContainer>
  );
}
