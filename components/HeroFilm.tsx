"use client";

import { useEffect, useRef, useState } from "react";
import * as content from "@/content/wedding";

/**
 * The film behind the envelope.
 *
 * Which cut is downloaded is decided in JavaScript rather than with <source
 * media> attributes: browsers disagree about media on video sources, and
 * getting it wrong means a phone quietly downloading the laptop cut. The
 * browser then picks its own codec from the two sources of that cut.
 */
export function HeroFilm({ reducedMotion }: { reducedMotion: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [cut, setCut] = useState<{ webm: string; mp4: string; poster: string } | null>(null);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 768px)").matches;
    setCut(wide ? content.heroFilm.desktop : content.heroFilm.mobile);
  }, []);

  useEffect(() => {
    const el = video.current;
    if (!el || !cut || reducedMotion) return;
    // Autoplay is refused often enough that it has to be asked for and then
    // forgiven: the poster frame is a perfectly good landing on its own.
    el.play().catch(() => {});
  }, [cut, reducedMotion]);

  if (!content.heroFilm.enabled || !cut) return null;

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true" data-no-print>
      <video
        ref={video}
        poster={cut.poster}
        // A guest who asked for less motion gets the still frame, not the film.
        autoPlay={!reducedMotion}
        loop={!reducedMotion}
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      >
        {/* VP9 first: roughly half the bytes, and everything except Safari
            takes it. H.264 catches Safari and iOS. */}
        <source src={cut.webm} type="video/webm" />
        <source src={cut.mp4} type="video/mp4" />
      </video>

      {/* Dimmed, so cream paper reads against a dusk sky, and faded into the
          page colour at the foot so the section below does not begin abruptly. */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(28, 22, 14, ${content.heroFilm.scrim})` }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-2/5"
        style={{
          background:
            "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--color-ivory) 88%, transparent) 72%, var(--color-ivory) 100%)",
        }}
      />
    </div>
  );
}
