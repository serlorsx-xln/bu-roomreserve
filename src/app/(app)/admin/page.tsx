// หน้า "อนุมัติคำขอ" (เฉพาะผู้ดูแลระบบ): คิวคำขอที่รออนุมัติ เรียงตามลำดับที่ส่งเข้ามา
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/page";
import { DecisionButtons } from "@/components/reservation-actions";
import { ReservationList } from "@/components/reservation-list";
import { UrlTabs } from "@/components/url-tabs";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { requireAdmin } from "@/lib/auth";
import { formatDateMedium, formatTimeRange } from "@/lib/format";
import { countReservations, findReservationsWithDetails } from "@/lib/db";
import type { SearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "อนุมัติคำขอ" };

export default async function AdminPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin("/admin");
  const { tab: tabParam } = await searchParams;
  const tab = tabParam === "decided" ? "decided" : "pending";

  const now = new Date();
  // SQL: SELECT reservations JOIN rooms/buildings/users WHERE status = 'PENDING' AND end_datetime > ? ...
  // คิวรออนุมัติ: ส่งก่อนได้พิจารณาก่อน (ORDER BY created_at) | ตัดสินแล้ว: ล่าสุดก่อน (ORDER BY decided_at DESC)
  const reservations = tab === "pending"
    ? findReservationsWithDetails({
        statuses: ["PENDING"], endAfter: now, order: "created_asc",
      })
    : findReservationsWithDetails({
        statuses: ["APPROVED", "REJECTED"], order: "decided_desc", limit: 50,
      });
  const pendingCount = countReservations({ statuses: ["PENDING"], endAfter: now });
  const decidedCount = countReservations({ statuses: ["APPROVED", "REJECTED"] });

  return (
    <PageContainer className="max-w-[1000px]">
      <PageHeader
        title="อนุมัติคำขอ"
        description="พิจารณาคำขอตามลำดับที่ส่งเข้ามา ช่วงเวลาของคำขอที่รออนุมัติถูกกันไว้แล้ว คำขอในคิวจึงไม่ชนกันเอง"
      />

      <UrlTabs
        value={tab}
        tabs={[
          { value: "pending", label: "รออนุมัติ", count: pendingCount },
          { value: "decided", label: "ตัดสินแล้ว", count: decidedCount },
        ]}
      />

      {reservations.length > 0 ? (
        <ReservationList
          reservations={reservations}
          showRequester
          actions={
            tab === "pending"
              ? (r) => (
                  <DecisionButtons
                    reservationId={r.id}
                    summary={`${r.purpose} · ${r.room.code} ${formatDateMedium(r.startAt)} ${formatTimeRange(r.startAt, r.endAt)}`}
                  />
                )
              : undefined
          }
        />
      ) : (
        <Empty className="rounded-lg border bg-card py-16">
          <EmptyHeader>
            <EmptyTitle>{tab === "pending" ? "ไม่มีคำขอค้างอยู่" : "ยังไม่มีคำขอที่ตัดสินแล้ว"}</EmptyTitle>
            <EmptyDescription>
              {tab === "pending"
                ? "คำขอใหม่จะเข้ามาในคิวนี้ทันทีที่ผู้ใช้ส่ง"
                : "คำขอที่คุณอนุมัติหรือปฏิเสธจะแสดงที่นี่"}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </PageContainer>
  );
}
