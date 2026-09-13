"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { Lightbox } from "@/components/ui/Lightbox";
import { Divider } from "@/components/ui/Ornaments";
import type { Photo } from "@/lib/media";

/**
 * The library — every photograph there is, and however many that becomes.
 *
 * The Moments reel is a handful of pictures on a turning arc, which is right
 * for a few and wrong for a hundred. This is the other thing: a wall you fall
 * down, built to hold as many as the couple ever add without being
 * reconsidered.
 *
 * Two decisions do most of the work.
 *
 * The columns are packed HERE rather than by CSS. Every picture's real shape
 * is known at build time, so each one can go to whichever column is currently
 * shortest — which is how a printed album is laid out, and it keeps the
 * columns level instead of leaving one trailing half a screen below the rest.
 * CSS columns cannot do that: they fill top to bottom and let the last column
 * fall short.
 *
 * And the parallax moves the COLUMNS, not the pictures. Each column drifts at
 * its own rate as the page passes, so the wall has depth — but that is three
 * or four style writes a frame no matter whether there are twelve
 * photographs or two hundred. Transforming each picture would be the same
 * effect at a hundred times the cost, on the phones least able to pay it.
 */

/** How far apart the slowest and fastest columns drift, in pixels. */
const DRIFT = 44;

function columnsFor(width: number) {
  if (width < 560) return 2;
  if (width < 1024) return 3;
  return 4;
}

export function Library({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [columnCount, setColumnCount] = useState(3);
  const [drifting, setDrifting] = useState(false);

  const section = useRef<HTMLElement>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const measure = () => {
      setColumnCount(columnsFor(window.innerWidth));
      setDrifting(!motion.matches);
    };
    measure();
    window.addEventListener("resize", measure);
    motion.addEventListener("change", measure);
    return () => {
      window.removeEventListener("resize", measure);
      motion.removeEventListener("change", measure);
    };
  }, []);

  /* Shortest-column packing. Each photograph's height in a column of width 1
     is simply the inverse of its aspect ratio, so the whole layout can be
     worked out from numbers we already have — no measuring, no reflow, and
     the same answer on the server and in the browser. */
  const columns = useMemo(() => {
    const buckets: { photo: Photo; index: number }[][] = Array.from(
      { length: columnCount },
      () => [],
    );
    const heights = new Array(columnCount).fill(0);

    photos.forEach((photo, index) => {
      let shortest = 0;
      for (let i = 1; i < columnCount; i++) {
        if (heights[i] < heights[shortest]) shortest = i;
      }
      buckets[shortest].push({ photo, index });
      heights[shortest] += photo.height / photo.width;
    });

    return buckets;
  }, [photos, columnCount]);

  /* One transform per column per frame, and only while the wall is on screen. */
  useEffect(() => {
    if (!drifting) {
      columnRefs.current.forEach((el) => el && (el.style.transform = ""));
      return;
    }
    const el = section.current;
    if (!el) return;

    let frame = 0;
    let near = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
      },
      { rootMargin: "20% 0px" },
    );
    observer.observe(el);

    const tick = () => {
      if (near) {
        const rect = el.getBoundingClientRect();
        const span = window.innerHeight + rect.height;
        // -1 as the wall enters from below, +1 as it leaves above.
        const through = span > 0 ? 1 - 2 * (rect.bottom / span) : 0;
        for (let i = 0; i < columnRefs.current.length; i++) {
          const column = columnRefs.current[i];
          if (!column) continue;
          // Alternating, so neighbouring columns move against each other and
          // the wall reads as layered rather than as one sheet sliding.
          const rate = i % 2 === 0 ? 1 : -0.62;
          column.style.transform = `translate3d(0, ${(through * DRIFT * rate).toFixed(1)}px, 0)`;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [drifting, columnCount]);

  if (photos.length === 0) return null;

  return (
    <section
      ref={section}
      aria-labelledby="library-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
    >
      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <h2
            id="library-heading"
            className="u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep"
            data-lines
            data-m
          >
            The Album
          </h2>
          <Divider className="mx-auto mt-5" />
          <p className="u-reveal u-eyebrow mt-6 text-ink-soft">
            {photos.length} {photos.length === 1 ? "photograph" : "photographs"}
          </p>
        </header>

        <div
          className="mt-[clamp(2.5rem,7vh,4rem)] flex items-start gap-3 sm:gap-4"
          // The drift pushes columns past their box; without this the wall
          // clips itself at the top and bottom edges.
          style={{ overflow: "visible" }}
        >
          {columns.map((column, c) => (
            <div
              key={c}
              ref={(el) => {
                columnRefs.current[c] = el;
              }}
              className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4"
              style={{ willChange: drifting ? "transform" : undefined }}
            >
              {column.map(({ photo, index }) => {
                const described =
                  photo.alt || `Photograph ${index + 1} of ${photos.length}`;
                return (
                  <figure key={photo.src} data-m="reveal">
                    <button
                      type="button"
                      onClick={() => setOpen(index)}
                      className="group relative block w-full overflow-hidden rounded-sm border bg-parchment"
                      style={{ borderColor: "var(--rule)" }}
                    >
                      {/* The scale lives on this wrapper rather than on the
                          picture, so the settle-into-place and the hover
                          scale compose instead of overwriting each other. */}
                      <span className="block" data-m-inner>
                      <Image
                        src={photo.src}
                        alt={described}
                        width={photo.width}
                        height={photo.height}
                        // Its share of the screen at each breakpoint, so no
                        // phone fetches a picture wider than its own display.
                        sizes="(max-width: 560px) 50vw, (max-width: 1024px) 33vw, 300px"
                        placeholder={photo.blurDataURL ? "blur" : "empty"}
                        blurDataURL={photo.blurDataURL}
                        // The first row is what a guest sees on arrival; the
                        // rest wait until they are nearly wanted, which is
                        // what makes a hundred photographs survivable.
                        loading={index < columns.length ? "eager" : "lazy"}
                        className="h-auto w-full transition-transform duration-[1.3s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                      />
                      </span>
                      {photo.alt && (
                        // A span, not a <figcaption>. A caption element has to
                        // be a child of its <figure>, and this sits inside the
                        // button — the picture is the control, so the overlay
                        // has to live in it. The accessible name below carries
                        // the same words for anyone who cannot see it.
                        <span
                          className="u-eyebrow pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-[rgba(26,20,13,0.84)] to-transparent px-3 pb-2.5 pt-7 text-left text-champagne opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                          aria-hidden="true"
                        >
                          {photo.alt}
                        </span>
                      )}
                      <span className="sr-only">Open {described} full size</span>
                    </button>
                  </figure>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </section>
  );
}
