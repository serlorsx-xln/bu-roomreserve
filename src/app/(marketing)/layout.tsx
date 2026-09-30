// โครงหน้าแรก (หน้าแนะนำระบบ): แถบบน + เนื้อหา + ท้ายหน้า บนพื้นสีเทาอ่อน ไม่มีเมนูด้านซ้ายแบบในแอป
import { PageFrame, SectionRule } from "@/components/landing/frame";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { getCurrentUser } from "@/lib/auth";

// อ่าน cookie และข้อมูลห้องจากฐานข้อมูลทุกครั้งที่เปิดหน้า
export const dynamic = "force-dynamic";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-svh bg-canvas">
      <PageFrame>
        <SiteHeader signedIn={user !== null} />
        <main>{children}</main>
        <SectionRule />
        <SiteFooter />
      </PageFrame>
    </div>
  );
}
