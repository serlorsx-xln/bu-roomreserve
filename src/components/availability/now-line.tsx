"use client";

// เส้นบอกเวลาปัจจุบันบนตารางห้องว่าง (อัปเดตทุกนาที)
// วาดฝั่งเบราว์เซอร์เท่านั้น เพื่อไม่ให้เวลาของ server กับเบราว์เซอร์ไม่ตรงกัน
import { useSyncExternalStore } from "react";
import { CLOSE_HOUR, OPEN_HOUR } from "@/lib/constants";
import { toDateKey } from "@/lib/format";

// นาฬิการายนาที: คืนค่าเลขนาทีตั้งแต่ epoch (ค่าคงที่ตลอดนาทีนั้น)
function subscribe(onTick: () => void) {
  const timer = setInterval(onTick, 30_000);
  return () => clearInterval(timer);
}
const currentMinute = () => Math.floor(Date.now() / 60_000);
const noMinuteOnServer = () => null;

export function NowLine({ dateKey }: { dateKey: string }) {
  const minute = useSyncExternalStore(subscribe, currentMinute, noMinuteOnServer);
  if (minute === null) return null;

  const now = new Date(minute * 60_000);
  if (toDateKey(now) !== dateKey) return null;

  const hours = now.getHours() + now.getMinutes() / 60;
  const fraction = (hours - OPEN_HOUR) / (CLOSE_HOUR - OPEN_HOUR);
  if (fraction < 0 || fraction > 1) return null;

  return (
    // เส้นเริ่มใต้หัวตาราง (top-10 = ความสูงหัวตาราง) มีจุดสีแดงที่หัวเส้นแบบปฏิทินทั่วไป
    <div
      aria-hidden
      className="pointer-events-none absolute top-10 bottom-0 z-[5] w-0.5 -translate-x-1/2 bg-now"
      style={{ left: `calc(var(--room-col) + (100% - var(--room-col)) * ${fraction})` }}
    >
      <span className="absolute top-0 left-1/2 size-2.5 -translate-1/2 rounded-full bg-now ring-2 ring-card" />
    </div>
  );
}
