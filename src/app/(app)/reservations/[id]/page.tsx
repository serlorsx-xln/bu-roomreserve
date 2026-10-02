// หน้ารายละเอียดใบจอง (และใบยกเลิกถ้ามี) — ใช้เป็นหน้ายืนยันหลังส่งคำขอด้วย (?created=1)
// ดูได้เฉพาะเจ้าของใบจองและผู้ดูแลระบบ
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/page";
import { CancelReservationButton, DecisionButtons } from "@/components/reservation-actions";
import { ReservationStatusBadge } from "@/components/reservation-status";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { requireUser } from "@/lib/auth";
import { ROLE_LABEL, ROOM_TYPE_LABEL } from "@/lib/constants";
import { formatDateLong, formatDateMedium, formatTime, formatTimeAgo, formatTimeRange } from "@/lib/format";
import { findReservationDetail } from "@/lib/db";
import { canCancel, canDecide, displayStatus, type DisplayStatus } from "@/lib/reservation-rules";
import { bookRoomHref } from "@/lib/routes";
import type { SearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "รายละเอียดการจอง" };

type Params = Promise<{ id: string }>;
const HEADLINE: Record<DisplayStatus, { title: string; body: React.ReactNode }> = {
  PENDING: {
    title: "คำขอนี้รอผู้ดูแลระบบอนุมัติ",
    body: (
      <>
        ช่วงเวลานี้ถูกกันไว้ให้คุณแล้วระหว่างรอการตรวจสอบ ติดตามสถานะได้ที่
        <span className="whitespace-nowrap">หน้าการจองของฉัน</span>
      </>
    ),
  },
  APPROVED: {
    title: "การจองได้รับอนุมัติแล้ว",
    body: "ห้องนี้เป็นของคุณในช่วงเวลาด้านล่าง หากไม่ใช้แล้วกรุณายกเลิกเพื่อให้ผู้อื่นจองได้",
  },
  REJECTED: {
    title: "คำขอนี้ถูกปฏิเสธ",
    body: "ผู้ดูแลระบบไม่อนุมัติคำขอนี้ ลองเลือกห้องหรือช่วงเวลาอื่นแล้วส่งคำขอใหม่",
  },
  CANCELLED: {
    title: "การจองนี้ถูกยกเลิกแล้ว",
    body: "ออกใบยกเลิกแล้ว ห้องกลับเป็นว่างและช่วงเวลานี้เปิดให้ผู้อื่นจองได้",
  },
  EXPIRED: {
    title: "คำขอนี้หมดอายุแล้ว",
    body: "ผู้ดูแลระบบไม่ได้พิจารณาคำขอนี้ก่อนถึงเวลาใช้ห้อง ลองเลือกช่วงเวลาอื่นแล้วส่งคำขอใหม่",
  },
};

/** ข้อความหัวหน้าสำหรับการจองที่อนุมัติแล้วและใช้ห้องเสร็จแล้ว */
const FINISHED = { title: "การใช้ห้องครั้งนี้สิ้นสุดแล้ว", body: "ขอบคุณที่ใช้ระบบจองห้องเรียน" };

