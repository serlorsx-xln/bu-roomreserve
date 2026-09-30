// โครงของหน้าแรก (แบบ Cal.com)
// - เส้นกรอบแนวตั้งสองข้างยาวตลอดหน้า
// - เส้นคั่นแนวนอนระหว่างส่วน พร้อมเครื่องหมาย + ตรงจุดที่ตัดกับเส้นกรอบ
// ความกว้างกรอบ: 1200px บนจอใหญ่ และเว้นขอบ 12px บนมือถือ
import { cn } from "@/lib/utils";

const FRAME = "w-[min(75rem,calc(100%-1.5rem))]";

/** ห่อทั้งหน้าและวาดเส้นกรอบแนวตั้งไว้ด้านหลังเนื้อหา */
export function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate overflow-x-clip">
      <div
        aria-hidden
        className={cn("pointer-events-none absolute inset-y-0 left-1/2 -z-10 -translate-x-1/2 border-x", FRAME)}
      />
      {children}
    </div>
  );
}

/** เส้นคั่นแนวนอนเต็มความกว้างจอ */
export function SectionRule() {
  return (
    <div aria-hidden className="relative h-px bg-border">
      <div className={cn("absolute inset-y-0 left-1/2 -translate-x-1/2", FRAME)}>
        <PlusMark className="left-0" />
        <PlusMark className="left-full" />
      </div>
    </div>
  );
}

/** เครื่องหมาย + วาดด้วยเส้น 1px สองเส้น มีพื้นสีเดียวกับหน้าเพื่อตัดเส้นที่ผ่านให้ขาดรอบ ๆ */
function PlusMark({ className }: { className: string }) {
  return (
    <span
      className={cn(
        "absolute top-0 size-[1.0625rem] -translate-1/2 bg-canvas",
        "before:absolute before:top-1/2 before:left-1/2 before:h-px before:w-[0.5625rem] before:-translate-1/2 before:bg-border-strong",
        "after:absolute after:top-1/2 after:left-1/2 after:h-[0.5625rem] after:w-px after:-translate-1/2 after:bg-border-strong",
        className
      )}
    />
  );
}

/** เนื้อหาในแต่ละส่วน กว้างสูงสุด 1048px (ไม่รวมระยะขอบซ้ายขวา) ตรงกลางกรอบ */
export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[69.5rem] px-6 md:px-8", className)}>{children}</div>;
}

/** หัวข้อของแต่ละส่วน: หัวข้อใหญ่กลางหน้า คำอธิบาย และปุ่ม */
export function SectionIntro({
  id,
  title,
  description,
  actions,
}: {
  id?: string;
  title: string;
  description: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[45rem] flex-col items-center text-center">
      <h2
        id={id}
        className="text-heading font-bold tracking-[-0.01em] text-balance text-foreground md:text-display-md"
      >
        {title}
      </h2>
      <p className="mt-4 max-w-[34rem] text-base text-pretty text-muted-foreground md:text-lg md:leading-7">
        {description}
      </p>
      {actions ? <div className="mt-7 flex flex-wrap justify-center gap-3">{actions}</div> : null}
    </div>
  );
}

/**
 * การ์ดพื้นขาวมุมมน 16px (rounded-card) มีเงาบาง ๆ (การ์ดขั้นตอนและจุดเด่น)
 * ข้อความอยู่ด้านบน ภาพประกอบใช้พื้นที่ที่เหลือและล้นขอบการ์ดได้ (แบบ Cal.com)
 */
export function LandingCard({
  className,
  children,
  illustration,
}: {
  className?: string;
  children: React.ReactNode;
  illustration: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col overflow-hidden rounded-card bg-background shadow-(--shadow-card)", className)}>
      <div className="p-6">{children}</div>
      <div className="relative flex-1">{illustration}</div>
    </div>
  );
}
