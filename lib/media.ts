/**
 * The filesystem as the content source.
 *
 * Everything else in this site is driven by content/wedding.ts, which is right
 * for words — someone has to write them. Photographs are different. Nobody is
 * going to measure a hundred JPEGs, work out which are portrait, and hand-type
 * an array of TypeScript objects to match. They are going to drag a folder of
 * pictures onto a repository and expect the site to cope.
 *
 * So: drop files into /public/gallery, commit, and they appear. This module
 * reads that folder at BUILD time (the page is statically generated, so this
 * never runs on a request) and works out for itself what each picture is —
 * its real dimensions, a colour to hold its place while it loads, and a
 * caption taken from the filename.
 *
 * The same idea covers the films in /public/ambient: a film slot switches
 * itself on when its files exist and stays quietly off when they do not.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const PUBLIC = join(process.cwd(), "public");

export type Photo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Portrait, landscape or square — decided from the file, never by hand. */
  orientation: "portrait" | "landscape" | "square";
  /** A tiny inline image shown while the real one arrives. */
  blurDataURL?: string;
};

/* ───────────────────────────────────────────────────────────────────────────
 *  Reading a picture's size without asking a library
 *
 *  sharp is present because Next.js brings it, and it does this better than
 *  we can. But a build that fails because an optional native binary did not
 *  install is not a build worth having — and this site has to survive being
 *  rebuilt years from now by someone who just wants to add a photograph. So
 *  every image format the couple could plausibly drop in is also parsed here
 *  from its own header, in about sixty lines and with no dependencies.
 * ─────────────────────────────────────────────────────────────────────────── */
function sizeFromHeader(buf: Buffer): { width: number; height: number } | null {
  // PNG — IHDR is always the first chunk, at a fixed offset.
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // GIF — little-endian, right after the signature.
  if (buf.length > 10 && buf.toString("ascii", 0, 3) === "GIF") {
    return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }

  // WebP — three sub-formats, each storing the size somewhere different.
  if (
    buf.length > 30 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    const kind = buf.toString("ascii", 12, 16);
    if (kind === "VP8X") {
      // Canvas size is stored minus one, across three bytes each.
      const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
      return { width: w, height: h };
    }
    if (kind === "VP8 ") {
      // 14 bits each, after the 3-byte start code.
      return {
        width: buf.readUInt16LE(26) & 0x3fff,
        height: buf.readUInt16LE(28) & 0x3fff,
      };
    }
    if (kind === "VP8L") {
      const bits = buf.readUInt32LE(21);
      return {
        width: 1 + (bits & 0x3fff),
        height: 1 + ((bits >> 14) & 0x3fff),
      };
    }
  }

  // JPEG — walk the segment chain to the start-of-frame, which is the only
  // place the real size lives. Everything before it is metadata of some kind,
  // and a phone photograph can carry a great deal of that.
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      // SOF0..SOF15, skipping the four that are not frame headers.
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      }
      // Standalone markers carry no length field; everything else does.
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
        i += 2;
      } else {
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
  }

  return null;
}

/**
 * Which way up a JPEG actually is.
 *
 * A phone held upright does not usually rotate the pixels. It writes them
 * landscape and adds an EXIF tag saying "turn this 90 degrees to show it".
 * Browsers obey that tag, and so does the image optimiser this site serves
 * through — so the picture on screen is portrait while the numbers in the
 * file say landscape. Believe the file and every upright photograph from the
 * wedding gets a landscape frame with a portrait picture crushed into it.
 *
 * Returns 1-8 as EXIF defines them, or null if there is no tag to read.
 * Values 5 to 8 are the ones that involve a quarter turn, and those are the
 * ones where width and height have to be swapped.
 */
function orientationFromJpeg(buf: Buffer): number | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;

  let i = 2;
  while (i < buf.length - 4) {
    if (buf[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = buf[i + 1];
    // Start of scan: past here is compressed pixels, not metadata.
    if (marker === 0xda) return null;
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2;
      continue;
    }

    const length = buf.readUInt16BE(i + 2);

    // APP1 is where EXIF lives.
    if (marker === 0xe1 && i + 10 < buf.length && buf.toString("ascii", i + 4, i + 10) === "Exif\0\0") {
      const tiff = i + 10;
      if (tiff + 8 > buf.length) return null;

      // The TIFF block carries its own byte order, which is not the JPEG's.
      const order = buf.toString("ascii", tiff, tiff + 2);
      const little = order === "II";
      if (!little && order !== "MM") return null;

      const u16 = (at: number) => (little ? buf.readUInt16LE(at) : buf.readUInt16BE(at));
      const u32 = (at: number) => (little ? buf.readUInt32LE(at) : buf.readUInt32BE(at));

      const ifd = tiff + u32(tiff + 4);
      if (ifd + 2 > buf.length) return null;

      const entries = u16(ifd);
      for (let e = 0; e < entries; e++) {
        const entry = ifd + 2 + e * 12;
        if (entry + 12 > buf.length) return null;
        // 0x0112 is Orientation. Its value is a SHORT sitting in the first
        // two bytes of the entry's value field.
        if (u16(entry) === 0x0112) {
          const value = u16(entry + 8);
          return value >= 1 && value <= 8 ? value : null;
        }
      }
      return null;
    }

    i += 2 + length;
  }
  return null;
}

