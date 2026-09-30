"use client";

// ฟอร์มเพิ่ม/แก้ไขอาคารและห้อง + ปุ่มลบ (ใช้เฉพาะหน้าผู้ดูแลระบบ)
// เรียก /api/admin/rooms: POST = เพิ่ม, PATCH = แก้ไข, DELETE = ลบ
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ROOM_STATUS_LABEL, ROOM_TYPE_LABEL } from "@/lib/constants";

type BuildingOption = { id: number; name: string };
type RoomTypeValue = keyof typeof ROOM_TYPE_LABEL;
type RoomStatusValue = keyof typeof ROOM_STATUS_LABEL;

async function call(
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
  query?: string
): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch(`/api/admin/rooms${query ?? ""}`, {
    method,
    ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
  });
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) return { ok: false, error: data?.error ?? "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง" };
  return { ok: true };
}

// ─── ฟอร์มอาคาร ───
export function BuildingForm({ building }: { building?: { id: number; name: string; numberOfFloors: number } }) {
  const router = useRouter();
  const [name, setName] = useState(building?.name ?? "");
  const [floors, setFloors] = useState(String(building?.numberOfFloors ?? 1));
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await call(building ? "PATCH" : "POST", {
      kind: "building",
      id: building?.id,
      name,
      numberOfFloors: Number(floors),
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(building ? "แก้ไขอาคารแล้ว" : "เพิ่มอาคารใหม่แล้ว");
    if (!building) {
      setName("");
      setFloors("1");
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <Field className="w-56">
        <FieldLabel>ชื่ออาคาร</FieldLabel>
        <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} placeholder="เช่น อาคารเรียนรวม 2" />
      </Field>
      <Field className="w-28">
        <FieldLabel>จำนวนชั้น</FieldLabel>
        <Input type="number" min={1} max={100} value={floors} onChange={(e) => setFloors(e.target.value)} required />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? <Spinner /> : building ? "บันทึก" : "เพิ่มอาคาร"}
      </Button>
    </form>
  );
}

// ─── ฟอร์มห้อง ───
export function RoomForm({ buildings, defaultBuildingId }: { buildings: BuildingOption[]; defaultBuildingId?: number }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [capacity, setCapacity] = useState("");
  const [roomType, setRoomType] = useState<RoomTypeValue>("LECTURE");
  const [buildingId, setBuildingId] = useState(String(defaultBuildingId ?? buildings[0]?.id ?? ""));
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await call("POST", {
      kind: "room",
      code,
      capacity: Number(capacity),
      roomType,
      hasProjector: true, // ค่าเริ่มต้นของห้องใหม่: มีโปรเจกเตอร์และไวท์บอร์ด (แก้ไขทีหลังได้)
      hasWhiteboard: true,
      buildingId: Number(buildingId),
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`เพิ่มห้อง ${code} แล้ว`);
    setCode("");
    setCapacity("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <Field className="w-36">
        <FieldLabel>รหัสห้อง</FieldLabel>
        <Input value={code} onChange={(e) => setCode(e.target.value)} required maxLength={20} placeholder="เช่น IF-7M101" />
      </Field>
      <Field className="w-28">
        <FieldLabel>ที่นั่ง</FieldLabel>
        <Input type="number" min={1} max={1000} value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
      </Field>
      <Field className="w-44">
        <FieldLabel>ประเภทห้อง</FieldLabel>
        <Select value={roomType} onValueChange={(v) => v !== null && setRoomType(v as RoomTypeValue)}>
          <SelectTrigger className="w-full"><SelectValue>{ROOM_TYPE_LABEL[roomType]}</SelectValue></SelectTrigger>
          <SelectContent>
            {Object.entries(ROOM_TYPE_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field className="w-60">
        <FieldLabel>อาคาร</FieldLabel>
        <Select value={buildingId} onValueChange={(v) => v !== null && setBuildingId(v)}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {buildings.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? <Spinner /> : "เพิ่มห้อง"}
      </Button>
    </form>
  );
}

// ─── ปุ่มลบ (ยืนยันก่อนเสมอ) ───
export function DeleteRoomButton({
  kind,
  id,
  label,
  reason,
}: {
  kind: "room" | "building";
  id: number;
  label: string;
  /** เหตุผลที่แสดงในกล่องยืนยัน เช่น จะกระทบอะไรบ้าง */
  reason: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    const result = await call("DELETE", undefined, `?kind=${kind}&id=${id}`);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`ลบ${label}แล้ว`);
    router.refresh();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">ลบ</Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ลบ{label}?</AlertDialogTitle>
          <AlertDialogDescription>{reason}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ไม่ลบ</AlertDialogCancel>
          <AlertDialogAction onClick={remove} disabled={pending}>
            {pending ? <Spinner /> : "ลบ"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── ปุ่มเปลี่ยนสถานะห้องเร็ว (แก้ไขแบบ PATCH) ───
export function RoomStatusSelect({ roomId, status }: { roomId: number; status: RoomStatusValue }) {
  const router = useRouter();
  const [value, setValue] = useState<RoomStatusValue>(status);
  const [pending, setPending] = useState(false);

  async function change(next: string) {
    setValue(next as RoomStatusValue);
    setPending(true);
    const result = await call("PATCH", { kind: "room", id: roomId, status: next });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      setValue(status);
      return;
    }
    toast.success("เปลี่ยนสถานะห้องแล้ว");
    router.refresh();
  }

  return (
    <Select value={value} onValueChange={(v) => v !== null && change(v)} disabled={pending}>
      <SelectTrigger size="sm" aria-label="เปลี่ยนสถานะห้อง" className="w-36">
        <SelectValue>{ROOM_STATUS_LABEL[value]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(ROOM_STATUS_LABEL).map(([key, label]) => (
          <SelectItem key={key} value={key}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
