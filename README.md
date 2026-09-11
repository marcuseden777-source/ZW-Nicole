# A Wedding Invitation That Becomes a Keepsake

A digital wedding invitation built as a real object: a sealed cream envelope
with the couple's initials pressed into oxblood wax, rendered in WebGL, that
breaks open as the page is read. After the wedding, one word in one file turns
the whole thing into the permanent memory of the day.

---

## The two lives

The site is written once and lives twice.

| | `invitation` | `keepsake` |
|---|---|---|
| Hero | Sealed envelope, breaks open on scroll | Unchanged |
| Middle | Arch, couple, celebrations, timeline | Unchanged |
| Then | Countdown → venue → RSVP | Photo gallery → guest messages → venue |
| Closing | "We cannot wait to celebrate with you." | "Thank you for standing with us…" |

Switch between them either by editing `phase` in `content/wedding.ts`, or by
setting `NEXT_PUBLIC_PHASE` in the hosting dashboard — no code change, no
redeploy of anything but the environment variable.

## Editing the invitation

**Everything lives in one file: [`content/wedding.ts`](content/wedding.ts).**

Names, dates, venues, the timeline, the celebrations, the photographs, the
verse, the closing dua, the wax colour — all of it, heavily commented, with no
code anywhere near it. Nothing else needs to be touched to make this a real
couple's invitation.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # strict, and currently clean
```

## Where RSVPs go

There is no database. `app/api/rsvp/route.ts` validates each reply and forwards
it to whatever `RSVP_WEBHOOK_URL` points at — a Google Sheet, Zapier, Make,
n8n, Formspree. Set `RSVP_RESEND_API_KEY` / `RSVP_EMAIL_FROM` / `RSVP_EMAIL_TO`
and each reply is emailed too.

With nothing configured, replies are logged server-side and the guest still
gets a warm confirmation — a missing environment variable can never make
someone feel their reply was refused. Copy `.env.example` to `.env.local` to
begin.

## How it holds up

**The 3D is never a requirement.** `lib/useCapability.ts` measures each visitor's
device. Without WebGL2, on a software renderer, or when the guest has asked
their system for reduced motion, the envelope is rendered in CSS and SVG
instead — and it still opens on scroll. Nobody is handed the lesser invitation.

**Nothing is fetched at runtime.** The embossing, the paper tooth, the wax
relief and the petals are all drawn procedurally in `lib/textures.ts`, and the
fonts are self-hosted at build time. No environment maps, no font CDN, no
tracking. The invitation opens the same on hotel wifi as on fibre.

**It is built to be read by everyone.** Semantic landmarks and headings, a skip
link past the envelope, labelled form controls, live regions on the RSVP,
`prefers-reduced-motion` honoured throughout, gold-filled controls darkened to
clear WCAG AA contrast, and a print stylesheet for the day she wants it on
paper.

**It is built to be shared.** `app/opengraph-image.tsx` generates the card
people see when the link lands in a WhatsApp thread, from the same content file
as the page, so it can never drift out of date. `Event` structured data tells
search engines and assistants what this actually is. The page is set
`noindex` by default — a private celebration — which is one line to change in
`app/layout.tsx`.

## Adding the photographs

Drop files into `public/gallery/`, then list them in the `gallery` array in
`content/wedding.ts`. An empty gallery renders a considered "coming soon" card
rather than breaking, so the switch to `keepsake` is safe at any time.

## Deploying

Push to Vercel and set `NEXT_PUBLIC_SITE_URL` to the real domain — share
previews and structured data both read it.

---

Built by [Movara Solutions](https://www.movarasolutions.com).
