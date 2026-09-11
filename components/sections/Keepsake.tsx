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
              The photographs are being gathered. They will live here soon.
            </p>
          </div>
        ) : (
          <ul className="mt-[clamp(2.5rem,7vh,4rem)] columns-2 gap-3 sm:columns-3 sm:gap-4">
            {photos.map((photo, i) => {
              const described = photo.alt || `Photograph ${i + 1} of ${photos.length}`;
              return (
                <li
                  key={photo.src}
                  className="u-reveal mb-3 break-inside-avoid sm:mb-4"
                  style={{ "--reveal-delay": `${(i % 6) * 90}ms` } as React.CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(i)}
                    className="group relative block w-full overflow-hidden rounded-sm border bg-parchment"
                    style={{ borderColor: "var(--rule)" }}
                  >
                    <Image
                      src={photo.src}
                      alt={described}
                      width={photo.width}
                      height={photo.height}
                      // Two across on a phone, three on a laptop — so no phone
                      // ever downloads a photograph wider than its own screen.
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 380px"
                      placeholder={photo.blurDataURL ? "blur" : "empty"}
                      blurDataURL={photo.blurDataURL}
                      className="h-auto w-full transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                    />
                    {photo.alt && (
                      <span
                        className="u-eyebrow pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-[rgba(26,20,13,0.82)] to-transparent px-4 pb-3 pt-8 text-left text-champagne opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                        aria-hidden="true"
                      >
                        {photo.alt}
                      </span>
                    )}
                    <span className="sr-only">Open {described} full size</span>
                  </button>
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
