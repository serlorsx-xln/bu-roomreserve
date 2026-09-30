---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/rooms","src/app/my-reservations","src/app/admin","src/app/login","src/app/register"]
---

## Scope

Whole app, Operate mode: availability board (/), rooms directory (/rooms), room booker (/rooms/[id]), reservation detail (/reservations/[id]), my reservations (/my-reservations), admin approvals (/admin), login/register.

## Audience and task

Students, teachers, staff find a free room for a given day and hours and send a request; an admin approves or rejects. Frequent, short sessions; desktop and phone.

## Direction contract

THESIS: A room-booking tool that looks exactly like the category's best, not like a template: Cal.com's scheduling craft applied to rooms. Refuses the generic dashboard (KPI cards, card grids of rooms, blue gradient hero, icon-soup nav).

OWN-WORLD: Cal.com's neutral system verbatim: white surfaces on a hsl(210 20% 97%) canvas, hairline hsl(220 13% 91%) borders, text in 4 steps (emphasis / default / subtle / muted), near-black hsl(221 39% 11%) primary with the soft inset button shadow, 6px radii, available days as filled gray cells, selected as solid black. LINE Seed Sans TH at 400/700 only. Text-first: icons only for chevrons, no emoji.

STORY: The visitor sees today's rooms and taken hours at once, picks a free hour or a room, confirms purpose and headcount, and gets a clear "รออนุมัติ" receipt. Admin clears a queue of pending requests with approve/reject.

FIRST VIEWPORT: Left sidebar (wordmark, text nav, user at bottom). Main: page title "ห้องว่าง" + subtitle, toolbar row (today, prev/next, date popover, building, capacity, equipment toggles), legend, then a bordered rooms x hours grid (rooms as sticky left column grouped by building, 08:00-20:00 columns, now-line). Free cells invite a click that opens the booker at that slot.

FORM: Category standard (canon), taken on re-roll round 1; not on the ordered list. Seed key 10565bcf.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
