"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { Divider } from "@/components/ui/Ornaments";
import { useCapability } from "@/lib/useCapability";
import { useSectionProgress } from "@/lib/useSectionProgress";
import * as content from "@/content/wedding";

/**
 * A carousel of photographs, carried round by the scroll.
 *
 * Real perspective, but built from CSS 3D rather than WebGL on purpose: these
 * are pictures people want to open, and in a canvas a photograph is not a
 * link, cannot be tabbed to, cannot be described to a screen reader and cannot
 * be saved. Here each one is a genuine <button> wrapping a genuine <Image>,
 * arranged on a ring that turns as the section is read.
 */
export function Carousel() {
  const { ref, progress } = useSectionProgress<HTMLDivElement>();
  const capability = useCapability();
  const [open, setOpen] = useState<number | null>(null);
  const [manual, setManual] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  const photos = content.gallery;
  const count = photos.length;

  // Scroll carries the ring round; tapping a face takes over until the guest
  // scrolls again, so the two never fight.
  const turned = manual ?? (capability.reducedMotion ? 0 : progress * (count - 1));

  useEffect(() => {
    if (manual === null) return;
    const clear = () => setManual(null);
    window.addEventListener("wheel", clear, { passive: true, once: true });
    window.addEventListener("touchmove", clear, { passive: true, once: true });
    return () => {
      window.removeEventListener("wheel", clear);
      window.removeEventListener("touchmove", clear);
    };
  }, [manual]);

  // The lightbox: escape closes, arrows move, focus comes back where it left.
  useEffect(() => {
    if (open === null) return;
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? null : (i + 1) % count));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? null : (i - 1 + count) % count));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, count]);

  const step = useCallback(
    (dir: number) => setManual((m) => (m ?? turned) + dir),
    [turned],
  );

  if (!count) {
    return (
      <section
        aria-labelledby="carousel-heading"
        className="relative z-[1] px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="carousel-heading" className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep">
            Moments
          </h2>
          <Divider className="mx-auto mt-5" />
          <div
            className="u-reveal mx-auto mt-12 max-w-md rounded-t-[6rem] border px-8 pb-10 pt-14"
            style={{ borderColor: "var(--rule)" }}
          >
            <p className="u-display text-balance italic leading-relaxed text-ink-soft">
              The photographs are being gathered. They will live here soon.
            </p>
          </div>
        </div>
      </section>
    );
  }


  return (
    <section
      aria-labelledby="carousel-heading"
      className="relative z-[1] overflow-hidden px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
    >
      <div ref={ref} className="mx-auto max-w-6xl">
        <header className="text-center">
          <h2 id="carousel-heading" className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep">
            Moments
          </h2>
          <Divider className="mx-auto mt-5" />
        </header>

        <div
          ref={stage}
          className="relative mt-[clamp(2.5rem,7vh,4rem)] h-[clamp(17rem,42vw,25rem)]"
          style={{ perspective: "1400px", perspectiveOrigin: "50% 45%" }}
        >
          <ul
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d", pointerEvents: "none" }}
          >
            {photos.map((photo, i) => {
              // Where this face sits relative to the one in front.
              let offset = i - turned;
              offset = ((offset % count) + count) % count;
              if (offset > count / 2) offset -= count;

              // Coverflow rather than a ring: the front photograph stays
              // centred and its neighbours fan back behind it. A true ring
              // throws the faces off both edges of the screen and leaves
              // nothing in the middle to look at.
              const away = Math.abs(offset);
              const depth = Math.min(away, 3);

              return (
                <li
                  key={photo.src}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: [
                      "translate(-50%,-50%)",
                      `translateX(${offset * 58}%)`,
                      `translateZ(${-depth * 9}rem)`,
                      `rotateY(${Math.max(-52, Math.min(52, offset * -34))}deg)`,
                    ].join(" "),
                    opacity: away > 3.2 ? 0 : Math.max(0.2, 1 - away * 0.28),
                    zIndex: Math.round(100 - away * 10),
                    pointerEvents: away < 0.5 ? "auto" : away < 2.6 ? "auto" : "none",
                    transition: capability.reducedMotion
                      ? "none"
                      : "transform 700ms var(--ease-silk), opacity 700ms var(--ease-silk)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => (Math.abs(offset) < 0.5 ? setOpen(i) : setManual(i))}
                    className="block overflow-hidden rounded-sm border bg-parchment shadow-[0_30px_60px_-32px_rgba(90,70,40,0.5)] transition-transform duration-700 hover:scale-[1.03]"
                    style={{
                      borderColor: "var(--rule)",
                      width: "clamp(11rem,26vw,16rem)",
                    }}
                  >
                    <span className="relative block aspect-[3/4]">
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(max-width: 640px) 60vw, 20rem"
                        className="object-cover"
                      />
                    </span>
                    <span className="sr-only">
                      {Math.abs(offset) < 0.5 ? "Open this photograph" : "Bring this photograph to the front"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Real controls, so this works without a mouse and without scrolling. */}
        <div className="relative z-[200] mt-10 flex items-center justify-center gap-4" data-no-print>
          {([["Previous", -1], ["Next", 1]] as const).map(([label, dir]) => (
            <button
              key={label}
              type="button"
              onClick={() => step(dir)}
              className="u-eyebrow flex h-12 items-center rounded-full border px-6 text-ink transition-colors duration-500 hover:bg-gold-ink hover:text-white"
              style={{ borderColor: "var(--rule)" }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={photos[open].alt}
          className="fixed inset-0 z-50 flex items-center justify-center p-[var(--gutter)]"
          style={{ background: "rgba(28,22,14,0.92)" }}
          onClick={() => setOpen(null)}
        >
          <button
            ref={closeButton}
            type="button"
            onClick={() => setOpen(null)}
            className="absolute right-[clamp(1rem,3vw,2rem)] top-[clamp(1rem,3vw,2rem)] flex h-12 w-12 items-center justify-center rounded-full border border-champagne/40"
          >
            <span className="sr-only">Close</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path d="M6 6 L18 18 M18 6 L6 18" stroke="var(--color-champagne)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            </svg>
          </button>

          <figure className="relative max-h-full w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[3/2] w-full">
              <Image src={photos[open].src} alt={photos[open].alt} fill sizes="100vw" className="object-contain" />
            </div>
            <figcaption className="u-eyebrow mt-5 text-center" style={{ color: "var(--color-champagne)" }}>
              {photos[open].alt} · {open + 1} of {count}
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
