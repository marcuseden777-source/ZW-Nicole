"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

import { AmbientFilm } from "@/components/AmbientFilm";
import { Divider, SealMark } from "@/components/ui/Ornaments";
import { useCapability } from "@/lib/useCapability";
import { useSectionProgress } from "@/lib/useSectionProgress";
import * as content from "@/content/wedding";
import type { FilmSources } from "@/lib/media";

const ParchmentScroll = dynamic(
  () => import("@/components/three/ParchmentScroll").then((m) => m.ParchmentScroll),
  { ssr: false },
);

/**
 * How the two of them found each other, written on a scroll that unrolls as
 * it is read, the words arriving as if spoken aloud.
 *
 * The paper is WebGL; the words are real HTML in front of it. A canvas cannot
 * be selected, searched, translated or read aloud, and a couple's own story is
 * the last thing on this page that should become a picture of text.
 *
 * Every word derives its own opacity from one CSS custom property on the
 * container, so a two-hundred-word reveal costs a single style write per
 * frame instead of two hundred React renders.
 */
export function Story({ film }: { film: FilmSources | null }) {
  const { ref, progress } = useSectionProgress<HTMLDivElement>();
  const capability = useCapability();
  const prose = useRef<HTMLDivElement>(null);
  const live = useRef(0);

  const useWebGL = capability.ready && capability.webgl && content.motion.webgl;

  useEffect(() => {
    live.current = progress;
    const el = prose.current;
    if (!el) return;
    // Reduced motion gets the whole story at once — the words are the point,
    // the sequence is decoration.
    el.style.setProperty("--told", capability.reducedMotion ? "1" : String(progress));
  }, [progress, capability.reducedMotion]);

  if (!content.story.enabled || !content.story.paragraphs.length) return null;

  // One running index across the whole story, so the words arrive in the
  // order they are read rather than restarting each paragraph.
  let spoken = 0;
  const total = content.story.paragraphs.join(" ").split(/\s+/).length;

  return (
    <section
      aria-labelledby="story-heading"
      className="relative z-[1] overflow-hidden px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
    >
      <AmbientFilm film={film} opacity={content.ambient.story.opacity} />

      <div ref={ref} className="relative mx-auto max-w-2xl">
        {/* The paper. Sits behind the words and never competes with them. */}
        {useWebGL && (
          <div
            className="pointer-events-none absolute -inset-x-[6%] -top-[10%] h-[125%]"
            aria-hidden="true"
            data-no-print
          >
            <ParchmentScroll progress={live} lowPower={capability.lowPower} />
          </div>
        )}

        <header className="relative text-center">
          <h2
            id="story-heading"
            className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep"
          >
            {content.story.heading}
          </h2>
          <Divider className="mx-auto mt-5" />
        </header>

        <div
          ref={prose}
          className="relative mt-[clamp(2.5rem,7vh,4rem)] space-y-6"
          style={{ "--told": "0" } as React.CSSProperties}
        >
          {content.story.paragraphs.map((paragraph, p) => (
            <p
              key={p}
              // Held to a comfortable measure. 42rem of Cormorant runs past a
              // hundred characters a line; sixty-eight is where the eye wants
              // to turn.
              className="u-display mx-auto max-w-[34em] text-pretty text-[clamp(1rem,3.1vw,1.15rem)] leading-[1.9] text-ink-soft"
            >
              {paragraph.split(/\s+/).map((word, w) => {
                const i = spoken++;
                return (
                  <span
                    key={w}
                    className="u-word"
                    style={{ "--i": i, "--n": total } as React.CSSProperties}
                  >
                    {word}{" "}
                  </span>
                );
              })}
            </p>
          ))}
        </div>

        {content.verse.enabled && (
          <figure
            className="u-reveal relative mt-[clamp(2.5rem,8vh,4rem)] border-y py-9 text-center"
            style={{ borderColor: "var(--rule)" }}
          >
            <blockquote className="u-display mx-auto max-w-[32em] text-balance text-[clamp(1.05rem,3.3vw,1.3rem)] italic leading-relaxed text-ink-soft">
              &ldquo;{content.verse.text}&rdquo;
            </blockquote>
            {content.verse.attribution && (
              <figcaption className="u-eyebrow mt-5">{content.verse.attribution}</figcaption>
            )}
          </figure>
        )}

        <SealMark
          monogram={content.couple.monogram}
          className="u-reveal relative mx-auto mt-[clamp(2.5rem,7vh,4rem)] h-16 w-16"
        />
      </div>
    </section>
  );
}
