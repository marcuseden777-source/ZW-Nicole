"use client";

import Image from "next/image";

import type { Photo } from "@/lib/media";

/**
 * A photograph the whole page falls into.
 *
 * The invitation had one rhythm — cream panel, cream panel, cream panel — and
 * twenty-six photographs sitting in two blocks near the bottom. Every section
 * arrived the same way and left the same way, so the piece had no acts in it,
 * and the best thing the couple own was being used as a gallery rather than as
 * the story.
 *
 * This is the other beat. Full-bleed, floor to ceiling, the picture travelling
 * slower than the page across it, and — where there are words — one line held
 * at the bottom like a caption in a film. Between two of these, a cream panel
 * reads as intimate rather than as more of the same.
 *
 * The darkness comes from the PHOTOGRAPH, never from a block of colour. A
 * single dark band dropped into an otherwise light page reads as a mistake;
 * a photograph that happens to be dark reads as a photograph.
 */
export function Interlude({
  photo,
  line,
  eyebrow,
  alt,
  height = "78svh",
}: {
  photo: Photo | undefined;
  /** Optional. Some of these are stronger with nothing written on them at all. */
  line?: string;
  eyebrow?: string;
  alt: string;
  height?: string;
}) {
  if (!photo) return null;

  const wordless = !line && !eyebrow;

  return (
    <section
      // With no words on it this is decoration, and a screen reader should be
      // told so rather than made to stop at a photograph it cannot use.
      aria-hidden={wordless || undefined}
      // Full-bleed out of the page's gutter, inside a section that clips.
      className="relative left-1/2 z-[1] w-screen -translate-x-1/2 overflow-hidden"
      style={{ height: `clamp(22rem, ${height}, 58rem)` }}
      data-m="pan"
      data-no-print
    >
      {/* Taller than its frame, so it has somewhere to travel. The overflow
          is why there is no gap at either end of the slide. */}
      <div className="absolute inset-x-0 -inset-y-[12%]" data-m-inner>
        <Image
          src={photo.src}
          alt={wordless ? "" : alt}
          fill
          sizes="100vw"
          className="object-cover"
          placeholder={photo.blurDataURL ? "blur" : "empty"}
          blurDataURL={photo.blurDataURL}
        />
      </div>

      {/* The scrim. Not decoration — it is the only thing guaranteeing that a
          line of cream type is readable over a photograph nobody has vetted,
          and it has to hold even if the picture underneath is a white sky. */}
      {!wordless && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            // These stops are measured, not chosen. Cream type at #fdf6e8
            // needs its background no lighter than about rgb(112,112,112) to
            // clear 4.5:1, and the eyebrow sits around 28% of the way up the
            // frame — where the old scrim was thin enough to let a bright sky
            // through at 2.22:1. Holding ~0.62 that high puts the worst case
            // over white at rgb(108) and 4.8:1. It also reads as a film's
            // lower third rather than as a wash, which is the right answer
            // for type over a photograph anyway.
            background:
              "linear-gradient(to top, rgba(18,13,7,0.90) 0%, rgba(18,13,7,0.82) 16%, rgba(18,13,7,0.58) 30%, rgba(18,13,7,0.22) 52%, transparent 76%)",
          }}
        />
      )}

      {/* Held low and to the left rather than centred. Everything else on this
          page is centred; the point of this section is that it is not. */}
      {!wordless && (
        <div className="relative z-10 flex h-full flex-col justify-end px-[var(--gutter)] pb-[clamp(2.5rem,7vh,4.5rem)]">
          <div className="mx-auto w-full max-w-6xl">
            {eyebrow && (
              <p
                className="u-eyebrow mb-4"
                // The brighter cream, not the champagne: this is 13px, so it
                // is held to 4.5:1 and needs every point of headroom it can get.
                style={{ color: "#fdf6e8", textShadow: "0 1px 10px rgba(16,11,6,0.9)" }}
                data-m="rise"
              >
                {eyebrow}
              </p>
            )}
            {line && (
              <p
                // Balanced rather than hard-wrapped: "Ten years of almost /
                // meeting." left one word stranded on its own line. The
                // balance runs before the line-splitter measures, so the
                // splitter captures the lines the browser actually chose.
                className="u-script max-w-[22ch] text-balance text-[clamp(2.5rem,7.5vw,5.5rem)] leading-[1.02]"
                style={{
                  color: "#fdf6e8",
                  textShadow: "0 2px 26px rgba(16,11,6,0.7), 0 1px 3px rgba(16,11,6,0.55)",
                }}
                data-lines
                data-m
              >
                {line}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
