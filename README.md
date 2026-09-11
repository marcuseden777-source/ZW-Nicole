# Zhi Wei & Nicole

An invitation that becomes a keepsake.

**Sunday, 11 October 2026 · Sofitel Singapore City Centre**

A sealed cream envelope holds the door. Tap it: the wax breaks, the letter
blooms open, and it clears away to the film behind. After the wedding, one
word in one file turns the whole thing into the memory of the day.

---

## Editing it

**The words live in one file: [`content/wedding.ts`](content/wedding.ts).**

Names, the date, the schedule, their story, the venue and how to get there,
the questions guests ask, the colour of the wax. Heavily commented, with no
code anywhere near it. Change a value, save, done.

**The pictures and the films are not in a file at all — they are folders.**
Drop photographs into `public/gallery` (the *Moments* reel) or
`public/gallery/the-day` (the wall, after the wedding), and films into
`public/ambient`, and the site finds them when it builds. It reads each picture's real proportions
out of the file, takes the caption from the filename, makes a blurred
placeholder, and works out which films exist and in which cuts. Nobody has to
measure a photograph or write a line of TypeScript to add one. Empty folders
are not a gap: every section that uses them has a finished state for having
none. See [ASSETS.md](ASSETS.md).

## The two lives

| | `invitation` | `keepsake` |
|---|---|---|
| Door | Sealed envelope | Unchanged |
| Hero | The film, their names across it | Unchanged |
| Middle | Invitation, their story | Unchanged |
| Moments | The photographs, as a reel | Unchanged |
| Then | Schedule → countdown → venue → questions → RSVP | The gallery wall → guest messages → schedule → venue |
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

**Films play everywhere, and only when they should.** Each cut ships as VP9
WebM (offered first, roughly half the size) with H.264 behind it for Safari
and iOS — the browser fetches one, never both. The originals were H.265, which
plays in Safari and essentially nowhere else, at 15.1 MB and 11.2 MB; they are
now 376 KB and 292 KB, with faststart so they stream. An ambient film fetches
nothing until it is nearly on screen, stops when it leaves, and is replaced by
a still frame for anyone on save-data or asking for reduced motion.

**Photographs keep their own shape.** A wedding set is portrait and landscape
mixed together, and a grid of identical frames can only hold that by cropping
most of it. The reel gives every card the same height and its own width; the
gallery wall runs in columns at natural heights. Nothing is cropped except a
stitched panorama beyond 1.9:1, and the lightbox still shows that whole.
Because the dimensions are known before the page renders, there is no reflow
when a picture arrives.

**It is built to be read by everyone.** Semantic landmarks, one real `<h1>`, a
skip link past the door, `inert` on the page while the door is up so nobody
tabs into what they cannot see, labelled controls, `prefers-reduced-motion`
honoured throughout, and a print stylesheet.

Contrast is measured, not eyeballed: body text 5.71:1, filled controls 4.97:1,
display type 3.84:1 at sizes where 3:1 is the bar.

Measured in a real browser rather than asserted: nine widths from 320 px to
2560 px with no horizontal overflow, nothing escaping its container and no
text under 12 px; cumulative layout shift of 0; no frame over 32 ms while
scrolling the whole document; and the tab order walked by hand, which is the
only way the three keyboard traps that used to be here ever showed up.

**It is built to be shared.** `app/opengraph-image.tsx` generates the card
people see when the link lands in a WhatsApp thread, from the same content
file as the page, so it cannot drift. `Event` structured data tells search
engines and assistants what this is.

The page is `noindex` by default — a private celebration. One line in
`app/layout.tsx` if you want it findable.

---

Built by [Movara Solutions](https://www.movarasolutions.com).