/** A quarter turn means the picture is the other way round from its numbers. */
function turnsSideways(orientation: number | null): boolean {
  return orientation !== null && orientation >= 5 && orientation <= 8;
}

/**
 * sharp if it is there, nothing if it is not. Never throws.
 *
 * Next.js brings sharp along for its own image optimisation, so in practice
 * it is always present. But a wedding invitation failing to deploy because an
 * optional native binary did not compile is not an acceptable failure, so
 * everything here treats it as a bonus rather than a requirement.
 */
async function loadSharp(): Promise<SharpModule | null> {
  try {
    const mod = (await import("sharp")) as unknown as { default?: SharpModule } & SharpModule;
    return mod.default ?? mod;
  } catch {
    return null;
  }
}

/** Only the sliver of sharp's surface this file touches. */
type SharpPipeline = {
  rotate(): SharpPipeline;
  resize(w: number, h: number, opts?: { fit?: string }): SharpPipeline;
  webp(opts?: { quality?: number }): { toBuffer(): Promise<Buffer> };
  metadata(): Promise<{ width?: number; height?: number; orientation?: number }>;
};
type SharpModule = (input: string) => SharpPipeline;

const IMAGE = /\.(jpe?g|png|webp|avif|gif|heic|heif)$/i;

/**
 * Turn a filename into a caption.
 *
 *   "01 — Signing the register.jpg"  →  "Signing the register"
 *   "02-first-look.jpg"              →  "First look"
 *   "IMG_4471.jpg"                   →  "" (no invented description)
 *
 * The leading number is an ordering device, not part of the caption. And a
 * camera's own filename says nothing about the photograph, so it is better to
 * say nothing than to read "I M G 4471" aloud to someone who cannot see it.
 */
function captionFromName(file: string): string {
  const stem = file.replace(/\.[^.]+$/, "");
  const withoutOrder = stem.replace(/^\s*\d+\s*[-–—_.)]*\s*/, "");
  if (!withoutOrder) return "";
  // A bare camera filename describes nothing.
  if (/^(img|dsc|dscf|p|pxl|photo|image)[-_]?\d+$/i.test(withoutOrder)) return "";
  const words = withoutOrder.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!words) return "";
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const caches = new Map<string, Photo[]>();

/**
 * Every photograph in /public/gallery, in filename order.
 *
 * Returns an empty array when the folder is missing or empty — which is the
 * situation today, and which both the carousel and the gallery wall are built
 * to show as something considered rather than something broken.
 */
