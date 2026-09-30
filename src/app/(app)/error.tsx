"use client";

// หน้าที่แสดงเมื่อเกิดข้อผิดพลาดที่ไม่คาดคิด เช่น เชื่อมต่อฐานข้อมูลไม่ได้
// (error boundary ของ Next.js ต้องเป็น Client Component)
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { availabilityHref } from "@/lib/routes";

export default function AppError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // บันทึกไว้ใน console เพื่อช่วยหาสาเหตุ (ผู้ใช้ไม่เห็นรายละเอียดทางเทคนิค)
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-10 md:px-8 md:py-16">
      <Empty className="rounded-lg border bg-card py-16">
        <EmptyHeader>
          <EmptyTitle>เกิดข้อผิดพลาดบางอย่าง</EmptyTitle>
          <EmptyDescription>
            ระบบโหลดหน้านี้ไม่สำเร็จ ลองอีกครั้ง หากยังไม่ได้ให้กลับไปที่ตารางห้องว่าง
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <Button onClick={() => retry()}>ลองอีกครั้ง</Button>
          <Button variant="outline" render={<Link href={availabilityHref()} />}>
            ไปที่ตารางห้องว่าง
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
