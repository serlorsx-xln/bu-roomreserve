# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

All campus roles use the same booking surface with equal priority:

- **Students** — book rooms for group work, tutoring, club meetings.
- **Teachers** — book rooms for make-up classes, exams, seminars.
- **Staff** — book meeting rooms for departmental work.
- **Admin** — reviews every request and approves or rejects it.

The job every non-admin user shares: "find a room that is free at the time I need, with enough seats and the equipment I need, and request it."

## Product Purpose

A university classroom reservation system (Thai-language UI). Users browse rooms by building, see which hours are already taken on a given day, and submit a booking request. An admin approves or rejects each request. Success: a user can go from "I need a room tomorrow 13:00–15:00 for 30 people" to a submitted request in under a minute, and never submits a request that collides with an existing booking.

It is also coursework for a Database Systems course: the code must stay clean, readable, and easy to explain, and the data model must match the submitted ER Diagram and Tables.

## Positioning

Built directly on the course's own ER model (BUILDING, ROOM, USER, RESERVATION, with the APPROVES relationship). Every screen maps to a real table or relationship, so the app doubles as a working demonstration of the schema.

## Operating Context

- Used on desktop (teachers, staff, admin) and phones (students between classes).
- Requests are made days in advance, checked against the day's existing bookings.
- The admin works through a queue of pending requests.

## Capabilities and Constraints

- Booking hours: **08:00–20:00**, in **1-hour slots**. Book up to **14 days ahead**; no bookings in the past.
- **Every reservation needs admin approval** (status PENDING → APPROVED / REJECTED). Owners (or an admin) can cancel PENDING or APPROVED bookings (CANCELLED); every cancellation writes a row to `cancellations` (ใบยกเลิก) recording who cancelled, when and why.
- A request may not overlap a PENDING or APPROVED booking of the same room.
- Attendees may not exceed room capacity. Rooms with status MAINTENANCE are not bookable. Room status is stored in `rooms.status` and synced by the system: AVAILABLE (ว่าง) ↔ RESERVED (ถูกจอง, has an active PENDING/APPROVED booking); cancelling or rejecting switches it back.
- Room attributes: code, building, capacity, type (lecture / lab / seminar / meeting), projector, whiteboard, status.
- Roles: STUDENT, TEACHER, STAFF, ADMIN. New sign-ups are STUDENT. Users sign in with a 10-digit `user_id` (student/staff ID, the PK) and choose a faculty from `faculties`.
- Stack (existing): Next.js 16 App Router, shadcn/ui (base-ui variant, `render` prop instead of `asChild`), Tailwind v4, SQLite via node:sqlite with hand-written SQL (`sql/schema.sql`, `src/lib/db.ts`), zod, bcryptjs, cookie session (educational, not production auth).
- `sql/schema.sql` mirrors the submitted ER Diagram / Tables (6 tables, revised 2026-10-02 after teacher feedback). Any schema change must also update those coursework documents.

## Brand Commitments

- Product name in UI: **RoomReserve**.
- Font: **LINE Seed Sans TH** (self-hosted; available weights 400, 700, 800 only).
- UI components: **shadcn/ui only** — no other component library.
- **Minimal icons and no emoji.** Communicate with words, numbers, and layout.
- Do **not** show the project author's (the student's) personal name or student ID anywhere in the UI or seed data. Signed-in users seeing their own (fictional demo) account name is expected.
- Language: Thai for all UI copy.
- **Visual direction: the category standard, executed at full craft.** The user chose the conventional room-booking form on purpose (direction round, 2026-09-30) over bespoke metaphors. No smuggled quirks or novelty metaphors.
- **Quality bar: Cal.com**, studied closely ("pixel to pixel", per the user): neutral gray scale, hairline borders, the three-column booker, restrained black primary. Match its craft level and conventions; never copy its logo, name, imagery, or copy.

## Evidence on Hand

- Seed data (`scripts/seed.mjs`): 13 faculties, 8 buildings, 45 rooms (one under maintenance), 7 demo users (admin 5000000001, teachers, staff, students; password `password123`), 60 reservations relative to today covering every status, 3 with cancellation slips.
- No real usage data, testimonials, or institutional branding. Do not invent a university name, logo, statistics, or claims.

## Product Principles

1. **Availability first.** The answer to "is it free?" must be visible before any form is opened.
2. **Prevent conflicts, don't report them.** Taken hours should be unselectable, not rejected after submit.
3. **Status is always legible.** Pending, approved, rejected, cancelled must be distinguishable at a glance and in words, never by color alone.
4. **Explainable by the schema.** Each screen should be traceable to the tables and relationships it reads and writes.

## Accessibility & Inclusion

- Status and availability must not rely on color alone (text labels or patterns as well).
- Full keyboard operation of booking and approval; visible focus.
- Tabular, readable times (24-hour Thai format).
