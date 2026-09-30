import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

// ฟอนต์ LINE Seed Sans TH (เก็บไฟล์ไว้ในโปรเจกต์ มีน้ำหนัก 400 และ 700)
const lineSeed = localFont({
  src: [
    { path: "../fonts/LINESeedSansTH_Rg.woff2", weight: "400", style: "normal" },
    { path: "../fonts/LINESeedSansTH_Bd.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-line-seed",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "BU RoomReserve", template: "%s · BU RoomReserve" },
  description:
    "ระบบจองห้องเรียนของมหาวิทยาลัยกรุงเทพ (BU) สำหรับนักศึกษา อาจารย์ และเจ้าหน้าที่ ดูห้องว่าง ส่งคำขอจอง และติดตามการอนุมัติได้ในที่เดียว",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={lineSeed.variable}>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
