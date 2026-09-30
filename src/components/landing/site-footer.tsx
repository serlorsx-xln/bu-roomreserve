// ท้ายหน้าแรก: ชื่อระบบ คำอธิบายสั้น และลิงก์แบ่งเป็นหมวด (แบบ Cal.com)
import Link from "next/link";
import { availabilityHref } from "@/lib/routes";

const COLUMNS = [
  {
    title: "ระบบจองห้อง",
    links: [
      { href: availabilityHref(), label: "ห้องว่าง" },
      { href: "/rooms", label: "ห้องเรียนทั้งหมด" },
      { href: "/my-reservations", label: "การจองของฉัน" },
    ],
  },
  {
    title: "บัญชี",
    links: [
      { href: "/login", label: "เข้าสู่ระบบ" },
      { href: "/register", label: "สมัครสมาชิก" },
    ],
  },
  {
    title: "ช่วยเหลือ",
    links: [
      { href: "#how", label: "วิธีใช้งาน" },
      { href: "#faq", label: "คำถามที่พบบ่อย" },
    ],
  },
];

export function SiteFooter() {
  const buddhistYear = new Date().getFullYear() + 543;

  return (
    <footer className="mx-auto grid w-[min(75rem,calc(100%-1.5rem))] gap-12 px-6 pt-16 pb-12 md:grid-cols-[minmax(0,1fr)_auto] md:px-8 md:pt-20">
      <div className="max-w-sm">
        <Link href="/" className="text-xl font-bold tracking-tight text-foreground">
          RoomReserve
        </Link>
        <p className="mt-3 text-sm text-muted-foreground">
          ระบบจองห้องเรียนออนไลน์สำหรับนักศึกษา อาจารย์ และเจ้าหน้าที่ ดูห้องว่าง ส่งคำขอ และติดตามผลการอนุมัติได้ในที่เดียว
        </p>
        <p className="mt-6 text-xs text-faint">
          โครงงานวิชา CS430 ระบบฐานข้อมูล · {buddhistYear}
        </p>
      </div>

      <nav aria-label="ลิงก์ท้ายหน้า" className="grid grid-cols-2 gap-x-16 gap-y-10 sm:grid-cols-3">
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-bold text-foreground">{column.title}</p>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-body hover:text-foreground hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </footer>
  );
}
