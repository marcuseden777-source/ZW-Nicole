# Zhi Wei & Nicole

An invitation that becomes a keepsake.

A digital wedding invitation built as a real object: a sealed cream envelope
with the couple's initials pressed into oxblood wax, rendered in WebGL, that
breaks open as the page is read. After the wedding, one word in one file turns
the whole thing into the permanent memory of the day.

**Sunday, 11 October 2026 · Sofitel Singapore City Centre**

---

## The two lives

The site is written once and lives twice.

| | `invitation` | `keepsake` |
|---|---|---|
| Hero | Sealed envelope, breaks open on scroll | Unchanged |
| Middle | Arch, couple, celebrations, timeline | Unchanged |
| Then | Schedule → countdown → venue → Q&A → RSVP | Photo gallery → guest messages → schedule → venue |
| Closing | "We cannot wait to celebrate with you." | "Thank you for standing with us…" |

Switch between them either by editing `phase` in `content/wedding.ts`, or by
setting `NEXT_PUBLIC_PHASE` in the hosting dashboard — no code change, no
redeploy of anything but the environment variable.

## Editing the invitation

**Everything lives in one file: [`content/wedding.ts`](content/wedding.ts).**

Names, the date, the schedule, their story, the venue and directions, the
questions guests ask, the photographs, the wax colour — all of it, heavily
commented, with no code anywhere near it.

The couple's phone numbers are deliberately **not** in the repository. The
`contacts` block is there with `enabled: false` and empty fields; fill it only
if this is going somewhere private, or leave guests to the Joy page.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # strict, and currently clean
```

## Where RSVPs go

Replies are collected on the couple's own Joy page. The RSVP section is a
single clear invitation to go there, set by `rsvp.url` in
`content/wedding.ts` — deliberately not a second form asking the same guest
the same questions and splitting the headcount across two places.

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
