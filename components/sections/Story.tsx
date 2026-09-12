"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

import { AmbientFilm } from "@/components/AmbientFilm";
import { Divider, SealMark } from "@/components/ui/Ornaments";
import { useCapability } from "@/lib/useCapability";
import { useNearViewport } from "@/lib/useNearViewport";
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
  const { ref: nearRef, near } = useNearViewport<HTMLElement>();
  const capability = useCapability();
  const ref = useRef<HTMLDivElement>(null);
  const prose = useRef<HTMLDivElement>(null);
  const live = useRef(0);

  // The parchment is a WebGL context and a render loop. It should exist while
  // the story is being read and not for the whole visit — it used to mount on
  // page load and draw continuously, several screens below a guest who was
  // still looking at a sealed envelope.
  // The paper unrolling as the story is read is motion, so it is not shown
  // to a guest who asked for less of it.
  const useWebGL =
    near && capability.ready && capability.webgl && !capability.reducedMotion && content.motion.webgl;

  /* How far through the story the reader is, written straight to the element
     every frame.
     
     Deliberately not React state. This drives one custom property, which in
     turn fades in one hundred and eighty-odd words — and putting it through
     state re-rendered that entire tree of spans, and re-split the story text
     to build it, sixty times a second for as long as the section was on
     screen. One property write costs nothing; the render behind it cost
     everything. */
  useEffect(() => {
    const el = prose.current;
    if (!el) return;

    if (capability.reducedMotion) {
      // The words are the point; the sequence is decoration. Show it all.
      el.style.setProperty("--told", "1");
      live.current = 1;
      return;
    }
    if (!near) return;

    let frame = 0;
    let last = -1;
    const tick = () => {
      const box = ref.current?.getBoundingClientRect();
      if (box && box.height > 0) {
        const told = Math.min(1, Math.max(0, (window.innerHeight / 2 - box.top) / box.height));
        if (Math.abs(told - last) > 0.002) {
          last = told;
          live.current = told;
          el.style.setProperty("--told", told.toFixed(4));
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [near, capability.reducedMotion]);

  if (!content.story.enabled || !content.story.paragraphs.length) return null;

  // One running index across the whole story, so the words arrive in the
  // order they are read rather than restarting each paragraph.
  let spoken = 0;
  const total = content.story.paragraphs.join(" ").split(/\s+/).length;

  return (
    <section
      ref={nearRef}
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
