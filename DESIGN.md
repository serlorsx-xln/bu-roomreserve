---
name: RoomReserve
description: Thai classroom reservation tool built to the category standard, with Cal.com's neutral scheduling craft applied to rooms.
colors:
  primary: "hsl(221 39% 11%)"
  primary-foreground: "hsl(0 0% 100%)"
  background: "hsl(0 0% 100%)"
  canvas: "hsl(210 20% 97%)"
  muted: "hsl(220 14% 94%)"
  emphasis: "hsl(220 13% 91%)"
  foreground: "hsl(210 30% 4%)"
  body: "hsl(220 6% 25%)"
  muted-foreground: "hsl(220 9% 46%)"
  faint: "hsl(218 11% 65%)"
  border: "hsl(220 13% 91%)"
  input: "hsl(216 12% 84%)"
  border-strong: "hsl(218 11% 65%)"
  attention: "hsl(34 100% 92%)"
  attention-foreground: "hsl(15 79% 34%)"
  attention-border: "hsl(32 98% 83%)"
  success: "hsl(167 54% 93%)"
  success-foreground: "hsl(150 84% 22%)"
  error: "hsl(0 93% 94%)"
  error-foreground: "hsl(0 63% 31%)"
  destructive: "hsl(0 72% 51%)"
  now: "hsl(0 84% 60%)"
typography:
  display:
    fontFamily: "LINE Seed Sans TH, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: "2.125rem"
  headline:
    fontFamily: "LINE Seed Sans TH, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: "1.875rem"
  title:
    fontFamily: "LINE Seed Sans TH, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: "1.625rem"
  body:
    fontFamily: "LINE Seed Sans TH, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.375rem"
  label:
    fontFamily: "LINE Seed Sans TH, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1.125rem"
  marketing-display:
    fontFamily: "LINE Seed Sans TH, ui-sans-serif, system-ui, sans-serif"
    fontSize: "4rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  marketing-display-md:
    fontFamily: "LINE Seed Sans TH, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  marketing-display-sm:
    fontFamily: "LINE Seed Sans TH, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  marketing-heading:
    fontFamily: "LINE Seed Sans TH, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  marketing-lead:
    fontFamily: "LINE Seed Sans TH, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: "1.75rem"
rounded:
  sm: "3.6px"
  md: "4.8px"
  lg: "6px"
  xl: "8.4px"
  2xl: "10.8px"
  hero: "12px"
  card: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  section: "96px"
  section-lg: "128px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 14px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 14px"
    height: "36px"
  button-outline-hover:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.foreground}"
  button-secondary:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 14px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.emphasis}"
    textColor: "{colors.foreground}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.body}"
    rounded: "{rounded.lg}"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "32px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.body}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "36px"
  nav-item-active:
    backgroundColor: "{colors.emphasis}"
    textColor: "{colors.foreground}"
  status-pending:
    backgroundColor: "{colors.attention}"
    textColor: "{colors.attention-foreground}"
    rounded: "{rounded.md}"
    padding: "0 6px"
    height: "20px"
  status-approved:
    backgroundColor: "{colors.success}"
    textColor: "{colors.success-foreground}"
    rounded: "{rounded.md}"
    padding: "0 6px"
    height: "20px"
  status-rejected:
    backgroundColor: "{colors.error}"
    textColor: "{colors.error-foreground}"
    rounded: "{rounded.md}"
    padding: "0 6px"
    height: "20px"
  status-cancelled:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.md}"
    padding: "0 6px"
    height: "20px"
  slot-mine:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 8px"
  slot-pending:
    backgroundColor: "{colors.attention}"
    textColor: "{colors.attention-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 8px"
  slot-approved:
    backgroundColor: "{colors.emphasis}"
    textColor: "{colors.body}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 8px"
  slot-past:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.faint}"
  toast:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  calendar-day-bookable:
    backgroundColor: "{colors.emphasis}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
  calendar-day-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
  marketing-hero-card:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.xl}"
    width: "73.5rem"
  marketing-content-card:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.2xl}"
    padding: "24px"
  marketing-header-scrolled:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.xl}"
    height: "56px"
    width: "72rem"
  step-chip:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.muted-foreground}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 8px"
    height: "24px"
---

# Design System: RoomReserve

## Overview

**Creative North Star: "The Scheduling Standard"**