export default async function ReservationPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const user = await requireUser(`/reservations/${id}`);

  const reservationId = Number(id);
  // SQL: SELECT ... JOIN rooms/buildings/users (ผู้จอง + ผู้อนุมัติ + ผู้ยกเลิก)/cancellations WHERE reservation_id = ?
  const reservation = Number.isInteger(reservationId) ? findReservationDetail(reservationId) : null;

  // ไม่ใช่เจ้าของและไม่ใช่ผู้ดูแลระบบ → ทำเหมือนไม่พบ
  if (!reservation || (reservation.reservedById !== user.id && user.role !== "ADMIN")) notFound();

  const now = new Date();
  const isOwner = reservation.reservedById === user.id;
  const cancellation = reservation.cancellation;
  const status = displayStatus(reservation, now);
  const justCreated = created === "1" && status === "PENDING";
  const headline = justCreated
    ? { title: "ส่งคำขอจองแล้ว", body: HEADLINE.PENDING.body }
    : status === "APPROVED" && reservation.endAt <= now
      ? FINISHED
      : HEADLINE[status];
  const summary = `${reservation.room.code} ${formatDateMedium(reservation.startAt)} ${formatTimeRange(reservation.startAt, reservation.endAt)}`;

  return (
    <PageContainer className="max-w-[680px] py-10 md:py-16">
      <article className="rounded-lg border bg-card">
        <header className="px-6 pt-8 pb-6 text-center md:px-10">
          <h1 className="text-2xl font-bold text-foreground">{headline.title}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{headline.body}</p>
        </header>

        <Separator />

        <dl className="grid grid-cols-1 gap-x-6 gap-y-5 px-6 py-7 text-sm sm:grid-cols-[9rem_1fr] md:px-10">
          <Detail label="สถานะ">
            <ReservationStatusBadge status={status} />
          </Detail>
          <Detail label="ห้อง">
            <span className="font-bold text-foreground tabular-nums">{reservation.room.code}</span>
            <span className="block text-muted-foreground">
              {reservation.room.building.name} · {ROOM_TYPE_LABEL[reservation.room.roomType]}
            </span>
          </Detail>
          <Detail label="วันและเวลา">
            <span className="font-bold text-foreground">{formatDateLong(reservation.startAt)}</span>
            <span className="block tabular-nums">{formatTimeRange(reservation.startAt, reservation.endAt)}</span>
          </Detail>
          <Detail label="วัตถุประสงค์">{reservation.purpose}</Detail>
          <Detail label="ผู้เข้าร่วม">
            {reservation.attendees} คน{" "}
            <span className="text-muted-foreground">(ห้องรองรับ {reservation.room.capacity} คน)</span>
          </Detail>
          <Detail label="ผู้จอง">
            {reservation.reservedBy.fullName}{" "}
            <span className="text-muted-foreground">· {ROLE_LABEL[reservation.reservedBy.role]}</span>
            <span className="block text-muted-foreground tabular-nums">
              รหัส {reservation.reservedBy.id}
              {reservation.reservedBy.facultyName ? ` · ${reservation.reservedBy.facultyName}` : ""}
            </span>
            <span className="block text-muted-foreground">{reservation.reservedBy.email}</span>
          </Detail>
          <Detail label="ส่งคำขอเมื่อ">
            {formatDateMedium(reservation.createdAt)} {formatTime(reservation.createdAt)} น.{" "}
            <span className="text-muted-foreground">({formatTimeAgo(reservation.createdAt, now)})</span>
          </Detail>
          {reservation.approvedBy && reservation.decidedAt ? (
            <Detail label={reservation.status === "REJECTED" ? "ปฏิเสธโดย" : "อนุมัติโดย"}>
              {reservation.approvedBy.fullName}{" "}
              <span className="text-muted-foreground">
                · {formatDateMedium(reservation.decidedAt)} {formatTime(reservation.decidedAt)} น.
              </span>
            </Detail>
          ) : null}
          <Detail label="เลขที่ใบจอง">
            <span className="tabular-nums">{reservation.id}</span>
          </Detail>
        </dl>

        {cancellation ? (
          <>
            <Separator />
            <section aria-labelledby="cancellation-title" className="px-6 py-7 md:px-10">
              <h2 id="cancellation-title" className="mb-5 text-base font-bold text-foreground">
                ใบยกเลิก
              </h2>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-5 text-sm sm:grid-cols-[9rem_1fr]">
                <Detail label="เลขที่ใบยกเลิก">
                  <span className="tabular-nums">{cancellation.id}</span>
                </Detail>
                <Detail label="ยกเลิกโดย">
                  {cancellation.cancelledBy.fullName}{" "}
                  <span className="text-muted-foreground">
                    · {ROLE_LABEL[cancellation.cancelledBy.role]}
                    {cancellation.cancelledBy.id === reservation.reservedById ? " (ผู้จอง)" : ""}
                  </span>
                  <span className="block text-muted-foreground tabular-nums">รหัส {cancellation.cancelledBy.id}</span>
                </Detail>
                <Detail label="ยกเลิกเมื่อ">
                  {formatDateMedium(cancellation.cancelledAt)} {formatTime(cancellation.cancelledAt)} น.
                </Detail>
                <Detail label="เหตุผล">{cancellation.reason ?? <span className="text-muted-foreground">ไม่ระบุ</span>}</Detail>
              </dl>
            </section>
          </>
        ) : null}

        <Separator />

        <footer className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 md:px-10">
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" render={<Link href={user.role === "ADMIN" && !isOwner ? "/admin" : "/my-reservations"} />}>
              {user.role === "ADMIN" && !isOwner ? "กลับไปหน้าอนุมัติคำขอ" : "การจองของฉัน"}
            </Button>
            {status === "REJECTED" || status === "CANCELLED" || status === "EXPIRED" ? (
              <Button variant="outline" render={<Link href={bookRoomHref(reservation.roomCode)} />}>
                จองห้องนี้อีกครั้ง
              </Button>
            ) : null}
          </div>
          {canCancel(reservation, user, now) ? (
            <CancelReservationButton reservationId={reservation.id} summary={summary} size="default" />
          ) : null}
          {canDecide(reservation, user.role, now) ? (
            <DecisionButtons reservationId={reservation.id} summary={summary} />
          ) : null}
        </footer>
      </article>
    </PageContainer>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="-mt-4 text-body sm:mt-0">{children}</dd>
    </>
  );
}
