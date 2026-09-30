// รายการการจอง จัดกลุ่มตามวัน (แบบหน้า Bookings ของ Cal.com)
// ใช้ทั้งหน้า "การจองของฉัน" และหน้า "อนุมัติคำขอ"
import Link from "next/link";
import type { ReservationStatus, UserRole } from "@/lib/types";
import { ReservationStatusBadge } from "@/components/reservation-status";
import { ROLE_LABEL } from "@/lib/constants";
import {
  formatDateMedium,
  formatDateShort,
  formatTimeAgo,
  formatTimeRange,
  relativeDayLabel,
  toDateKey,
} from "@/lib/format";
import { displayStatus } from "@/lib/reservation-rules";
import { reservationHref } from "@/lib/routes";

export type ListReservation = {
  id: number;
  purpose: string;
  startAt: Date;
  endAt: Date;
  attendees: number;
  status: ReservationStatus;
  createdAt: Date;
  decidedAt: Date | null;
  room: { code: string; capacity: number; building: { name: string } };
  user: { fullName: string; role: UserRole; email: string };
};

export function ReservationList({
  reservations,
  showRequester = false,
  actions,
}: {
  reservations: ListReservation[];
  /** แสดงชื่อผู้ขอ (หน้าผู้ดูแลระบบ) */
  showRequester?: boolean;
  /** ปุ่มด้านขวาของแต่ละแถว */
  actions?: (reservation: ListReservation) => React.ReactNode;
}) {
  const now = new Date();
  const groups = groupByDay(reservations, now);

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          <h2 className="border-b bg-canvas px-5 py-2 text-xs font-bold text-muted-foreground">{group.label}</h2>
          <ul className="divide-y">
            {group.items.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 border-b px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:gap-6"
              >
                <Link href={reservationHref(r.id)} className="shrink-0 sm:w-40">
                  <span className="block text-sm font-bold text-foreground">{formatDateShort(r.startAt)}</span>
                  <span className="block text-sm text-muted-foreground tabular-nums">
                    {formatTimeRange(r.startAt, r.endAt)}
                  </span>
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={reservationHref(r.id)}
                      className="min-w-0 truncate text-sm font-bold text-foreground hover:underline"
                    >
                      {r.purpose}
                    </Link>
                    <ReservationStatusBadge status={displayStatus(r, now)} />
                  </div>
                  <p className="mt-0.5 text-sm text-body">
                    <span className="tabular-nums">{r.room.code}</span> · {r.room.building.name} ·{" "}
                    <span className="tabular-nums">
                      {r.attendees}/{r.room.capacity}
                    </span>{" "}
                    คน
                  </p>
                  {showRequester ? (
                    <p className="text-sm text-muted-foreground">
                      {r.user.fullName} · {ROLE_LABEL[r.user.role]} · ส่งคำขอ {formatTimeAgo(r.createdAt, now)}
                    </p>
                  ) : null}
                </div>

                {actions ? <div className="flex shrink-0 items-center gap-2">{actions(r)}</div> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** จัดกลุ่มการจองตามวันที่เริ่ม (คงลำดับเดิมของรายการ) */
function groupByDay(reservations: ListReservation[], now: Date) {
  const groups: { key: string; label: string; items: ListReservation[] }[] = [];
  for (const r of reservations) {
    const key = toDateKey(r.startAt);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      const relative = relativeDayLabel(r.startAt, now);
      const label = relative ? `${relative} · ${formatDateMedium(r.startAt)}` : formatDateMedium(r.startAt);
      group = { key, label, items: [] };
      groups.push(group);
    }
    group.items.push(r);
  }
  return groups;
}
