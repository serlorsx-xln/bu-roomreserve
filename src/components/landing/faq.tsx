// คำถามที่พบบ่อยบนหน้าแรก — คำตอบดึงตัวเลขจาก constants เพื่อให้ตรงกับกฎที่ API ใช้ตรวจจริงเสมอ
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CLOSE_HOUR, MAX_ADVANCE_DAYS, MAX_DURATION_HOURS, OPEN_HOUR } from "@/lib/constants";
import { formatHour } from "@/lib/format";

const QUESTIONS = [
  {
    q: "ใครใช้ระบบนี้ได้บ้าง",
    a: "นักศึกษา อาจารย์ และเจ้าหน้าที่ สมัครสมาชิกด้วยอีเมลแล้วจองห้องได้เท่ากันทุกคน ส่วนผู้ดูแลระบบเป็นผู้พิจารณาอนุมัติคำขอ",
  },
  {
    q: "ต้องเข้าสู่ระบบก่อนดูห้องว่างหรือไม่",
    a: "ไม่ต้อง ทุกคนดูตารางห้องว่างและรายละเอียดห้องได้ทันที ระบบจะขอให้เข้าสู่ระบบเฉพาะตอนส่งคำขอจอง",
  },
  {
    q: "จองได้ช่วงเวลาไหน และครั้งละนานเท่าไร",
    a: `จองได้ตั้งแต่ ${formatHour(OPEN_HOUR)} ถึง ${formatHour(CLOSE_HOUR)} น. เริ่มและจบตรงต้นชั่วโมง ครั้งละ 1–${MAX_DURATION_HOURS} ชั่วโมง และจองล่วงหน้าได้ไม่เกิน ${MAX_ADVANCE_DAYS} วัน`,
  },
  {
    q: "ถ้ามีคนขอช่วงเวลาเดียวกันไปก่อนแล้วจะเป็นอย่างไร",
    a: "ช่วงเวลานั้นถูกกันไว้ตั้งแต่คำขอแรกเข้าระบบ แม้ยังรออนุมัติอยู่ก็ตาม ระบบจะไม่รับคำขอที่ทับกัน และบอกให้เลือกเวลาอื่นทันที",
  },
  {
    q: "รู้ได้อย่างไรว่าคำขอได้รับอนุมัติแล้ว",
    a: "ดูที่หน้าการจองของฉัน คำขอใหม่อยู่ในแท็บรออนุมัติ เมื่อผู้ดูแลระบบอนุมัติแล้วจะย้ายไปอยู่ในแท็บกำลังจะถึง ถ้าถูกปฏิเสธหรือหมดอายุก่อนได้รับการพิจารณาจะอยู่ในแท็บยกเลิก/ไม่อนุมัติ",
  },
  {
    q: "ยกเลิกการจองได้หรือไม่",
    a: "ได้ ทั้งคำขอที่รออนุมัติและการจองที่อนุมัติแล้ว ตราบใดที่ยังไม่ถึงเวลาสิ้นสุด เมื่อยกเลิกแล้วช่วงเวลานั้นจะว่างให้คนอื่นจองได้ทันที",
  },
  {
    q: "ห้องที่ปิดปรับปรุงจะแสดงอย่างไร",
    a: "ห้องยังแสดงอยู่ในตารางพร้อมข้อความปิดปรับปรุง แต่เลือกช่วงเวลาและส่งคำขอไม่ได้จนกว่าห้องจะเปิดให้จองอีกครั้ง",
  },
];

export function Faq() {
  return (
    <div className="mx-auto max-w-[48rem] rounded-card bg-background px-2 py-2 shadow-(--shadow-card) md:px-4">
      <Accordion>
        {QUESTIONS.map((item) => (
          <AccordionItem key={item.q} value={item.q} className="px-3 md:px-4">
            <AccordionTrigger className="items-center py-5 text-base font-bold text-foreground hover:no-underline">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-base text-muted-foreground">
              <p className="max-w-[40rem]">{item.a}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
