// หน้าแรก: แนะนำระบบจองห้องเรียน (โครงเดียวกับหน้าแรกของ Cal.com)
// ทุกอย่างบนหน้านี้มาจากข้อมูลจริงของระบบ: ห้องตัวอย่าง อาคาร และกฎการจองจาก constants
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { Container, LandingCard, SectionIntro, SectionRule } from "@/components/landing/frame";
import { Faq } from "@/components/landing/faq";
import { HeroBooker } from "@/components/landing/hero-booker";
import {
  ApprovalIllustration,
  BoardIllustration,
  ConflictIllustration,
  MyReservationsIllustration,
  RulesIllustration,
  SlotsIllustration,
  StatusIllustration,
} from "@/components/landing/illustrations";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { BLOCKING_STATUSES, MAX_ADVANCE_DAYS } from "@/lib/constants";
import { addDays, atHour, toDateKey } from "@/lib/format";
import { findRoomWithBuilding, getBuildings, getRooms, getReservations } from "@/lib/db";
import { availabilityHref } from "@/lib/routes";

/** SQL: SELECT room_code FROM rooms WHERE status IN ('AVAILABLE', 'RESERVED') ORDER BY building_id, room_code (ห้องแรกที่จองได้) */
function firstBookableRoomCode(): string {
  return getRooms({ statuses: ["AVAILABLE", "RESERVED"] })[0]?.code ?? "";
}

export const metadata: Metadata = {
  title: { absolute: "BU RoomReserve · จองห้องเรียน มหาวิทยาลัยกรุงเทพ" },
  description:
    "ระบบจองห้องเรียนของมหาวิทยาลัยกรุงเทพ ดูห้องว่างรายชั่วโมง ส่งคำขอจอง และติดตามผลการอนุมัติได้ในที่เดียว สำหรับนักศึกษา BU ทุกคน",
};

