# Dropping the films in

Every generated asset has a slot waiting for it. The slots are **off** until
their files exist, so the site looks finished either way — an empty slot costs
a guest no request and shows no broken frame.

## The two-step

1. Put the file in the path below.
2. Flip `enabled: true` for that slot in `content/wedding.ts` (§18 `ambient`).

## Encode first — this part matters

Files exported from a generator are usually **H.265**, which plays in Safari
and essentially nowhere else: not Chrome on Windows or Android, not Firefox.
The existing hero films were 15.1 MB and 11.2 MB of H.265; re-encoded they are
376 KB and 292 KB and play everywhere.

```bash
# WebM/VP9 — offered first, about half the size, taken by everything but Safari
ffmpeg -i in.mp4 -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 -cpu-used 4 \
  -pix_fmt yuv420p -an -vf "scale=1600:-2" out.webm

# H.264 — the fallback Safari and iOS need
ffmpeg -i in.mp4 -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 28 \
  -preset slow -movflags +faststart -an -vf "scale=1600:-2" out.mp4
```

Use `scale=1600:-2` for desktop cuts and `scale=840:-2` for mobile. `-an`
drops audio, which a muted autoplaying backdrop can never use. `+faststart`
puts the index at the front so it streams instead of downloading whole.

`/hero` and `/gallery` are cached immutable for a year, so **replacing a film
means changing its filename**, not overwriting it.

## The slots

| Slot | Files | What it is |
|---|---|---|
| `ambient.bloom` | `/public/ambient/bloom-desktop.{webm,mp4}`<br>`/public/ambient/bloom-mobile.{webm,mp4}` | Cream and blush blossoms opening toward the lens until they fill the frame. Plays over the door as it opens, so the letter blooms into the film instead of dissolving. |
| `ambient.story` | `/public/ambient/silk-desktop.{webm,mp4}`<br>`/public/ambient/silk-mobile.{webm,mp4}` | Ivory silk rippling very slowly. Sits under *Our Story* at 20% behind a scrim. |
| `ambient.closing` | `/public/ambient/letter-desktop.{webm,mp4}`<br>`/public/ambient/letter-mobile.{webm,mp4}` | The sealed envelope on linen in candlelight. Sits under the closing words at 18%. |
| hero film | `/public/hero/landing-{desktop,mobile}.{webm,mp4}` | Already in place — their own dusk footage. |

## Stills

Four botanical and material stills were generated as gallery placeholders and
section accents. They are **not** in the repo yet (see below). When they land,
list them in the `gallery` array in `content/wedding.ts` with real `alt` text.

They are deliberately botanical and material — pressed roses, a wax macro,
candlelight bokeh, a single rose. None of them depicts Zhi Wei or Nicole.
Fabricated photographs of a real couple should not stand in for their wedding;
the gallery is for their own photographs, and it shows a considered empty
state until those arrive.

## Why the files are not already here

This build environment reaches the network through an allowlist proxy. The
generator's CDN (`d8j0ntlcm91z4.cloudfront.net`, `cdn.higgsfield.ai`) is not on
it — every fetch returns `connect_rejected`. Assets can be generated from here
but not downloaded into the repo.

Two ways round it, either is fine:

- Download them from the generation widget and drop them in by hand, then
  encode as above.
- Add those two hosts to the environment's network allowlist, and they can be
  pulled in directly next session.
