"use client";

import { useEffect, useRef, useState } from "react";

type Cut = { webm?: string; mp4?: string; poster?: string };

/**
 * A quiet film behind a section.
 *
 * Sits at low opacity under the type, never competing with it. Which cut is
 * fetched is decided here rather than with <source media>, so a phone never
 * quietly downloads the laptop file.
 *
 * It renders nothing at all unless switched on in content/wedding.ts, so a
 * slot whose film has not been produced yet costs the guest no request and
 * shows no broken frame — the section simply looks as it always did.
 */
export function AmbientFilm({
  desktop,
  mobile,
  opacity = 0.22,
  enabled,
}: {
  desktop: Cut;
  mobile: Cut;
  opacity?: number;
  enabled: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [cut, setCut] = useState<Cut | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setCut(window.matchMedia("(min-width: 768px)").matches ? desktop : mobile);
  }, [enabled, desktop, mobile]);

  useEffect(() => {
    const el = video.current;
    if (!el || !cut || reduced) return;
    el.play().catch(() => {});
  }, [cut, reduced]);

  if (!enabled || !cut) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
      data-no-print
    >
      <video
        ref={video}
        poster={cut.poster}
        autoPlay={!reduced}
        loop={!reduced}
        muted
        playsInline
        preload="none"
        className="h-full w-full object-cover"
        style={{ opacity }}
      >
        {cut.webm && <source src={cut.webm} type="video/webm" />}
        {cut.mp4 && <source src={cut.mp4} type="video/mp4" />}
      </video>

      {/* The page colour still has to win — this is a texture, not a picture. */}
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
