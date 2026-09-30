// โครงหน้าเข้าสู่ระบบ/สมัครใช้งาน: พื้นเทาอ่อน การ์ดกลางจอ (แบบ Cal.com)
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center bg-canvas px-4 py-12 sm:justify-center">
      <Link href="/" className="mb-8 text-lg font-bold tracking-tight text-foreground">
        RoomReserve
      </Link>
      <div className="w-full max-w-[26rem]">{children}</div>
    </div>
  );
}