RoomReserve is the category standard for booking, executed at full craft: Cal.com's neutral scheduling system applied to university rooms. There is no metaphor and no brand flourish. White working surfaces sit on a cool off-white canvas, hairline gray borders do the structuring, text steps down through four grays, and a single near-black carries every primary action and every "this is yours" state. The quality bar is Cal.com, followed closely in conventions and craft, never in logo, name, imagery, or copy.

The product has two surfaces on one token set. The **app surfaces** (availability board, rooms, booker, my reservations, admin, auth) have the density of a working tool: the availability board at `/availability` is a bordered rooms by hours grid, the booker is a three-column scheduling layout, and lists are divided rows inside one bordered container. Everything is text-first Thai with LINE Seed Sans TH at two weights; hierarchy comes from weight, gray step, and position, never from color or decoration. All UI is built from shadcn/ui (Base UI variant) primitives restyled with these tokens.

The **marketing surface** (the landing page at `/`) follows the anatomy of Cal.com's homepage. It sits on the same Cool Canvas inside a 1200px frame of hairline guides. White cards carry Cal's ring-and-soft-shadow, headings are set large, and every piece of proof is the real product: a live month calendar for a real room, building names and room counts from the database, and booking rules read from constants. Its illustrations are inert arrangements of the app's own shadcn components, so what the page shows is what the app does.

Rejected on purpose: the generic dashboard (KPI cards, card grids of rooms, gradient heroes, icon-led navigation) and any novelty metaphor layered over booking.

**Key Characteristics:**
- White surfaces on a cool canvas, separated by hairline borders rather than shadows (app surfaces); ring-and-soft-shadow cards on the marketing surface.
- One near-black primary for actions, selection, "mine", and toasts.
- Four-step text grays; bold 700 is the only emphasis weight.
- Status legible in words and pattern, never color alone.
- Thai copy, Buddhist-era years, 24-hour tabular times.
- Marketing proof is real system data rendered through real components; never claims.

## Colors

A cool neutral scale with a single near-black voice, plus soft semantic tints that appear only on status.

### Primary
- **Ink Navy** (primary): the near-black of every solid button, the selected duration, day, and time, the user's own reservations on the board, the text-selection highlight, and the toast background. It never appears as decoration.

### Neutral
- **Paper White** (background): cards, the board, the booker, inputs, outline buttons.
- **Cool Canvas** (canvas): the app shell behind all content, the sidebar, building band rows in the board, list group headers, past hours and closed rooms, outline-button hover.
- **Muted Wash** (muted): ghost hover, tab-list track, secondary badges, the cancelled status, the secondary button fill, the segmented-control track, and step-number chips.
- **Emphasis Gray** (emphasis): active sidebar item, pressed toggles, avatar fill, count pills, the approved-by-others blocks on the board, bookable days in the month calendar, and the hover fill of secondary buttons.
- **Hairline** (border): every divider and container edge, and on the marketing surface the frame guides, section rules, and board-grid lines. **Field Stroke** (input) is one step darker for inputs, outline buttons, and free mobile slots. **Strong Edge** (border-strong) is the hover edge of outline buttons, the focus ring color, and the stroke of the "+" marks where marketing section rules cross the frame guides.
- **Text steps**: **Emphasis Ink** (foreground) for titles, room codes, and values; **Body Graphite** (body) for running text and nav; **Subtle Slate** (muted-foreground) for descriptions, labels, and grid headers; **Faint Slate** (faint) for disabled or past slot times only.

### Semantic
- **Attention Apricot** (attention / attention-foreground / attention-border): pending, in the status badge and as the striped pending block.
- **Mint** (success / success-foreground): the approved status badge.
- **Blush** (error / error-foreground): the rejected badge and inline form errors.
- **Signal Red** (destructive): destructive buttons and menu items. **Now Red** (now): the now-line on today's board and its dot, nothing else.

### Named Rules
**The One Ink Rule.** Ink Navy is the only saturated-dark fill in the product. If something is solid near-black, it is either an action, the user's selection, or the user's own booking.

