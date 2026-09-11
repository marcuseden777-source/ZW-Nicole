"use client";

import { useEffect, useRef, useState } from "react";
import * as content from "@/content/wedding";

/**
 * The film behind the names.
 *
 * The important thing here is not the film — it is that the names are legible
 * before the film exists, and whether or not it ever arrives.
 *
 * They are set in near-white, because on a dusk sky that is what they want to
 * be. But this component used to render nothing at all until a client effect
 * had chosen a cut, so the server's HTML had no film, no still and no scrim:
 * the page shipped with "Zhi Wei & Nicole" in #fdf6e8 on #fbf7f0 ivory. That
 * is a contrast ratio of 1.01 to 1. A guest with JavaScript off, a link
 * preview bot, and everyone in the moment before hydration got an invitation
 * with the couple's names invisible on it.
 *
 * So the ground, the still frame and the scrims are all rendered on the
 * server, and the film is laid over them afterwards. Nothing the client does
 * or fails to do can now take the names away.
 */
export function HeroFilm({ reducedMotion }: { reducedMotion: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [cut, setCut] = useState<{ webm: string; mp4: string; poster: string } | null>(null);

  useEffect(() => {
    if (!content.heroFilm.enabled) return;
    // Which cut is downloaded is decided here rather than with <source media>:
    // browsers disagree about `media` on video sources, and getting it wrong
    // means a phone quietly downloading the laptop cut.
    const wide = window.matchMedia("(min-width: 768px)").matches;
    setCut(wide ? content.heroFilm.desktop : content.heroFilm.mobile);
  }, []);

  useEffect(() => {
    const el = video.current;
    if (!el || !cut || reducedMotion) return;
    // Autoplay is refused often enough that it has to be asked for and then
    // forgiven: the still frame is a perfectly good landing on its own.
    el.play().catch(() => {});
  }, [cut, reducedMotion]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true" data-no-print>
      {/* The ground. Rendered on the server, and dark enough on its own that
          the names read against it even if every file below fails to load. */}
      <div className="absolute inset-0" style={{ backgroundColor: "#241b10" }} />

      {content.heroFilm.enabled && (
        <>
          {/* The still frame, in the HTML from the start. `media` on a
              <source> is reliable for pictures in a way it is not for video,
              so each screen fetches only its own cut — and this is what the
              browser paints as the largest element, rather than waiting for
              JavaScript to decide anything. */}
          <picture>
            <source
              media="(min-width: 768px)"
              srcSet={content.heroFilm.desktop.poster}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={content.heroFilm.mobile.poster}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              fetchPriority="high"
              decoding="async"
            />
          </picture>

          {cut && (
            <video
              ref={video}
              poster={cut.poster}
              // A guest who asked for less motion keeps the still frame.
              autoPlay={!reducedMotion}
              loop={!reducedMotion}
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
            >
              {/* VP9 first: roughly half the bytes, and everything except
                  Safari takes it. H.264 catches Safari and iOS. */}
              <source src={cut.webm} type="video/webm" />
              <source src={cut.mp4} type="video/mp4" />
            </video>
          )}
        </>
      )}

      {/* Dimmed so the names read against a dusk sky, weighted top and bottom
          where the type actually sits rather than flatly across the frame —
          a uniform scrim costs the sky its colour for no benefit. */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(28, 22, 14, ${content.heroFilm.scrim})` }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(24,18,10,0.34) 0%, transparent 26%, transparent 62%, rgba(24,18,10,0.42) 100%)",
        }}
      />
      {/* The last inch hands over to the page colour, so the section below
          begins rather than starts. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[14%]"
        style={{
          background:
            "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--color-ivory) 80%, transparent) 70%, var(--color-ivory) 100%)",
        }}
      />
    </div>
  );
}
