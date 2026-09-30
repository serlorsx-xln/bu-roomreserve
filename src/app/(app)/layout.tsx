// โครงหน้าหลักของแอป: เมนูด้านซ้าย + เนื้อหา
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/auth";
import { countReservations } from "@/lib/db";

// ทุกหน้าในกลุ่มนี้อ่านข้อมูลจากฐานข้อมูล/cookie แบบเรียลไทม์
// จึงต้องเรนเดอร์ตอน request (ห้าม prerender ตอน build)
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // จำนวนคำขอที่รออนุมัติ (แสดงเป็นตัวเลขที่เมนูของผู้ดูแลระบบ)
  const pendingCount =
    user?.role === "ADMIN"
      ? // SQL: SELECT COUNT(*) FROM reservations WHERE status = 'PENDING' AND end_datetime > ?
        countReservations({ statuses: ["PENDING"], endAfter: new Date() })
      : 0;

  return (
    <SidebarProvider style={{ "--sidebar-width": "15rem" } as React.CSSProperties}>
      <AppSidebar
        user={user ? { fullName: user.fullName, email: user.email, role: user.role } : null}
        pendingCount={pendingCount}
      />
      <SidebarInset className="bg-canvas">
        {/* แถบบนสำหรับมือถือ (เดสก์ท็อปใช้เมนูด้านซ้าย) */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur md:hidden">
          <SidebarTrigger aria-label="เปิดเมนู" />
          <span className="flex items-center gap-2">
            <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[10px] font-extrabold text-primary-foreground">BU</span>
            <span className="text-[15px] font-bold tracking-tight text-foreground">RoomReserve</span>
          </span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
