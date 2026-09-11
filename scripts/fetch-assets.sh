#!/usr/bin/env bash
#
# Bring the generated films and stills into the repo.
#
# Why this script exists
# ---------------------
# The films were generated on Higgsfield and live on its CDN. The build
# environment they were generated from reaches the network through an
# allowlist proxy that does not include that CDN, so they could be made
# there but not downloaded there. Run this from a normal machine — yours —
# and it puts every file exactly where the site already expects it.
#
# Usage:
#   bash scripts/fetch-assets.sh
#
# Needs: curl, and ffmpeg for the encode step. Without ffmpeg it still
# downloads the originals and tells you what it skipped.

set -uo pipefail

cd "$(dirname "$0")/.."

MANIFEST="scripts/assets.manifest.txt"
RAW="scripts/.assets-raw"          # originals, gitignored
OUT_AMBIENT="public/ambient"
OUT_STILLS="public/stills"

mkdir -p "$RAW" "$OUT_AMBIENT" "$OUT_STILLS"

have() { command -v "$1" >/dev/null 2>&1; }

if ! have curl; then
  echo "curl is required. Install it and run this again." >&2
  exit 1
fi

HAVE_FFMPEG=0
if have ffmpeg; then HAVE_FFMPEG=1; else
  echo
  echo "!! ffmpeg was not found."
  echo "   Originals will still be downloaded to $RAW, but they will not be"
  echo "   encoded into the web formats the site loads. Install ffmpeg"
  echo "   (macOS: brew install ffmpeg) and run this again to finish."
  echo
fi

# ── download ───────────────────────────────────────────────────────────────
# Manifest lines are:  <url> <kind> <name>
#   kind = film | still
#   name = the slot name the site expects (bloom / silk / letter / ...)
downloaded=0
failed=0

while read -r url kind name; do
  # Skip blanks and comments.
  [ -z "${url:-}" ] && continue
  case "$url" in \#*) continue ;; esac

  ext="${url##*.}"
  dest="$RAW/$name.$ext"

  if [ -s "$dest" ]; then
    echo "have    $name.$ext"
    downloaded=$((downloaded + 1))
    continue
  fi

  echo "fetch   $name.$ext"
  # --fail so an HTML error page is never mistaken for a video.
  if curl -sS --fail --location --retry 3 --retry-delay 2 -o "$dest.part" "$url"; then
    mv "$dest.part" "$dest"
    downloaded=$((downloaded + 1))
  else
    rm -f "$dest.part"
    echo "        ^ FAILED. The link may have expired — regenerate it from" >&2
    echo "          your Higgsfield library and update $MANIFEST." >&2
    failed=$((failed + 1))
  fi
done < "$MANIFEST"

echo
echo "downloaded $downloaded file(s), $failed failed"

if [ "$HAVE_FFMPEG" -eq 0 ]; then
  echo "Stopping before the encode step because ffmpeg is missing."
  exit 0
fi

# ── encode ─────────────────────────────────────────────────────────────────
# Two codecs, because no single one plays everywhere: VP9/WebM is smaller and
# plays in Chrome, Firefox and Edge; H.264/MP4 is what Safari and older iOS
# will actually decode. The browser picks the first it understands.
#
# -movflags +faststart puts the MP4 index at the front so playback can begin
# before the file has finished arriving. Without it a phone on hotel wifi
# stares at a blank frame until the whole clip lands.
encode_film() {
  local src="$1" base="$2" width="$3"

  echo "encode  $base"

  ffmpeg -y -loglevel error -i "$src" \
    -an \
    -vf "scale=${width}:-2:flags=lanczos" \
    -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
    "$OUT_AMBIENT/$base.webm" || echo "        webm failed for $base" >&2

  ffmpeg -y -loglevel error -i "$src" \
    -an \
    -vf "scale=${width}:-2:flags=lanczos" \
    -c:v libx264 -profile:v high -crf 24 -preset slow -pix_fmt yuv420p \
    -movflags +faststart \
    "$OUT_AMBIENT/$base.mp4" || echo "        mp4 failed for $base" >&2

  # A poster frame, so there is something to look at while the film loads
  # and something to show when a browser refuses to autoplay at all.
  ffmpeg -y -loglevel error -i "$src" -frames:v 1 -q:v 4 \
    "$OUT_AMBIENT/$base.jpg" || echo "        poster failed for $base" >&2
}

for f in "$RAW"/*.mp4; do
  [ -e "$f" ] || continue
  base="$(basename "$f" .mp4)"
  case "$base" in
    *-mobile) encode_film "$f" "$base" 720 ;;
    *)        encode_film "$f" "$base" 1280 ;;
  esac
done

# Stills become WebP. Next.js will serve them at whatever size each screen
# asks for, so one good copy is enough.
for f in "$RAW"/*.png "$RAW"/*.jpg; do
  [ -e "$f" ] || continue
  base="$(basename "${f%.*}")"
  case "$base" in *-desktop|*-mobile) continue ;; esac
  echo "encode  $base.webp"
  ffmpeg -y -loglevel error -i "$f" -c:v libwebp -quality 82 \
    "$OUT_STILLS/$base.webp" || echo "        webp failed for $base" >&2
done

echo
echo "Done. Files are in $OUT_AMBIENT and $OUT_STILLS."
echo "Commit them and the site picks them up on the next build — there is"
echo "nothing to edit."