**The Reservation Tone Rule.** On the availability board and booker: mine is solid Ink Navy, pending is Attention Apricot with diagonal stripes and an apricot hairline, approved (someone else's) is flat Emphasis Gray, and past or closed is flat Cool Canvas. Free is white with a Field Stroke edge. These four tones are fixed; do not add more.

**The Words-First Status Rule.** Every tone carries its label in text ("รออนุมัติ", "อนุมัติแล้ว", "การจองของคุณ"), and the board always shows a legend. Color and stripes reinforce the word; they never replace it.

## Typography

**Display Font:** LINE Seed Sans TH (with ui-sans-serif, system-ui fallback)
**Body Font:** LINE Seed Sans TH
**Label/Mono Font:** same family; monospace is not used in UI.

**Character:** One Thai-first humanist sans at Regular 400 and Bold 700, self-hosted via next/font. Line heights are opened up across the ramp so Thai upper vowels and tone marks never collide.

### Hierarchy
- **Display** (700, 1.5rem, 2.125rem): the room code heading in the booker; the largest text in the app.
- **Headline** (700, 1.25rem, 1.875rem): page titles in the page header.
- **Title** (700, 1rem, 1.625rem): section headings, booker pane titles, and the date trigger in the board toolbar.
- **Body** (400, 0.875rem, 1.375rem): the working size for nav, lists, buttons, fields, board room codes (at 700). Descriptions cap at roughly 42rem.
- **Label** (400, 0.75rem, 1.125rem): grid hour headers, metadata ("40 ที่นั่ง · ห้องบรรยาย"), legend, field captions, reservation block text.

The wordmark "RoomReserve" is Bold with tight tracking: 15px in the sidebar and mobile header, 1.125rem above the auth card, and 1.125rem (1.25rem from md) in the marketing header and footer.

### Marketing Steps
The marketing surface adds larger steps (`--text-display`, `--text-display-md`, `--text-display-sm`, `--text-heading`) in the same family at 700 with -0.01em tracking. Their line heights (1.2 to 1.25) stay open enough for Thai upper vowels and tone marks.
- **Marketing Display** (4rem, 1.2): the hero H1 from md; **Marketing Display Small** (2.5rem, 1.25) below md.
- **Marketing Display Medium** (3rem, 1.2): section titles and the closing CTA title from md; **Marketing Heading** (2rem, 1.25) below md.
- **Marketing Lead** (400, 1.125rem, 1.75rem): section and hero subtitles in Subtle Slate from md (Body-size 1rem below), and card titles at 700 in Emphasis Ink. Subtitles cap at 30-34rem and are centred under section titles.
- Card body text and FAQ answers use 1rem at 1.625rem line height in Subtle Slate.

These steps belong to the marketing surface. App pages keep Display (1.5rem) as their largest size.

### Named Rules
**The Two Weights Rule.** Only 400 and 700 exist. Emphasis is Bold or a darker gray step; there is no medium, semibold, or extra-bold.

**The Tabular Time Rule.** Every time, date number, count, capacity, and room code uses tabular figures. Times are 24-hour ("13:00–15:00 น."), years are Buddhist era ("2569"), and Thai weekday and month names come from the fixed tables in the format library, never from Intl, so server and client render identical text.

**The Thai Copy Rule.** All UI copy is Thai. The product name "RoomReserve" is the only English string by design.

**The Scoped Scale Rule.** The marketing steps (2rem and up) appear only on the marketing surface. An app page that needs a size above 1.5rem is a sign the page is doing marketing work.

## Layout

The app shell is a left sidebar (15rem, Cool Canvas, wordmark and subtitle at top, text-only nav, account menu or sign-in card at bottom) and a Cool Canvas inset. Below md the sidebar collapses to a sheet opened from a sticky 56px top bar holding the sidebar trigger and wordmark.

Pages sit in a centered container capped at 1240px (1000px for the rooms directory and admin queue) with 16px side and 24px top padding on phones, 32px on md and up. Every page opens with the same header: a Headline title, an optional Subtle Slate description, and right-aligned actions, 24px above content.

Spacing follows a 4px base: 4px and 6px inside controls and chip rows, 8px between controls, 12px and 16px inside rows, 20px and 24px inside panes and cards, 32px between page-level blocks. Rows are dense: board rows are 56px, the board header 40px, list rows 16px vertical padding.

Responsive behavior: the board becomes a per-building list on phones, each room with a six-column grid of 40px hour chips. The toolbar stacks below xl and filters pair into a two-column grid on phones. The booker is three columns at lg (17.5rem summary / fluid calendar / 16.5rem times), two at md, one on phones. URL-backed tabs become a 2x2 grid on phones.

### Marketing surface
- **Frame:** the whole page sits on Cool Canvas inside a centred frame `min(75rem, 100% - 1.5rem)` (1200px on desktop, 12px margins on phones). Hairline vertical guides run the full height of the page on both sides of the frame.
- **Section rules:** full-bleed 1px Hairline rules separate sections. Where a rule crosses a guide, a 17px "+" mark (two 9px Strong Edge strokes on a Cool Canvas square) sits on the crossing.
- **Content column:** section content is 1048px wide (a 69.5rem box with 32px side padding, 24px on phones), centred inside the frame.
- **Hero and CTA cards** are inset 12px within the guides (73.5rem max). The hero is a 27rem copy column beside the booker widget, stacking below lg; padding is 64px by 112px on desktop and 24px by 48px on phones.
- **Rhythm:** sections are 96px top and bottom (128px from md). Section intros are centred with title, subtitle, and an optional pair of actions (primary plus outline), 56px above their card grid. Card grids use a 14px gap: three step cards (26.5rem tall) and a 2x2 of feature cards (28.5rem tall), a single column below md.
- **Header:** sticky, 56px tall, 8px from the top, 72rem max. It is transparent at the top of the page and becomes a floating white bar with a Hairline border and the card shadow once the page scrolls past 8px (a 300ms ease-out transition). Wordmark on the left, four text links centred, the account link and a small primary button on the right. Below md, the links and account link move into a ghost "เมนู" dropdown next to the primary button.
- **Buildings strip:** a one-line row between two section rules that lists real building names (Lead, 700, Emphasis Ink at 70%) with room counts in Subtle Slate. It sits where Cal.com places its logo strip.
- **Footer:** below a final section rule, inside the frame. On the left, the wordmark, a one-sentence description, and a Faint Slate course line with the Buddhist-era year. On the right, three link columns with Bold headings.

**The State-in-the-URL Rule.** Date, building, capacity, equipment, and tab selections live in the query string so every view is linkable and the back button works.

## Elevation & Depth

Depth is tonal and linear first. On app surfaces, surfaces are flat white on a canvas, separated by 1px hairlines, and containers carry no resting shadow; shadows exist only on things you press and on things that float. The marketing surface adds one container shadow, the card ring, and uses it for every white card and for the scrolled header.

### Shadow Vocabulary
- **Solid button lift** (`--shadow-button-solid`, with `-hover` and `-active` variants): a near-flat outer edge (two 1-2px drops at 6-10%) plus a faint inner top highlight and inner bottom shade, so the near-black button reads as barely raised rather than floating; on press it inverts to an inset shadow. There is no wide outer drop.
- **Outline button whisper** (`--shadow-button-outline`): a 3% drop under outline buttons and outline toggles.
- **Floating layer** (`--shadow-dropdown`): the toast; popovers, selects, and menus keep the shadcn defaults at similar softness.
- **Active segment** (`--shadow-elevation-low`): the selected item of a segmented control (the hero's duration picker), lifting the white pill off its Muted Wash track.
- **Card ring** (`--shadow-card`, marketing surface only): a 1px ring at 8% plus a tight bottom edge and a 4px by 8px soft drop at 5%. Used on hero, CTA, step, feature, and FAQ cards, on the scrolled header, and on the one focal item inside an illustration.

### Named Rules
**The Flat Container Rule (app surfaces).** On app surfaces, cards, the board, the booker, and lists never take a shadow. A bordered white box on canvas is the container. The marketing surface is exempt; its cards carry the card ring instead of a border.

**The Pressable Lift Rule (app surfaces).** On app surfaces only buttons get lift. If it is not clickable, it is not raised. On the marketing surface the card ring is the only shadow on non-interactive surfaces.

**The One Container Shadow Rule (marketing).** Marketing cards use `--shadow-card` and nothing else: no border on the card, no stacked or colored shadows, no hover lift.

## Shapes

Gently rounded, consistent corners from a 6px base radius. Containers, buttons, inputs, selects, and the sidebar items use 6px; reservation blocks, badges, small buttons, and hour chips use 4.8px; the legend swatches use a 3px corner. The only full circles are avatars, the now-line dot, and the 4px today dot in the month calendar. Borders are always 1px; dashed 1px borders mark taken or empty slots in the booker. Stripes at 135 degrees are the one app pattern, reserved for pending.

The marketing surface steps up the radius. Hero and CTA cards and the scrolled header use 12px (`rounded-hero`, token `--radius-hero`); step, feature, and FAQ cards use 16px (`rounded-card`, token `--radius-card`), matching the Cal.com homepage. Illustration windows and the hero booker widget keep the 6px app radius. Illustrations are clipped by their card, and a window may bleed off the card's right or bottom edge. The only marketing pattern is the board grid: 1px Hairline lines on a 5rem by 3.5rem cell, masked by a radial ellipse that clears the centre. It appears only behind the closing CTA.

## Components

### Buttons
Quiet, tactile, and small.
- **Shape:** 6px corners; 36px default height, 32px small, 28px extra-small (those two at 4.8px corners).
- **Primary:** Ink Navy with white text and the solid button lift; hover drops to 92% fill and a stronger lift; active presses inward. Used once per region for the committing action ("ส่งคำขอจอง", "เข้าสู่ระบบ").
- **Outline:** white with a Field Stroke edge and the outline whisper; hover shifts to Cool Canvas with a Strong Edge. The default for toolbar actions, day paging, and time slots (time slots darken their edge to Emphasis Ink on hover).
- **Secondary:** Muted Wash fill with Emphasis Ink text, no shadow; hover deepens to Emphasis Gray. Used as the full-width second action in the marketing hero ("สมัครสมาชิกด้วยอีเมล ›").
- **Ghost:** Body Graphite text, Muted Wash on hover. Used for back or cancel, the date popover trigger, and the marketing header links (which drop the hover fill and only darken the text).
- **Chevrons:** a trailing chevron-right marks a link that leaves for another page ("สมัครสมาชิก ›", "เริ่มจองห้อง ›"); chevron-down marks the mobile "เมนู" dropdown.
- **Focus:** a 3px ring in Strong Edge at 50% opacity.
- **Links as buttons:** rendered through Base UI's `render` prop, never `asChild`.

### Toggles and Selects
- Equipment filters are an outline toggle group; pressed state is Emphasis Gray with a Strong Edge. In the booker the duration toggles select to solid Ink Navy, following the One Ink Rule.
- Selects share the 36px outline field look in toolbars.
- The marketing hero's duration picker is a segmented control: a Muted Wash track with 4px padding and 6px corners, 28px items with 4.8px corners in Subtle Slate, and the selected item white in Emphasis Ink with the active-segment shadow.

### Status Badges
20px tall, 4.8px corners, Bold label text, a tint and matching dark text per status: pending apricot, approved mint, rejected blush, cancelled muted. Secondary gray badges with Regular text list room attributes.

### Cards / Containers
- **Corner Style:** 6px.
- **Background:** Paper White on Cool Canvas.
- **Shadow Strategy:** none on app surfaces (Flat Container Rule); marketing cards use `--shadow-card`.
- **Border:** 1px Hairline; internal rows divided by Hairline.
- **Internal Padding:** 20px x 16px for list rows, 20-24px for panes.
- Group headers inside a container are a Cool Canvas band with Bold Label text in Subtle Slate.

### Inputs / Fields
- **Style:** 1px Field Stroke, transparent fill, 6px corners, Body size, Subtle Slate placeholder. Fields are stacked with the label above and a Label-size hint below.
- **Focus:** Strong Edge border plus the 3px ring.
- **Error / Disabled:** destructive border with a faint red ring; form-level errors are a Blush band with Blush-dark text. Disabled drops to 50% opacity.

### Navigation
Text-only sidebar nav at Body size in Body Graphite; hover and active fill Emphasis Gray, active text Emphasis Ink. The admin queue item carries a count pill (white, hairline ring, 4.8px corners). URL tabs use the shadcn tab list on Muted Wash with a white active tab.

### Toast
Ink Navy, white text, bottom-center, 12px by 16px padding, the floating layer shadow, no status icons (a spinner only while loading). Messages are words.

### Availability Board (signature)
A bordered rooms by hours grid for one day: a sticky 11.5rem room column (code in Bold, capacity and type in Label), twelve equal hour columns from 08:00 to 19:00, a Cool Canvas band per building. Free cells are white and reveal their hour in Subtle Slate on hover or focus, linking straight into the booker at that slot. Reservations span their hours as 4.8px blocks inset by 4px, showing purpose in Bold and time plus status in Label, with a tooltip for the full detail; finished reservations fade to 55%. Closed rooms collapse into one Cool Canvas row stating why. A 2px Now Red line with a 10px dot marks the current time on today. A legend above the grid names every tone.

### Booker (signature)
Cal.com's three-column booker: a summary pane (room code in Display, attributes as label/value pairs, duration toggles, the chosen date and time in Bold), a month calendar with 6px day cells (bookable days filled Emphasis Gray with Emphasis Ink numerals and a thin ink ring on hover, the chosen day solid Ink Navy, unbookable days as bare Subtle Slate numerals, today marked by a 4px dot, and the first of a month carrying its short month name), and a scrolling list of 40px outline time buttons where taken times appear as dashed rows with a reason. Choosing a time replaces the right two columns with the request form. Panes enter with a 200ms fade and a small slide.

### Marketing Cards (marketing surface)
- **Hero and CTA cards:** Paper White, 12px corners, the card ring, no border, clipped. The CTA centres a Marketing Display Medium title, a Lead subtitle, and a primary plus outline pair over the board-grid pattern.
- **Content cards (steps and features):** Paper White, 16px corners, the card ring, fixed height. Text sits at the top with 24px padding (a Lead title at 700, then 1rem Subtle Slate body). Below it, an illustration fills the rest of the card and bleeds off the bottom or right edge.
- **Step chip:** only on the three step cards, where order matters. The zero-padded number ("01") is Bold Body-size in Subtle Slate on a 24px Muted Wash chip with 4.8px corners and tabular figures.
- **FAQ:** one 48rem card with the card ring and 16px corners, holding a shadcn accordion. Questions are 1rem Bold Emphasis Ink with 20px vertical padding and no hover underline; answers are 1rem Subtle Slate capped at 40rem, their numbers read from the booking constants.

### Illustrations (marketing surface)
Illustrations are inert, unselectable compositions of the real components: outline and primary buttons, inputs, selects, tabs, status badges, reservation rows, and mini board cells in the four reservation tones. Each sits in a 6px-cornered white window with a Hairline border. Room codes, hours, and rules match the seed data and constants. At most one element per illustration takes the card ring to mark the focal item.

### Hero Booker (marketing signature)
A two-pane widget (15.5rem room pane beside the shared month calendar, 44rem wide from md, 6px corners, Hairline border) that bleeds off the hero card's right edge on desktop, with the month paging hidden there. The room pane shows building, room code (1.25rem Bold, tabular), type and equipment, the duration segmented control, and two label/value facts. Changing the duration recomputes which days are bookable. Clicking a day opens that room's booker with the date and duration. A Subtle Slate caption below explains the gray days.

## Do's and Don'ts

### Do:
- **Do** build every control from the shadcn/ui primitives in the project, restyled only through these tokens.
- **Do** use LINE Seed Sans TH at 400 and 700 only, with the opened Thai line heights.
- **Do** keep Ink Navy for actions, selection, "mine", and toasts, and keep the four reservation tones exactly as defined.
- **Do** pair every status color or pattern with its Thai word.
- **Do** use tabular figures, 24-hour times, Buddhist-era years, and the fixed Thai name tables for dates.
- **Do** separate with 1px hairlines on white over canvas on app surfaces; reserve shadow there for buttons and floating layers.
- **Do** give every marketing card the card ring (`--shadow-card`) and the scoped radius: 12px for hero and CTA (`rounded-hero`), 16px for content cards (`rounded-card`).
- **Do** keep marketing content inside the 1200px frame and the 1048px column, with full-bleed section rules and "+" marks at the guides.
- **Do** build marketing proof from real data (a real room, buildings, counts, constants) and draw illustrations from the real shadcn components, marked inert.
- **Do** use numbered step chips only where the sequence matters.

### Don't:
- **Don't** add icons beyond chevrons, the sidebar trigger, and the functional marks shadcn primitives carry internally (check, close, spinner). No label icons, no icon-led nav, no emoji.
- **Don't** use weights other than 400 and 700, or any other typeface.
- **Don't** introduce KPI cards, room card grids, color gradients, or decorative color. The Hairline board-grid pattern behind the marketing CTA is the one exception, and it stays there.
- **Don't** shadow a container or card on app surfaces.
- **Don't** put eyebrow or kicker pills above headings on any surface.
- **Don't** add testimonials, logo strips, invented statistics, or claims to the marketing surface; if the database or constants cannot back it, it does not ship.
- **Don't** use the marketing type steps (2rem and up) or the marketing radii on app surfaces.
- **Don't** format Thai dates with Intl or toLocale APIs in rendered UI.
- **Don't** show the author's personal name anywhere in the UI, copy, or metadata.
- **Don't** copy Cal.com's logo, name, imagery, or copy.
