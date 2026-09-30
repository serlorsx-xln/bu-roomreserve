"use client";

// เมนูด้านซ้าย (แบบ Cal.com): ชื่อระบบ, เมนูตัวอักษร, ผู้ใช้ด้านล่าง
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { UserRole } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ROLE_LABEL } from "@/lib/constants";
import { availabilityHref } from "@/lib/routes";

type SidebarUser = { fullName: string; email: string; role: UserRole } | null;

type NavItem = { href: string; label: string; badge?: number };

export function AppSidebar({ user, pendingCount }: { user: SidebarUser; pendingCount: number }) {
  const pathname = usePathname();

  const mainItems: NavItem[] = [
    { href: availabilityHref(), label: "ห้องว่าง" },
    { href: "/rooms", label: "ห้องเรียนทั้งหมด" },
    ...(user ? [{ href: "/my-reservations", label: "การจองของฉัน" }] : []),
  ];

  // เมนูนี้ active ไหม (ตรงกับ URL หรือเป็นหน้าย่อยของเมนูนั้น)
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sidebar>
      <SidebarHeader className="px-4 pt-5 pb-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[11px] font-extrabold tracking-tight text-primary-foreground">
            BU
          </span>
          <span>
            <span className="block text-[15px] font-bold leading-tight tracking-tight text-foreground">RoomReserve</span>
            <span className="block text-xs text-muted-foreground">มหาวิทยาลัยกรุงเทพ</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-0.5">
            {mainItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {user?.role === "ADMIN" && (
          <SidebarGroup>
            <SidebarGroupLabel>ผู้ดูแลระบบ</SidebarGroupLabel>
            <SidebarMenu className="gap-0.5">
              <NavLink
                item={{ href: "/admin", label: "อนุมัติคำขอ", badge: pendingCount }}
                active={isActive("/admin")}
              />
              <NavLink item={{ href: "/admin/rooms", label: "จัดการอาคาร/ห้อง" }} active={isActive("/admin/rooms")} />
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3">
        {user ? <UserMenu user={user} /> : <GuestActions />}
      </SidebarFooter>
    </Sidebar>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={active}
        render={<Link href={item.href} />}
        className="h-9 px-2.5 text-sm text-body data-active:text-foreground"
      >
        <span>{item.label}</span>
      </SidebarMenuButton>
      {item.badge ? (
        <SidebarMenuBadge className="top-2 rounded-md bg-background px-1.5 text-foreground ring-1 ring-border">
          {item.badge}
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  );
}

function UserMenu({ user }: { user: NonNullable<SidebarUser> }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left outline-none hover:bg-emphasis focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-emphasis" />
        }
      >
        <Avatar size="sm">
          <AvatarFallback className="bg-emphasis text-xs font-bold text-foreground">
            {user.fullName.replace(/^(ดร\.|อ\.|ผศ\.|รศ\.|ศ\.)/, "").charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-foreground">{user.fullName}</span>
          <span className="block truncate text-xs text-muted-foreground">{ROLE_LABEL[user.role]}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <span className="block text-xs text-muted-foreground">เข้าสู่ระบบด้วย</span>
            <span className="block truncate text-sm text-foreground">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/my-reservations" />}>การจองของฉัน</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          ออกจากระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GuestActions() {
  return (
    <div className="space-y-2 rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">เข้าสู่ระบบเพื่อจองห้องและติดตามคำขอของคุณ</p>
      <Button className="w-full" render={<Link href="/login" />}>
        เข้าสู่ระบบ
      </Button>
      <Button variant="outline" className="w-full" render={<Link href="/register" />}>
        สมัครใช้งาน
      </Button>
    </div>
  );
}
