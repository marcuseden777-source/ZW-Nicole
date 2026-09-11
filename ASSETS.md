# Adding the photographs and the films

There is nothing to configure and no code to edit. **Put files in a folder and
the site finds them.** It reads `/public/gallery` and `/public/ambient` when it
builds and works out the rest for itself — which pictures exist, what shape
each one is, which films are available and in which cuts.

A folder that is empty is not a gap. Every section that uses these files has a
finished, deliberate state for having none of them, which is what the site
shows today.

---

## The photographs

Drop image files into **`/public/gallery`**. That is the whole procedure.

```
public/gallery/
  01 — Signing the register.jpg
  02 — The first look.jpg
  03 — Tea ceremony.jpg
```

The site works out for itself:

| | how |
|---|---|
| **Order** | the leading number, counted properly, so 10 follows 9 rather than 1 |
| **Shape** | read from the file itself; portrait, landscape and panorama all keep their own proportions and are never cropped to match each other |
| **Caption** | the part of the filename after the number — this is also the description read aloud to a guest using a screen reader, so write it as you would describe the photograph to someone on the telephone |
| **Placeholder** | a tiny blurred copy, generated at build time, so each picture fades up out of its own colours instead of appearing in a grey box |

A file named `IMG_4471.jpg` still works — it simply gets no caption, because a
camera's filename describes nothing and it is better to say nothing than to
read "I M G 4471" aloud to someone who cannot see the picture.

JPEG, PNG, WebP, AVIF and GIF are all understood.

**Where they appear.** Before the wedding they are the *Moments* reel. After it
— when the site is switched to its keepsake phase — they are also the *The Day*
gallery wall. Same files, both places, nothing to duplicate.

---

## The films

Drop video files into **`/public/ambient`**, named for their slot:

| Slot | Files | Where it plays |
|---|---|---|
| `bloom` | `bloom-desktop.{webm,mp4,jpg}`<br>`bloom-mobile.{webm,mp4,jpg}` | Over the door as it opens, so the letter blooms into the film rather than dissolving |
| `silk` | `silk-desktop.{webm,mp4,jpg}`<br>`silk-mobile.{webm,mp4,jpg}` | Behind *Our Story*, at 20% |
| `letter` | `letter-desktop.{webm,mp4,jpg}`<br>`letter-mobile.{webm,mp4,jpg}` | Behind the closing words, at 18% |
| hero | `/public/hero/landing-{desktop,mobile}.{webm,mp4,jpg}` | Already in place — their own dusk footage |

A slot switches itself on when its files appear. If only one shape is
supplied, the other falls back to it rather than showing nothing. The `.jpg` is
the poster frame — what a guest sees before the film arrives, and instead of it
if they have asked for reduced motion or are on a thin connection.

Only the strengths are set by hand, in `content/wedding.ts` §18.

### Getting them in

The six films are already generated and waiting in the Higgsfield library.
`scripts/assets.manifest.txt` lists every one with its URL and its generation
id. From a machine with ordinary internet access:

```bash
bash scripts/fetch-assets.sh
```

That downloads each file, encodes it into both formats browsers need, cuts a
poster frame, and puts everything in the right place. Commit the result and the
next build picks it up.

**It has to be run from your own machine, not from this build environment.**
That environment reaches the network through an allowlist proxy which does not
include the generator's CDN (`d8j0ntlcm91z4.cloudfront.net`) — every request
returns 403. The films can be *made* from there but not *fetched* into the
repository. If the link in the manifest has expired, copy a fresh one from the
Higgsfield library and replace that line.

### Encoding, if you ever do it by hand

Files exported from a generator are often **H.265**, which plays in Safari and
essentially nowhere else — not Chrome on Windows or Android, not Firefox. The
hero films were 15.1 MB and 11.2 MB of H.265; re-encoded they are 376 KB and
292 KB and play everywhere.

```bash
# WebM/VP9 — offered first, roughly half the size, taken by everything but Safari
ffmpeg -i in.mp4 -an -vf "scale=1280:-2:flags=lanczos" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 out.webm

# H.264 — the fallback Safari and iOS need
ffmpeg -i in.mp4 -an -vf "scale=1280:-2:flags=lanczos" \
  -c:v libx264 -profile:v high -crf 24 -preset slow -pix_fmt yuv420p \
  -movflags +faststart out.mp4

# The poster frame
ffmpeg -i in.mp4 -frames:v 1 -q:v 4 out.jpg
```

Use `1280` for desktop cuts and `720` for mobile. `-an` drops audio, which a
muted autoplaying backdrop can never use. `+faststart` puts the index at the
front so playback begins before the file has finished arriving — without it a
phone on hotel wifi stares at a blank frame until the whole clip lands.

`/hero`, `/ambient` and `/gallery` are cached for a year, so **replacing a file
means changing its name**, not overwriting it.

---

## The stills

Four botanical and material stills were also generated — a wax seal macro, a
cream garden rose, candlelight bokeh, pressed roses and eucalyptus. They are in
`scripts/assets.manifest.txt` alongside the films and land in `/public/stills`.

They are section accents, not gallery contents. None of them shows Zhi Wei or
Nicole, deliberately: invented photographs of a real couple have no business
standing in for their wedding. The gallery is for their own pictures, and until
those arrive it says so.

All four were generated at low quality and 1k. That is enough behind a scrim;
regenerate them larger if one is ever wanted big on screen.
