"use client";

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
/**
 * The film from the day.
 *
 * This used to hold the photographs as well, which now live in the Album —
 * every one of them, on a wall built to take as many as the couple add. Two
 * sections showing the same pictures is not a gallery, it is a duplicate.
 */
export function Gallery({ photos }: { photos: Photo[] }) {
  void photos;
  if (!content.filmUrl) return null;

  return (
    <section
      aria-labelledby="gallery-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
    >
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <h2 id="gallery-heading" className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep">
            The Film
          </h2>
          <Divider className="mx-auto mt-5" />
        </header>

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
      </div>
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
