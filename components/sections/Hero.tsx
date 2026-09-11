"use client";

import { HeroFilm } from "@/components/HeroFilm";
import { Divider } from "@/components/ui/Ornaments";
import { useCapability } from "@/lib/useCapability";
import * as content from "@/content/wedding";

/**
 * The room behind the door.
 *
 * Once the envelope has been opened and cleared away, this is what the guest
 * arrives in: the film full-bleed, their names across it, and the date. The
 * envelope is no longer part of this section at all — it is the way in, and a
 * door that stays in the room is just furniture.
 */
export function Hero() {
  const capability = useCapability();

  return (
    <section aria-labelledby="hero-heading" className="relative h-[100svh] min-h-[34rem]">
      <HeroFilm reducedMotion={capability.reducedMotion} />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-[var(--gutter)] text-center">
        <p className="u-eyebrow" style={{ color: "var(--color-champagne)" }}>
          {content.opening.eyebrow}
        </p>

        <h1
          id="hero-heading"
          className="u-script mt-6 text-[clamp(3.25rem,13vw,8rem)]"
          style={{
            // Foil reads as muddy over a dusk sky; on film the names want to
            // be light, with a soft lift off the background behind them.
            color: "#fdf6e8",
            textShadow: "0 2px 28px rgba(30,22,12,0.55), 0 1px 3px rgba(30,22,12,0.4)",
          }}
        >
          <span className="block">{content.couple.partnerOne.name}</span>
          <span className="my-1 block text-[0.4em] opacity-80">{content.couple.ampersand}</span>
          <span className="block">{content.couple.partnerTwo.name}</span>
        </h1>

        <Divider className="mx-auto my-8 opacity-80" />

        <p
          className="u-display text-[clamp(0.85rem,2.6vw,1.05rem)] uppercase tracking-[0.24em]"
          style={{ color: "var(--color-parchment)" }}
        >
          {content.weddingDate.display}
        </p>
        <p className="u-eyebrow mt-3" style={{ color: "var(--color-champagne)" }}>
          {content.weddingDate.place}
        </p>
      </div>

      {/* Scroll cue */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[clamp(1.5rem,5vh,3rem)] z-10 flex flex-col items-center gap-2"
        data-no-print
        // Hidden on a screen too short to hold it and the date at once — see
        // the rule in globals.css. A phone held sideways is the case.
        data-scroll-cue
      >
        <p className="u-eyebrow" style={{ color: "var(--color-champagne)" }}>
          Scroll
        </p>
        <svg viewBox="0 0 24 32" className="h-7 w-5" aria-hidden="true">
          <path
            d="M12 4 V24 M5 17 L12 25 L19 17"
            fill="none"
            stroke="var(--color-champagne)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* SMIL is not CSS: the global `animation-duration: 0.001ms`
                under prefers-reduced-motion cannot touch it, so this was the
                one thing on the page that kept moving after being asked to
                stop. It is now simply not rendered. */}
            {!capability.reducedMotion && (
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 -3; 0 3; 0 -3"
                dur="2.4s"
                repeatCount="indefinite"
              />
            )}
          </path>
        </svg>
      </div>
    </section>
  );
}