export async function readGallery(folder = "gallery"): Promise<Photo[]> {
  const cached = caches.get(folder);
  if (cached) return cached;

  let files: string[];
  try {
    files = readdirSync(join(PUBLIC, folder));
  } catch {
    caches.set(folder, []);
    return [];
  }

  const sharp = await loadSharp();

  const photos = files
    .filter((f) => IMAGE.test(f) && !f.startsWith("."))
    // Numeric-aware, so 10 comes after 9 rather than after 1.
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }))
    .map((file): Photo | null => {
      const path = join(PUBLIC, folder, file);

      let width = 0;
      let height = 0;
      const blurDataURL: string | undefined = undefined;

      try {
        if (statSync(path).size === 0) return null;
        const head = readFileSync(path);

        const parsed = sizeFromHeader(head);
        if (parsed) {
          width = parsed.width;
          height = parsed.height;
        }

        // Turn the numbers the same way the browser will turn the picture.
        if (turnsSideways(orientationFromJpeg(head))) {
          [width, height] = [height, width];
        }
      } catch {
        return null;
      }

      // Unmeasured, for now. AVIF and HEIC have no parser here and sharp has
      // not run yet; both get their chance below before anything is dropped.
      return {
        src: `/${folder}/${encodeURIComponent(file)}`,
        alt: captionFromName(file),
        width,
        height,
        orientation:
          width > height * 1.06 ? "landscape" : height > width * 1.06 ? "portrait" : "square",
        blurDataURL,
      };
    })
    .filter((p): p is Photo => p !== null);

  // With sharp present, ask it rather than trusting our own header reading —
  // it knows every format's orientation, not only JPEG's, and it is the same
  // library the image optimiser serves through, so its answer is by
  // definition the shape that reaches the screen.
  //
  // The same pass makes the placeholder: a twelve-pixel-wide copy of the
  // photograph, inlined into the HTML and stretched over the space the real
  // one will occupy. It costs a few hundred bytes and it is the difference
  // between a photograph fading up out of its own colours and a grey
  // rectangle waiting to be filled.
  if (sharp) {
    await Promise.all(
      photos.map(async (photo) => {
        const file = decodeURIComponent(photo.src.replace(`/${folder}/`, ""));
        const full = join(PUBLIC, folder, file);

        try {
          const meta = await sharp(full).metadata();
          if (meta.width && meta.height) {
            const sideways = turnsSideways(meta.orientation ?? null);
            photo.width = sideways ? meta.height : meta.width;
            photo.height = sideways ? meta.width : meta.height;
            photo.orientation =
              photo.width > photo.height * 1.06
                ? "landscape"
                : photo.height > photo.width * 1.06
                  ? "portrait"
                  : "square";
          }
        } catch {
          /* Keep what the header parse worked out. */
        }

        try {
          // .rotate() with no argument applies the file's own EXIF turn, so
          // the placeholder is the same way up as the photograph it stands in for.
          const buf = await sharp(full)
            .rotate()
            .resize(12, 12, { fit: "inside" })
            .webp({ quality: 40 })
            .toBuffer();
          photo.blurDataURL = `data:image/webp;base64,${buf.toString("base64")}`;
        } catch {
          /* A photograph without a placeholder still loads; it just arrives
             more abruptly. Not worth failing a build over. */
        }
      }),
    );
  }

  // Only now is it fair to drop anything: a picture with no dimensions cannot
  // be laid out without the page jumping when it arrives, and a jump is worse
  // than an absence. But a photograph disappearing from a wedding gallery with
  // no explanation is worse than either, so say so where whoever added it will
  // see it — in the build log.
  const measured = photos.filter((p) => p.width > 0 && p.height > 0);
  const dropped = photos.filter((p) => p.width === 0 || p.height === 0);

  if (dropped.length > 0) {
    const names = dropped.map((p) => decodeURIComponent(p.src.replace(`/${folder}/`, "")));
    console.warn(
      `\n[gallery] ${dropped.length} file(s) in /public/${folder} could not be measured and ` +
        `have been left out:\n  ${names.join("\n  ")}\n` +
        `  They may be corrupt, or in a format this build cannot read (HEIC needs sharp ` +
        `built with libheif). Converting them to JPEG will fix it.\n`,
    );
  }

  caches.set(folder, measured);
  return measured;
}

/**
 * The photographs of the wedding day itself, for the keepsake gallery wall.
 *
 * A separate folder because they are a separate set. Before the day, the reel
 * holds the pictures the couple already have of each other; afterwards the
 * wall holds the pictures of the wedding. Feeding both from one folder made
 * the same photograph appear twice on the same page.
 */
export function readDayGallery(): Promise<Photo[]> {
  return readGallery("gallery/the-day");
}

/* ───────────────────────────────────────────────────────────────────────────
 *  F I L M S
 * ─────────────────────────────────────────────────────────────────────────── */

export type FilmSources = {
  /** Widescreen cut, for laptops and tablets. */
  desktop: { webm?: string; mp4?: string; poster?: string };
  /** Upright cut, so a phone is not shown a letterboxed strip. */
  mobile: { webm?: string; mp4?: string; poster?: string };
};

/** True when a slot has at least one playable file for at least one shape. */
export function hasFilm(film: FilmSources | null): film is FilmSources {
  if (!film) return false;
  const playable = (s: FilmSources["desktop"]) => Boolean(s.webm || s.mp4);
  return playable(film.desktop) || playable(film.mobile);
}

let cachedAmbient: Record<string, FilmSources> | null = null;

function ambientFiles(): Set<string> {
  try {
    return new Set(readdirSync(join(PUBLIC, "ambient")));
  } catch {
    return new Set();
  }
}

/**
 * Which ambient film slots actually have files behind them.
 *
 * A slot with no files is not an error and not a gap — the section simply
 * renders without a film, exactly as it does now. That is what lets the films
 * be added later, by someone who is not a developer, without a deploy that
 * needs testing.
 */
export function readAmbient(): Record<string, FilmSources> {
  if (cachedAmbient) return cachedAmbient;

  const present = ambientFiles();
  const slots = ["bloom", "silk", "letter"];
  const out: Record<string, FilmSources> = {};

  for (const slot of slots) {
    const shape = (which: "desktop" | "mobile") => {
      const base = `${slot}-${which}`;
      const pick = (ext: string) =>
        present.has(`${base}.${ext}`) ? `/ambient/${base}.${ext}` : undefined;
      return { webm: pick("webm"), mp4: pick("mp4"), poster: pick("jpg") };
    };

    const film: FilmSources = { desktop: shape("desktop"), mobile: shape("mobile") };

    // A slot that only shipped one shape still works: the other falls back to
    // it rather than showing nothing.
    if (!film.desktop.webm && !film.desktop.mp4) film.desktop = film.mobile;
    if (!film.mobile.webm && !film.mobile.mp4) film.mobile = film.desktop;

    if (hasFilm(film)) out[slot] = film;
  }

  cachedAmbient = out;
  return out;
}
