"use client";

// แถบบนของหน้าแรก (แบบ Cal.com): ตอนอยู่บนสุดกลืนกับพื้นหลัง
// เมื่อเลื่อนลงจะกลายเป็นแถบสีขาวลอยมีขอบ เพื่อให้เมนูอ่านง่ายเหนือเนื้อหา
// บนมือถือ ลิงก์ทั้งหมดย้ายไปอยู่ในปุ่ม "เมนู"
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { availabilityHref } from "@/lib/routes";

function subscribe(onScroll: () => void) {
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}
const isScrolled = () => window.scrollY > 8;
const notScrolledOnServer = () => false;

const NAV = [
  { href: availabilityHref(), label: "ห้องว่าง" },
  { href: "/rooms", label: "ห้องเรียนทั้งหมด" },
  { href: "#how", label: "วิธีใช้งาน" },
  { href: "#faq", label: "คำถามที่พบบ่อย" },
];

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const scrolled = useSyncExternalStore(subscribe, isScrolled, notScrolledOnServer);
  // ลิงก์บัญชี: จอใหญ่แสดงเป็นปุ่มข้อความ มือถือย้ายไปอยู่ในเมนู
  const account = signedIn
    ? { href: "/my-reservations", label: "การจองของฉัน" }
    : { href: "/login", label: "เข้าสู่ระบบ" };

  return (
    <header className="sticky top-0 z-40 px-3 pt-2">
      <div
        data-scrolled={scrolled}
        className="mx-auto flex h-14 max-w-[72rem] items-center gap-4 rounded-hero border border-transparent px-3 transition-[background-color,border-color,box-shadow] duration-300 ease-out data-[scrolled=true]:border-border data-[scrolled=true]:bg-background data-[scrolled=true]:shadow-(--shadow-card) md:px-7"
      >
        <Link href="/" className="flex items-center gap-2.5">
          <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[11px] font-extrabold tracking-tight text-primary-foreground">
            BU
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground md:text-xl">
            RoomReserve
          </span>
        </Link>

        <nav aria-label="เมนูหลัก" className="mx-auto hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              size="sm"
              className="text-base text-body hover:bg-transparent hover:text-foreground"
              render={<Link href={item.href} />}
            >
              {item.label}
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-foreground md:inline-flex"
            render={<Link href={account.href} />}
          >
            {account.label}
          </Button>
          <Button size="sm" render={<Link href={signedIn ? availabilityHref() : "/register"} />}>
            {signedIn ? "ไปที่ห้องว่าง" : "สมัครสมาชิก"}
            <ChevronRightIcon data-icon="inline-end" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="text-foreground md:hidden" />}>
              เมนู
              <ChevronDownIcon data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {NAV.map((item) => (
                <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                  {item.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href={account.href} />}>{account.label}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
