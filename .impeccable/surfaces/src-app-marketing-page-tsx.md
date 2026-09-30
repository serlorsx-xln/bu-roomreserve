---
version: 1
slug: "src-app-marketing-page-tsx"
primary_target: "src/app/(marketing)/page.tsx"
related_targets: ["src/components/landing","src/app/(marketing)/layout.tsx"]
---

## Scope

Landing page at `/` (Persuade mode): `src/app/(marketing)/page.tsx`, its layout, and `src/components/landing/*`. The availability board moved to `/availability`; the app surfaces keep their own brief.

## Audience and action

Students, teachers and staff opening the site for the first time, and a CS430 grader. They should understand in one viewport that this is a classroom booking system (see free hours → request → admin approves), then go to `/availability` or `/register`. Proof comes from real system data only: a real room's live calendar, real buildings, and the booking rules from constants. No testimonials, logos, stats or invented claims (PRODUCT.md).

## Direction contract

THESIS: Cal.com's homepage anatomy carried over to room booking. The proof is a live booker for a real room, not claims. It refuses testimonial walls, logo strips, stat heroes and icon-tile feature grids.

OWN-WORLD: The app's Cal-neutral tokens:
- the hsl(210 20% 97%) canvas;
- white cards with 12px (hero, CTA) and 16px (content) radii, carrying Cal's ring + soft shadow (`--shadow-card`);
- a 1200px frame of hairline vertical guides, with "+" marks where the full-bleed section rules cross them;
- near-black primary buttons with the inset button shadow, and chevrons as the only icons;
- LINE Seed Sans TH: 700 display at 64/48px (40/32 on mobile) with Thai line-height 1.2–1.25, 400 body.

STORY: The visitor reads the offer, tries the real room's calendar (changing the duration changes which days are bookable), and clicks a day into the real booker. They then scan three steps, four features drawn from the real UI (including a settings-style rules card), the FAQ answered from the real rules, and a closing CTA over a faint board grid.

FIRST VIEWPORT:
- **Header:** a transparent header (wordmark left, four text links centred, เข้าสู่ระบบ plus a dark สมัครสมาชิก › button on the right). It morphs into a floating white bordered bar on scroll.
- **Hero card:** white, inset 12px within the guides.
  - Left, in a 27rem column: H1 "วิธีที่ง่ายกว่า / ในการจองห้องเรียน", a muted subtitle, a full-width dark "ดูห้องว่างวันนี้" button, a full-width gray "สมัครสมาชิกด้วยอีเมล ›" button, and a note.
  - Right: the real-room booker widget (room meta, 1–4 ชม. segmented control, month calendar with gray bookable days), bleeding off the card's right edge.

FORM: Category standard (canon): the Cal.com homepage, pinned by the user ("ทำหน้า landing เหมือนกับ cal.com", quality bar Cal.com pixel to pixel). The surface is built inside the established world; there was no concept roll because the brief is pinned.
- Signature interaction: the duration toggle recomputes bookable days live, and a day click opens `/rooms/[id]?date&duration`.
- Motion: the header's transparent → floating bar transition (300ms ease-out).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
