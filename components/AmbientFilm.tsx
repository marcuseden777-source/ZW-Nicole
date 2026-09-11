"use client";

import { useEffect, useRef, useState } from "react";

import type { FilmSources } from "@/lib/media";

/**
 * A quiet film behind a section.
 *
 * It sits low under the type and never competes with it — this is a texture,
 * not a picture. Three things decide whether it plays at all, and all three
 * are the guest's, not ours:
 *
 *  - whether the files exist (the section simply looks as it always did if not);
 *  - whether they asked their system for reduced motion (then it holds a still
 *    frame and fetches no video at all);
 *  - whether their connection or data settings suggest they would rather we
 *    did not (same — a still frame, no film).
 *
 * It also does nothing until it is nearly on screen, and stops the moment it
 * leaves. A five-second loop playing silently three screens below the fold is
 * pure battery, and this invitation will be opened on phones at a wedding.
 */
export function AmbientFilm({
  film,
  opacity = 0.22,
  /** How far the film drifts against the page as it passes, in percent. */
  drift = 6,
}: {
  film: FilmSources | null;
  opacity?: number;
  drift?: number;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  /** null until the browser has been measured — never guess before then. */
  const [cut, setCut] = useState<FilmSources["desktop"] | null>(null);
  const [stills, setStills] = useState(false);
  const [near, setNear] = useState(false);

  /* Which cut, and whether to move at all. Decided here rather than with
     <source media>, so a phone never quietly downloads the laptop file. */
  useEffect(() => {
    if (!film) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wide = window.matchMedia("(min-width: 768px)");

    type Connection = { saveData?: boolean; effectiveType?: string };
    const connection = (navigator as Navigator & { connection?: Connection }).connection;
    const thin =
      connection?.saveData === true ||
      (connection?.effectiveType ? /^(slow-)?2g$/.test(connection.effectiveType) : false);

    const measure = () => {
      setStills(motion.matches || thin);
      setCut(wide.matches ? film.desktop : film.mobile);
    };

    measure();
    motion.addEventListener("change", measure);
    wide.addEventListener("change", measure);
    return () => {
      motion.removeEventListener("change", measure);
      wide.removeEventListener("change", measure);
    };
  }, [film]);

  /* Nothing happens until the section is nearly in view. */
  useEffect(() => {
    const el = holder.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      // One screen of warning, so the first frame is ready by the time it
      // matters rather than fading in late.
      { rootMargin: "100% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* Play while near, pause while not. `play()` rejects on browsers that
     refuse autoplay; the poster is already showing, so there is nothing to
     recover from. */
  useEffect(() => {
    const el = video.current;
    if (!el || stills) return;
    if (near) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [near, stills, cut]);

  /* A slow drift against the scroll, so the film sits behind the page rather
     than stuck to it. Written straight to the element every frame — putting
     this through React state would re-render the section sixty times a second
     to move a background. */
  useEffect(() => {
    if (stills || !near) return;
    const el = inner.current;
    const box = holder.current;
    if (!el || !box) return;

    let frame = 0;
    const tick = () => {
      const rect = box.getBoundingClientRect();
      const span = window.innerHeight + rect.height;
      // -1 as the section enters from below, +1 as it leaves above.
      const through = span > 0 ? 1 - (2 * (rect.bottom / span)) : 0;
      el.style.transform = `translate3d(0, ${(through * drift).toFixed(2)}%, 0) scale(1.12)`;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [stills, near, drift]);

  // No files for this slot: render nothing whatsoever. No element, no
  // request, no reserved space.
  if (!film) return null;

  return (
    <div
      ref={holder}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
      data-no-print
    >
      <div ref={inner} className="absolute inset-0" style={{ transform: "scale(1.12)" }}>
        {cut && !stills && near ? (
          <video
            ref={video}
            poster={cut.poster}
            loop
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
            style={{ opacity }}
          >
            {cut.webm && <source src={cut.webm} type="video/webm" />}
            {cut.mp4 && <source src={cut.mp4} type="video/mp4" />}
          </video>
        ) : cut?.poster ? (
          // The still. What a guest who asked for less motion sees, and what
          // fills the frame before the film has arrived.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cut.poster}
            alt=""
            className="h-full w-full object-cover"
            style={{ opacity }}
            loading="lazy"
            decoding="async"
          />
        ) : null}
      </div>

      {/* The page colour still has to win. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--color-ivory) 0%, color-mix(in oklab, var(--color-ivory) 55%, transparent) 22%, color-mix(in oklab, var(--color-ivory) 55%, transparent) 78%, var(--color-ivory) 100%)",
        }}
      />
    </div>
  );
}
