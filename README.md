# Zhi Wei & Nicole

An invitation that becomes a keepsake.

**Sunday, 11 October 2026 · Sofitel Singapore City Centre**

A sealed cream envelope holds the door. Tap it: the wax breaks, the letter
blooms open, and it clears away to the film behind. After the wedding, one
word in one file turns the whole thing into the memory of the day.

---

## Editing it

**Everything lives in one file: [`content/wedding.ts`](content/wedding.ts).**

Names, the date, the schedule, their story, the venue and how to get there,
the questions guests ask, the photographs, the colour of the wax. Heavily
commented, with no code anywhere near it. Change a value, save, done.

## The two lives

| | `invitation` | `keepsake` |
|---|---|---|
| Door | Sealed envelope | Unchanged |
| Hero | The film, their names across it | Unchanged |
| Middle | Invitation, their story | Unchanged |
| Then | Schedule → countdown → venue → questions → RSVP | Photographs → guest messages → schedule → venue |
| Closing | "We cannot wait to celebrate with you." | "Thank you for standing with us…" |

Switch by editing `phase` in `content/wedding.ts`, or by setting
`NEXT_PUBLIC_PHASE` in the hosting dashboard — no code change, no redeploy of
anything but a variable.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run typecheck  # strict, and clean
```

Deploying: see [DEPLOY.md](DEPLOY.md). Adding the generated films: see
[ASSETS.md](ASSETS.md).

## Where RSVPs go

To the couple's own Joy page, set by `rsvp.url`. Deliberately a link and not
a second form — two forms asking the same guest the same questions split the
headcount across two places and neither is right.

Their phone numbers are deliberately **not** in this repository. The
`contacts` block ships disabled with empty fields; fill it only if this is
going somewhere private.

## How it holds up

**The door is a gift, never a wall.** It is mounted only on the client, over a
page that is already complete in the HTML — so a crawler, a link-preview bot
and a guest with JavaScript off get the invitation and never meet a gate. If
the door throws, an error boundary removes it and releases everything. A guest
who asked their system for reduced motion never sees it at all. A deep link, a
back navigation or a reload partway down goes straight through.

**The 3D is never a requirement.** `lib/useCapability.ts` measures each
device. Without WebGL2, on a software renderer, or under reduced motion, the
envelope is rendered in CSS and SVG — and still opens. three.js sits in a lazy
chunk that is not referenced in the initial HTML, so a guest who will never
see it never downloads its 964 KB.

**Nothing is fetched at runtime.** The paper, the wax relief and the petals are
drawn procedurally in `lib/textures.ts`; the specular environment the wax
reflects is built from geometry inside the scene rather than a downloaded
HDRI; fonts are self-hosted at build time. No CDN, no font service, no
tracking. It opens the same on hotel wifi as on fibre.

**Films play everywhere.** Each cut ships as VP9 WebM (offered first, roughly
half the size) with H.264 behind it for Safari and iOS. The originals were
H.265 — which plays in Safari and essentially nowhere else — at 15.1 MB and
11.2 MB; they are now 376 KB and 292 KB, with faststart so they stream.

**It is built to be read by everyone.** Semantic landmarks, one real `<h1>`, a
skip link past the door, `inert` on the page while the door is up so nobody
tabs into what they cannot see, labelled controls, `prefers-reduced-motion`
honoured throughout, and a print stylesheet.

Contrast is measured, not eyeballed: body text 5.71:1, filled controls 4.97:1,
display type 3.84:1 at sizes where 3:1 is the bar. Verified across six widths
from 390 px to 1600 px with no horizontal overflow and no text under 12 px.

**It is built to be shared.** `app/opengraph-image.tsx` generates the card
people see when the link lands in a WhatsApp thread, from the same content
file as the page, so it cannot drift. `Event` structured data tells search
engines and assistants what this is.

The page is `noindex` by default — a private celebration. One line in
`app/layout.tsx` if you want it findable.

---

Built by [Movara Solutions](https://www.movarasolutions.com).
