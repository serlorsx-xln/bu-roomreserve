# bu-roomreserve

A university classroom reservation system where students, teachers, and staff browse room availability by day, submit booking requests, and an admin approves or rejects each one.

## Why it exists

This is coursework for a Database Systems class (CS430), submitted alongside an ER Diagram and a relational schema deliverable. Every table in the SQLite database (`faculties`, `users`, `buildings`, `rooms`, `reservations`, `cancellations`) matches that submitted schema exactly, and every screen in the app maps to a real table or relationship — so the app doubles as a working demonstration of the data model. The UI is entirely in Thai.

```
User                        Admin
 │  browse /availability      │
 │  pick room + free hour     │
 │  submit request ───────────┼──► PENDING queue     room: AVAILABLE → RESERVED
 │                            │    approve / reject
 │  see status:               ▼
 └── PENDING → APPROVED / REJECTED / CANCELLED (+ cancellation slip)
                                    room: RESERVED → AVAILABLE on cancel / reject
```

## Data model

| Table | Primary key | Holds |
|---|---|---|
| `faculties` | `faculty_id` | Faculties, chosen from a list at sign-up |
| `users` | `user_id` (10-digit student/staff ID) | Accounts; the ID is also the login. FK `faculty_id` |
| `buildings` | `building_id` | Buildings |
| `rooms` | `room_code` (e.g. `A1-101`) | Rooms; `status` is AVAILABLE / RESERVED / MAINTENANCE |
| `reservations` | `reservation_id` | Reservation slips: `room_code`, `reserved_by`, `approved_by`, `decided_at` |
| `cancellations` | `cancellation_id` | Cancellation slips: `reservation_id` (UNIQUE), `cancelled_by`, `reason`, `cancelled_at` |

The full DDL is in `sql/schema.sql`; every query is hand-written SQL in `src/lib/db.ts`.
`rooms.status` is kept in sync by one SQL `UPDATE … CASE WHEN EXISTS(…)` that runs inside the same
transaction as each booking, cancellation, and rejection; MAINTENANCE is set only by an admin.

## Features

- Room availability grid (rooms x hour slots) for a chosen day; taken hours are unselectable, so conflicting requests are prevented before submit, not rejected after.
- Booking rules enforced in both UI and API: bookable hours 08:00–20:00, 1-hour slots, duration up to 4 hours, up to 14 days ahead, no past bookings, attendees may not exceed room capacity.
- Requests never overlap an existing PENDING or APPROVED booking of the same room (writes use `BEGIN IMMEDIATE` transactions so concurrent requests cannot double-book).
- Every reservation requires admin approval (PENDING → APPROVED / REJECTED). Owners can cancel their own PENDING or APPROVED bookings, and an admin can cancel anyone's. Each cancellation writes a row to `cancellations` recording who cancelled, when, and why. PENDING requests that pass their end time display as "expired".
- Room management for admins: create/edit/delete buildings and rooms (type, capacity, projector, whiteboard, maintenance on/off). Rooms under MAINTENANCE are not bookable.
- Roles: STUDENT (default for new sign-ups), TEACHER, STAFF, ADMIN. All non-admin roles book with equal priority.
- Registration (10-digit user ID, faculty from a list) and login by user ID, with bcrypt-hashed passwords and Zod-validated API inputs.
- Time stored as ISO 8601 text in Asia/Bangkok time.

## Pages

| URL | Purpose | Access |
|---|---|---|
| `/` | Landing page with intro, sample calendar, FAQ | Public |
| `/availability` | Availability grid; click a free hour to book | Public to browse, sign-in to book |
| `/rooms` , `/rooms/[code]` | Room list with status, and the booking page for one room | Public |
| `/my-reservations` | Own bookings and their statuses | Signed-in |
| `/reservations/[id]` | Reservation slip, plus the cancellation slip if cancelled | Owner or ADMIN |
| `/admin` | Pending queue, all reservations, and cancellation slips | ADMIN |
| `/admin/rooms` | Building/room management | ADMIN |

## API

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Sign up (role STUDENT) |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| POST | `/api/reservations` | Create booking request (status PENDING) |
| PATCH | `/api/reservations/[id]` | Cancel (owner or ADMIN, optional reason), or approve/reject as ADMIN |
| POST / PATCH / DELETE | `/api/admin/rooms` | Insert / update / delete buildings and rooms (ADMIN) |

## Requirements

- Node.js 22.13+ (the app and scripts use the built-in `node:sqlite` module; the Docker image uses Node 24)
- No external database server — SQLite is a single file

## Usage (local development)

```bash
npm install          # install dependencies
npm run db:setup     # create tables from sql/schema.sql and seed demo data (scripts/seed.mjs)
npm run dev          # run at http://localhost:3000
```

`npm run db:reset` wipes and recreates the database with fresh seed data (seed reservations are generated relative to the current date). `npm run typecheck` and `npm run lint` are also available.

### Demo accounts

Sign in with the 10-digit user ID. All seeded accounts share the password `password123`.

| Role | User ID |
|---|---|
| Admin | 5000000001 |
| Teacher | 5100000001 |
| Staff | 5200000001 |
| Student | 1650012345 |

## Deploy (Docker)

The repo includes a multi-stage `Dockerfile` (Next.js standalone output, non-root user) and a `coolify.yaml` for deployment on Coolify. The container seeds demo data on first start (only when the database is empty; a database left over from the older 4-table schema is rebuilt) and then starts the server on port 3000. The SQLite file lives in a `/app/data` volume so it survives container recreation.

```bash
docker build -t bu-roomreserve .
docker run -p 3000:3000 -v roomreserve-data:/app/data bu-roomreserve
```

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_PATH` | `prisma/dev.db` (local) / `/app/data/dev.db` (Docker) | SQLite file location |
| `COOKIE_SECURE` | unset | Set `true` to send the session cookie only over HTTPS |
| `TZ` | `Asia/Bangkok` (Docker) | Timezone for date handling |
| `NODE_ENV` | `production` (Docker) | Standard Node environment |

## Security notes

- Passwords are hashed with bcrypt; only the hash is stored.
- All SQL uses prepared statements with `?` parameters — no string concatenation of user input.
- The session is a plain, unsigned cookie holding the user ID (httpOnly, SameSite=Lax, 7-day expiry). The code itself notes this is educational, not production-grade auth; a real deployment should use signed sessions (e.g. NextAuth or iron-session).
- Demo seed data uses fictional accounts only.

## License

No license file is present in this repository; all rights are reserved by the repository owner.
