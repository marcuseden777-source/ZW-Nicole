"use client";

import Image from "next/image";
import { useState } from "react";

import { Lightbox } from "@/components/ui/Lightbox";
import { Divider } from "@/components/ui/Ornaments";
import type { Photo } from "@/lib/media";
import * as content from "@/content/wedding";

/* The site's second life: what replaces the RSVP once the day has passed. */

/**
 * The photographs, laid out as a gallery wall rather than a grid of squares.
 *
 * Columns rather than a grid, because a grid of equal cells can only hold
 * mixed portrait and landscape pictures by cropping them, and these are the
 * only photographs of this day that will ever exist. Every one is shown at
 * its own shape, whole. The wall finds its own rhythm from that, the way a
 * printed album does.
 */
export function Gallery({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      aria-labelledby="gallery-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
    >
      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <h2 id="gallery-heading" className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep">
            The Day
          </h2>
          <Divider className="mx-auto mt-5" />
        </header>

        {photos.length === 0 ? (
          // An empty gallery should still look considered, never broken.
          <div
            className="u-reveal mx-auto mt-12 max-w-md rounded-t-[6rem] border px-8 pb-10 pt-14 text-center"
            style={{ borderColor: "var(--rule)" }}
          >
            <p className="u-display text-balance italic leading-relaxed text-ink-soft">
              {content.galleryEmpty.keepsake}
            </p>
          </div>
        ) : (
          /*
           * A justified wall: rows of full-height pictures, each as wide as
           * its own proportions require, the row stretched to meet both
           * margins. This replaced CSS columns, which looked right and read
           * wrong — in columns the second photograph is below the first, not
           * beside it, so a set in the order of the day ran top-to-bottom
           * down the left before jumping back up to the middle. A wedding
           * album has an order. This keeps it.
           */
          <ul className="mt-[clamp(2.5rem,7vh,4rem)] flex flex-wrap gap-2 sm:gap-3">
            {photos.map((photo, i) => {
              const ratio = photo.width / photo.height;
              const described = photo.alt || `Photograph ${i + 1} of ${photos.length}`;
              return (
                <li
                  key={photo.src}
                  className="u-reveal"
                  style={{
                    // Grow in proportion to width, so every row justifies and
                    // no picture is cropped to make it fit.
                    flexGrow: ratio,
                    flexBasis: `${ratio * 15}rem`,
                    // Bounds how far a short last row may stretch, which is
                    // the one ugly failure mode of a justified layout.
                    maxWidth: `min(100%, ${ratio * 26}rem)`,
                    "--reveal-delay": `${(i % 6) * 90}ms`,
                  } as React.CSSProperties}
                >
                  <figure>
                    <button
                      type="button"
                      onClick={() => setOpen(i)}
                      className="group relative block w-full overflow-hidden rounded-sm border bg-parchment"
                      style={{ borderColor: "var(--rule)", aspectRatio: String(ratio) }}
                    >
                      <Image
                        src={photo.src}
                        alt={described}
                        fill
                        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 34vw"
                        placeholder={photo.blurDataURL ? "blur" : "empty"}
                        blurDataURL={photo.blurDataURL}
                        className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                      />
                      <span className="sr-only">Open {described} full size</span>
                    </button>
                    {photo.alt && (
                      /* A plate under the picture rather than a band that
                         appears on hover. The hover band was aria-hidden and
                         needed a mouse, so on a phone and to a screen reader
                         the captions did not exist at all. */
                      <figcaption className="u-eyebrow mt-2 text-ink-soft">
                        {photo.alt}
                      </figcaption>
                    )}
                  </figure>
                </li>
              );
            })}
          </ul>
        )}

        {content.filmUrl && (
          <div className="u-reveal mt-[clamp(2.5rem,7vh,4rem)]">
            <div className="relative aspect-video w-full overflow-hidden bg-ink/5">
              <iframe
                src={content.filmUrl}
                title="The wedding film"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          </div>
        )}
      </div>

      <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </section>
  );
}

/** What people wrote, kept. */
export function Guestbook() {
  if (!content.guestbook.length) return null;

  return (
    <section
      aria-labelledby="guestbook-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
    >
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <h2 id="guestbook-heading" className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep">
            In Their Words
          </h2>
          <Divider className="mx-auto mt-5" />
        </header>

        <ul className="mt-[clamp(2.5rem,7vh,4rem)] columns-1 gap-5 sm:columns-2 lg:columns-3">
          {content.guestbook.map((entry, i) => (
            <li
              key={`${entry.from}-${i}`}
              className="u-reveal mb-5 break-inside-avoid rounded-sm border bg-white/55 px-7 py-8 text-center"
              style={{
                borderColor: "var(--rule)",
                "--reveal-delay": `${(i % 6) * 90}ms`,
              } as React.CSSProperties}
            >
              <p className="u-display text-balance italic leading-relaxed text-ink-soft">
                &ldquo;{entry.message}&rdquo;
              </p>
              <p className="u-script mt-5 text-[1.75rem] leading-none text-gold-deep">
                {entry.from}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
