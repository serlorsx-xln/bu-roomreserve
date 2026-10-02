"use client";

// ฟอร์มเข้าสู่ระบบและสมัครใช้งาน
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { availabilityHref } from "@/lib/routes";
import type { Faculty } from "@/lib/types";

/**
 * หน้าที่จะพากลับไปหลังเข้าสู่ระบบ — อนุญาตเฉพาะหน้าในเว็บนี้ (กันการ redirect ไปเว็บอื่น)
 * ใช้ URL แยกส่วนแล้วเทียบ origin จริง จึงกันกรณีพิเศษอย่าง "/\evil.com" ได้ด้วย
 * ถ้าไม่ระบุหรือไม่ปลอดภัย ให้ไปหน้าตารางห้องว่าง
 */
function safeNext(next?: string): string {
  if (!next) return availabilityHref();
  const url = new URL(next, window.location.origin);
  return url.origin === window.location.origin ? url.pathname + url.search + url.hash : availabilityHref();
}

type ApiResult = { ok: boolean; data: { error?: string; user?: { fullName: string } } };

/** ส่ง JSON ไปที่ API แล้วคืนผลลัพธ์ (ถ้าเชื่อมต่อไม่ได้ คืนข้อความ error ที่อ่านเข้าใจได้) */
async function postJson(url: string, body: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { ok: res.ok, data: await res.json().catch(() => ({})) };
  } catch {
    return { ok: false, data: { error: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองอีกครั้ง" } };
  }
}

// บัญชีทดลองจาก scripts/seed.mjs (รหัสผ่านเดียวกันทุกบัญชี)
const DEMO_ACCOUNTS = [
  { label: "ผู้ดูแลระบบ", userId: "5000000001" },
  { label: "อาจารย์", userId: "5100000001" },
  { label: "เจ้าหน้าที่", userId: "5200000001" },
  { label: "นักศึกษา", userId: "1650012345" },
];
const DEMO_PASSWORD = "password123";

function AuthCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border bg-card p-6 shadow-(--shadow-button-outline) sm:p-7">{children}</div>;
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-error px-3 py-2 text-sm text-error-foreground">
      {message}
    </p>
  );
}

// ─── เข้าสู่ระบบ ───

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const { ok, data } = await postJson("/api/auth/login", { userId, password });
    if (!ok) {
      setSubmitting(false);
      setError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
      return;
    }
    toast.success(`ยินดีต้อนรับ ${data.user?.fullName ?? ""}`);
    router.push(safeNext(next));
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">ยินดีต้อนรับกลับ</h1>
        <p className="mt-1 text-sm text-muted-foreground">เข้าสู่ระบบเพื่อจองห้องและติดตามคำขอของคุณ</p>
      </div>

      <AuthCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="userId">รหัสนักศึกษา/บุคลากร</FieldLabel>
              <Input
                id="userId"
                inputMode="numeric"
                autoComplete="username"
                placeholder="ตัวเลข 10 หลัก"
                value={userId}
                onChange={(e) => setUserId(e.target.value.replace(/\D/g, "").slice(0, 10))}
                pattern="\d{10}"
                title="ตัวเลข 10 หลัก"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">รหัสผ่าน</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
          </FieldGroup>
          <FormError message={error} />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Spinner /> : null}
            เข้าสู่ระบบ
          </Button>
        </form>

        {/* บัญชีทดลองสำหรับการตรวจงาน */}
        <div className="mt-6 border-t pt-5">
          <p className="text-xs text-muted-foreground">
            บัญชีทดลอง — กดเพื่อกรอกให้อัตโนมัติ (รหัสผ่าน {DEMO_PASSWORD})
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <Button
                key={account.userId}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setUserId(account.userId);
                  setPassword(DEMO_PASSWORD);
                  setError(null);
                }}
              >
                {account.label}
              </Button>
            ))}
          </div>
        </div>
      </AuthCard>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        ยังไม่มีบัญชี?{" "}
        <Link
          href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}
          className="font-bold text-foreground hover:underline"
        >
          สมัครใช้งาน
        </Link>
      </p>
    </>
  );
}

// ─── สมัครใช้งาน ───

export function RegisterForm({ next, faculties }: { next?: string; faculties: Faculty[] }) {
  const router = useRouter();
  const [facultyId, setFacultyId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    if (!facultyId) {
      setSubmitting(false);
      setError("กรุณาเลือกคณะ");
      return;
    }
    const { ok, data } = await postJson("/api/auth/register", { ...Object.fromEntries(form), facultyId });
    if (!ok) {
      setSubmitting(false);
      setError(data.error ?? "สมัครใช้งานไม่สำเร็จ");
      return;
    }
    toast.success("สร้างบัญชีเรียบร้อย");
    router.push(safeNext(next));
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">สร้างบัญชีใหม่</h1>
        <p className="mt-1 text-sm text-muted-foreground">ใช้รหัสนักศึกษา 10 หลักเข้าสู่ระบบ บัญชีใหม่จองห้องได้ทันที</p>
      </div>

      <AuthCard>
        <form onSubmit={handleSubmit} className="space-y-5">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="fullName">ชื่อ-นามสกุล</FieldLabel>
              <Input id="fullName" name="fullName" autoComplete="name" required minLength={2} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="userId">รหัสนักศึกษา</FieldLabel>
                <Input
                  id="userId"
                  name="userId"
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="ตัวเลข 10 หลัก"
                  pattern="\d{10}"
                  maxLength={10}
                  title="ตัวเลข 10 หลัก"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">เบอร์โทรศัพท์</FieldLabel>
                <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="ไม่บังคับ" />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="facultyId">คณะ</FieldLabel>
              <Select value={facultyId} onValueChange={(v) => v !== null && setFacultyId(v)}>
                <SelectTrigger id="facultyId" className="w-full">
                  <SelectValue placeholder="เลือกคณะ">
                    {faculties.find((f) => String(f.id) === facultyId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="email">อีเมล</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@bu.ac.th"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">รหัสผ่าน</FieldLabel>
              <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
              <FieldDescription>อย่างน้อย 8 ตัวอักษร</FieldDescription>
            </Field>
          </FieldGroup>
          <FormError message={error} />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Spinner /> : null}
            สร้างบัญชี
          </Button>
        </form>
      </AuthCard>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        มีบัญชีอยู่แล้ว?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-bold text-foreground hover:underline"
        >
          เข้าสู่ระบบ
        </Link>
      </p>
    </>
  );
}