export default async function LandingPage() {
  const now = new Date();
  const todayKey = toDateKey(now);
  const maxKey = toDateKey(addDays(now, MAX_ADVANCE_DAYS));

  const [user, buildings, featuredRoom] = await Promise.all([
    getCurrentUser(),
    // SQL: SELECT buildings + นับจำนวนห้อง (LEFT JOIN + GROUP BY)
    getBuildings(),
    // ห้องตัวอย่างในวิดเจ็ตด้านบน: ห้องแรกที่เปิดให้จอง พร้อมช่วงเวลาที่ถูกจองไปแล้ว
    // SQL: SELECT ห้องแรกที่เปิดให้จอง (ORDER BY building_id, room_code LIMIT 1)
    findRoomWithBuilding(firstBookableRoomCode()),
  ]);
  const signedIn = user !== null;

  // ใบจองที่ยังกันเวลาอยู่ของห้องตัวอย่าง (SQL: SELECT ... WHERE room_code = ? AND status IN (...) ...)
  const featuredReservations = featuredRoom
    ? getReservations({
        roomCode: featuredRoom.code,
        statuses: BLOCKING_STATUSES,
        endAfter: now,
        startBefore: atHour(maxKey, 24),
        order: "start_asc",
      })
    : [];

  return (
    <>
      {/* ─── ส่วนแรก: ข้อความหลัก + ตัวอย่างหน้าจองของห้องจริง ─── */}
      <section aria-labelledby="hero-title" className="px-3 pt-4 pb-4 md:pt-6">
        <div className="mx-auto max-w-[73.5rem] overflow-hidden rounded-hero bg-background shadow-(--shadow-card)">
          <div className="grid items-center gap-12 px-6 py-12 md:px-16 md:py-20 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] lg:gap-12 lg:py-28">
            <div>
              <h1
                id="hero-title"
                className="text-display-sm font-bold tracking-[-0.01em] text-foreground md:text-display"
              >
                จองห้องเรียน
                <br />
                สไตล์ BU
              </h1>
              <p className="mt-5 max-w-[30rem] text-base text-pretty text-muted-foreground md:text-lg md:leading-7">
                ดูห้องว่างรายชั่วโมงในอาคาร C11, A-Zone และ C5 เลือกเวลา ส่งคำขอ
                แล้วรออนุมัติ — ใช้ได้ทั้ง<span className="whitespace-nowrap">นักศึกษา BU</span> อาจารย์ และ<span className="whitespace-nowrap">เจ้าหน้าที่</span>
              </p>
              <div className="mt-8 grid gap-3">
                <Button className="w-full" render={<Link href={availabilityHref()} />}>
                  ดูห้องว่างวันนี้
                </Button>
                {signedIn ? (
                  <Button variant="secondary" className="w-full" render={<Link href="/my-reservations" />}>
                    การจองของฉัน
                    <ChevronRightIcon data-icon="inline-end" />
                  </Button>
                ) : (
                  <Button variant="secondary" className="w-full" render={<Link href="/register" />}>
                    สมัครด้วยรหัสนักศึกษา
                    <ChevronRightIcon data-icon="inline-end" />
                  </Button>
                )}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {signedIn ? "คุณเข้าสู่ระบบแล้ว ส่งคำขอจองได้ทันที" : "ดูตารางห้องว่างได้เลย ไม่ต้องเข้าสู่ระบบ"}
              </p>
            </div>

            {featuredRoom ? (
              <div className="min-w-0">
                <HeroBooker
                  room={{
                    code: featuredRoom.code,
                    capacity: featuredRoom.capacity,
                    roomType: featuredRoom.roomType,
                    hasProjector: featuredRoom.hasProjector,
                    hasWhiteboard: featuredRoom.hasWhiteboard,
                    buildingName: featuredRoom.building.name,
                  }}
                  reservations={featuredReservations}
                  todayKey={todayKey}
                  maxKey={maxKey}
                />
                <p className="mt-4 text-sm text-muted-foreground">
                  ช่องสีเทาคือวันที่ห้อง {featuredRoom.code} ยังว่าง กดวันที่เพื่อไปเลือกเวลาในหน้าจอง
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ─── อาคารที่เปิดให้จอง (ตำแหน่งเดียวกับแถบโลโก้ของ Cal.com) ─── */}
      <SectionRule />
      <section aria-label="อาคารที่เปิดให้จอง" className="py-9">
        <Container className="flex flex-col gap-5 md:flex-row md:items-center md:gap-16">
          <p className="shrink-0 text-sm text-muted-foreground">
            อาคารที่เปิดให้จอง
            <br className="hidden md:block" />
            ผ่านระบบนี้
          </p>
          <ul className="flex flex-wrap items-baseline gap-x-12 gap-y-3">
            {buildings.map((building) => (
              <li key={building.id} className="text-lg font-bold text-foreground/70">
                {building.name}{" "}
                <span className="text-sm font-normal text-muted-foreground">{building.roomCount} ห้อง</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>
      <SectionRule />

      {/* ─── วิธีใช้งาน 3 ขั้นตอน ─── */}
      <section id="how" aria-labelledby="how-title" className="scroll-mt-20 py-24 md:py-32">
        <Container>
          <SectionIntro
            id="how-title"
            title="จองห้องเรียนได้ในสามขั้นตอน"
            description="ไม่ต้องเดินไปดูหน้าห้องหรือโทรถามว่าห้องไหนว่าง ทุกห้องอยู่ในตารางเดียว และทุกคำขอมีสถานะให้ติดตาม"
            actions={<SectionActions />}
          />
          <ol className="mt-14 grid gap-3.5 md:grid-cols-3">
            <Step
              number={1}
              title="เลือกวันและห้องที่ว่าง"
              body="ตารางห้องว่างแสดงทุกห้องของวันที่เลือก ช่องสีขาวคือชั่วโมงที่ยังว่าง"
              illustration={<BoardIllustration todayKey={todayKey} />}
            />
            <Step
              number={2}
              title="เลือกเวลาแล้วส่งคำขอ"
              body="เลือกระยะเวลาและเวลาเริ่ม บอกวัตถุประสงค์และจำนวนผู้เข้าร่วม แล้วกดส่ง"
              illustration={<SlotsIllustration todayKey={todayKey} />}
            />
            <Step
              number={3}
              title="รอผู้ดูแลระบบอนุมัติ"
              body="เมื่อคำขอได้รับอนุมัติ สถานะจะเปลี่ยนในหน้าการจองของฉัน ห้องเป็นของคุณในเวลานั้น"
              illustration={<StatusIllustration todayKey={todayKey} />}
            />
          </ol>
        </Container>
      </section>

      {/* ─── จุดเด่น ─── */}
      <SectionRule />
      <section aria-labelledby="features-title" className="py-24 md:py-32">
        <Container>
          <SectionIntro
            id="features-title"
            title="ทุกอย่างที่ต้องใช้ในการจองห้อง"
            description="ออกแบบตามขั้นตอนจริงของการขอใช้ห้องเรียน ตั้งแต่ค้นหาห้องว่างจนถึงวันที่เข้าใช้ห้อง"
            actions={<SectionActions />}
          />
          <div className="mt-14 grid gap-3.5 md:grid-cols-2">
            <Feature
              title="ไม่มีวันจองซ้อนกัน"
              body="ช่วงเวลาที่มีคำขอรออนุมัติหรืออนุมัติแล้วจะถูกกันไว้ทันที และระบบตรวจซ้ำอีกครั้งตอนบันทึก สองคำขอจึงไม่มีทางได้ห้องเดียวกันในเวลาเดียวกัน"
              illustration={<ConflictIllustration />}
            />
            <Feature
              title="กฎการจองที่ระบบตรวจให้ทุกครั้ง"
              body="เวลาเปิดจอง ระยะเวลาต่อครั้ง วันที่จองล่วงหน้าได้ และความจุของห้อง ถูกตรวจทั้งในหน้าจองและที่เซิร์ฟเวอร์"
              illustration={<RulesIllustration />}
            />
            <Feature
              title="ติดตามทุกคำขอได้ในที่เดียว"
              body="หน้าการจองของฉันแยกคำขอตามสถานะ รออนุมัติ กำลังจะถึง และที่ผ่านมา พร้อมปุ่มยกเลิกเมื่อไม่ได้ใช้ห้องแล้ว"
              illustration={<MyReservationsIllustration todayKey={todayKey} />}
            />
            <Feature
              title="ผู้ดูแลระบบอนุมัติได้ในคลิกเดียว"
              body="คำขอเรียงจากเก่าไปใหม่ พร้อมผู้ขอ วัตถุประสงค์ และจำนวนผู้เข้าร่วม กดอนุมัติหรือปฏิเสธได้ทันที"
              illustration={<ApprovalIllustration todayKey={todayKey} />}
            />
          </div>
        </Container>
      </section>

      {/* ─── คำถามที่พบบ่อย ─── */}
      <SectionRule />
      <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 py-24 md:py-32">
        <Container>
          <SectionIntro
            id="faq-title"
            title="คำถามที่พบบ่อย"
            description={
              <>
                คำตอบทุกข้อเป็นกฎเดียวกับที่ระบบใช้ตรวจ<span className="whitespace-nowrap">คำขอจองจริง</span>
              </>
            }
          />
          <div className="mt-12">
            <Faq />
          </div>
        </Container>
      </section>

      {/* ─── กล่องชวนจองท้ายหน้า ─── */}
      <SectionRule />
      <section aria-labelledby="cta-title" className="px-3 py-4">
        <div className="relative mx-auto max-w-[73.5rem] overflow-hidden rounded-hero bg-background shadow-(--shadow-card)">
          <div aria-hidden className="absolute inset-0 bg-board-grid" />
          <div className="relative flex flex-col items-center px-6 py-20 text-center md:py-28">
            <h2
              id="cta-title"
              className="text-heading font-bold tracking-[-0.01em] text-balance text-foreground md:text-display-md"
            >
              พร้อมจองห้องแล้วหรือยัง
            </h2>
            <p className="mt-4 max-w-[30rem] text-base text-muted-foreground md:text-lg md:leading-7">
              เปิดตารางห้องว่างของวันนี้ แล้วส่งคำขอได้ใน<span className="whitespace-nowrap">ไม่กี่คลิก</span>
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button render={<Link href={availabilityHref()} />}>
                ดูห้องว่างวันนี้
                <ChevronRightIcon data-icon="inline-end" />
              </Button>
              {signedIn ? (
                <Button variant="outline" render={<Link href="/my-reservations" />}>
                  การจองของฉัน
                  <ChevronRightIcon data-icon="inline-end" />
                </Button>
              ) : (
                <Button variant="outline" render={<Link href="/register" />}>
                  สมัครสมาชิก
                  <ChevronRightIcon data-icon="inline-end" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/** ปุ่มใต้หัวข้อของแต่ละส่วน */
function SectionActions() {
  return (
    <>
      <Button render={<Link href={availabilityHref()} />}>
        เริ่มจองห้อง
        <ChevronRightIcon data-icon="inline-end" />
      </Button>
      <Button variant="outline" render={<Link href="/rooms" />}>
        ดูห้องเรียนทั้งหมด
        <ChevronRightIcon data-icon="inline-end" />
      </Button>
    </>
  );
}

/** การ์ดขั้นตอน: เลขขั้น หัวข้อ คำอธิบาย และภาพประกอบที่ล้นขอบล่าง */
function Step({
  number,
  title,
  body,
  illustration,
}: {
  number: number;
  title: string;
  body: string;
  illustration: React.ReactNode;
}) {
  return (
    <li>
      <LandingCard className="h-[26.5rem]" illustration={illustration}>
        <span className="inline-flex h-6 items-center rounded-md bg-muted px-2 text-sm font-bold text-muted-foreground tabular-nums">
          {String(number).padStart(2, "0")}
        </span>
        <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
        <p className="mt-1.5 text-base text-muted-foreground">{body}</p>
      </LandingCard>
    </li>
  );
}

/** การ์ดจุดเด่น: หัวข้อ คำอธิบาย และภาพประกอบที่ล้นขอบล่าง */
function Feature({ title, body, illustration }: { title: string; body: string; illustration: React.ReactNode }) {
  return (
    <LandingCard className="h-[28.5rem]" illustration={illustration}>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-1.5 text-base text-muted-foreground">{body}</p>
    </LandingCard>
  );
}
