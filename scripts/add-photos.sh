#!/usr/bin/env bash
#
# Put the photographs into the invitation.
#
#   bash scripts/add-photos.sh ~/Desktop/zw-nicole/wedding
#
# Run it from the repository, on your own machine — the build environment has
# no access to your Desktop. It copies everything in that folder into
# public/gallery, turns iPhone HEIC files into JPEGs that browsers can
# actually show, and brings anything enormous down to a sensible size.
#
# Then commit and push, and the site picks them up. There is nothing to edit.

set -uo pipefail
cd "$(dirname "$0")/.."

SRC="${1:-}"
DEST="public/gallery"
# Plenty for any screen: the site serves each picture at the size the device
# actually asks for, so anything past this is weight nobody downloads.
MAX_EDGE=2560

if [ -z "$SRC" ]; then
  echo "Where are the photographs?"
  echo "  bash scripts/add-photos.sh ~/Desktop/zw-nicole/wedding"
  exit 1
fi

SRC="${SRC/#\~/$HOME}"
if [ ! -d "$SRC" ]; then
  echo "No folder at: $SRC"
  echo "Check the path — on a Mac, drag the folder into Terminal to paste it exactly."
  exit 1
fi

mkdir -p "$DEST"
have() { command -v "$1" >/dev/null 2>&1; }

copied=0
converted=0
skipped=0

shopt -s nullglob nocaseglob
for file in "$SRC"/*.{jpg,jpeg,png,heic,heif,webp,avif,tif,tiff}; do
  [ -e "$file" ] || continue
  base="$(basename "$file")"
  stem="${base%.*}"
  ext="${base##*.}"
  lower="$(echo "$ext" | tr '[:upper:]' '[:lower:]')"

  case "$lower" in
    heic|heif|tif|tiff)
      # No browser shows HEIC. sips ships with macOS, so this needs nothing
      # installed.
      if have sips; then
        if sips -s format jpeg -s formatOptions 82 \
             -Z "$MAX_EDGE" "$file" --out "$DEST/$stem.jpg" >/dev/null 2>&1; then
          echo "converted  $base  ->  $stem.jpg"
          converted=$((converted + 1))
        else
          echo "SKIPPED    $base  (could not convert)"
          skipped=$((skipped + 1))
        fi
      else
        echo "SKIPPED    $base  (needs macOS 'sips', or export it as JPEG first)"
        skipped=$((skipped + 1))
      fi
      ;;
    *)
      cp "$file" "$DEST/$base"
      # Bring the very large ones down. Untouched if already smaller.
      if have sips; then sips -Z "$MAX_EDGE" "$DEST/$base" >/dev/null 2>&1; fi
      echo "copied     $base"
      copied=$((copied + 1))
      ;;
  esac
done
shopt -u nullglob nocaseglob

total=$((copied + converted))
echo
echo "$total photograph(s) in $DEST  ($converted converted, $skipped skipped)"

if [ "$total" -eq 0 ]; then
  echo
  echo "Nothing was copied. Is that the right folder? It should hold the image"
  echo "files themselves, not a folder of folders."
  exit 1
fi

echo
echo "Naming, if you want captions:"
echo "  01 — Signing the register.jpg"
echo "The number sets the order. The words become the caption AND the"
echo "description read aloud to a guest who cannot see the photograph, so"
echo "write them as you would describe it to someone on the telephone."
echo "A camera's own name — IMG_4471.jpg — is fine; it simply gets no caption."
echo
echo "Then:"
echo "  git add public/gallery"
echo '  git commit -m "The photographs"'
echo "  git push"
