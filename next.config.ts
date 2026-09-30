import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // สร้าง .next/standalone สำหรับรันใน Docker ขนาดเล็ก
  output: "standalone",
  // ปิด typecheck/lint ตอน production build (รัน `npm run typecheck` แยกอยู่แล้ว)
  // เพื่อลดการใช้ RAM ตอน build บนเซิร์ฟเวอร์ที่มีทรัพยากรจำกัด
  typescript: { ignoreBuildErrors: true },
  experimental: {
    // โปรเจกต์นี้เก็บบนไดรฟ์ภายนอกแบบ exFAT ซึ่ง macOS จะสร้างไฟล์ "._*" ปนเข้าไปในโฟลเดอร์แคช
    // ทำให้ Turbopack อ่านแคชบนดิสก์ไม่ได้ ("Loading persistence directory failed")
    // จึงปิดแคชบนดิสก์ไว้ — คอมไพล์ช้าลงเล็กน้อยแต่รันได้เสมอ
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
