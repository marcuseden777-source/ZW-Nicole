"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { HeroFilm } from "@/components/HeroFilm";
import { useCapability } from "@/lib/useCapability";
import { useScrollProgress } from "@/lib/useScrollProgress";
import { Divider, SealMark } from "@/components/ui/Ornaments";
import * as content from "@/content/wedding";

// The 3D layer is fetched only once we know the device wants it, and never
// renders on the server. Guests on a modest phone pay nothing for it.
const Scene = dynamic(() => import("@/components/three/Scene").then((m) => m.Scene), {
  ssr: false,
});

export function Hero() {
  const { ref, progress: scrolled, live } = useScrollProgress<HTMLDivElement>();
  const capability = useCapability();
  const { opened, open, openedProgress } = useOpenOnClick();

  // Either gesture opens the letter: a tap, or simply reading on. Whichever
  // has gone further wins, so the two never fight each other.
  const progress = Math.max(scrolled, openedProgress);
  live.current = Math.max(live.current, openedProgress);

  const useWebGL = capability.ready && capability.webgl && content.motion.webgl;
  const petalCount = capability.lowPower
    ? Math.round(content.motion.petalCount * 0.45)
    : content.motion.petalCount;

  // The invitation to scroll fades as soon as the guest starts.
  const promptOpacity = Math.max(0, 1 - progress * 6);
  // The names arrive only once the envelope has begun to withdraw, so the two
  // are never competing for the same space.
  const revealed = Math.min(1, Math.max(0, (progress - 0.74) / 0.2));

  return (
    <section
      ref={ref}
      aria-label="The invitation, sealed"
      className="relative h-[260vh]"
    >
      <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
        <HeroFilm reducedMotion={capability.reducedMotion} />

        {useWebGL ? (
          <div className="absolute inset-0" data-no-print>
            <Scene
              progress={live}
              monogram={content.couple.monogram}
              petalCount={petalCount}
              lowPower={capability.lowPower}
            />
          </div>
        ) : (
          <PaperEnvelope openness={progress} monogram={content.couple.monogram} />
        )}

        {/* The words sit above the envelope and are always present, whether or
            not the three-dimensional layer ever loads. */}
        <div className="pointer-events-none relative z-10 flex flex-col items-center px-[var(--gutter)] text-center">
          <div
            style={{ opacity: revealed, transform: `translateY(${(1 - revealed) * 1.5}rem)` }}
            className="transition-opacity duration-300"
            // Hidden from assistive technology and from tab order until it has
            // actually arrived; the same words are repeated under the arch.
            aria-hidden="true"
          >
            <p className="u-eyebrow mb-5" style={{ color: "var(--color-champagne)" }}>
              {content.opening.eyebrow}
            </p>
            <h1 className="u-script u-foil text-[clamp(3rem,12vw,7rem)]">
              <span className="block">{content.couple.partnerOne.name}</span>
              <span className="my-1 block text-[0.45em] not-italic">
                {content.couple.ampersand}
              </span>
              <span className="block">{content.couple.partnerTwo.name}</span>
            </h1>
            <Divider className="mx-auto my-7" />
            <p
              className="u-display text-[clamp(0.85rem,2.6vw,1.05rem)] uppercase tracking-[0.2em]"
              style={{ color: "var(--color-parchment)" }}
            >
              {content.weddingDate.display}
            </p>
          </div>
        </div>

        {/* The whole envelope is the control. A guest should not have to
            discover that scrolling is the only way in — and a keyboard or
            screen-reader user could not have discovered it at all. */}
        {!opened && (
          <button
            type="button"
            onClick={open}
            className="absolute inset-0 z-20 cursor-pointer"
            style={{ opacity: promptOpacity }}
            data-no-print
          >
            <span className="sr-only">
              Open the invitation from {content.couple.partnerOne.name} and{" "}
              {content.couple.partnerTwo.name}
            </span>
          </button>
        )}

        {/* Prompt */}
        <div
          className="pointer-events-none absolute bottom-[clamp(1.5rem,5vh,3rem)] left-0 right-0 z-10 flex flex-col items-center gap-2"
          style={{ opacity: promptOpacity }}
          data-no-print
        >
          <p className="u-eyebrow" style={{ color: "var(--color-parchment)" }}>
            Tap to open
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
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 -3; 0 3; 0 -3"
                dur="2.4s"
                repeatCount="indefinite"
              />
            </path>
          </svg>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
 *  The envelope in paper and CSS, for guests whose device cannot or should
 *  not run WebGL. It is not a placeholder — it opens on scroll exactly as the
 *  three-dimensional one does, and nobody arriving here should feel they were
 *  handed the lesser invitation.
 * ─────────────────────────────────────────────────────────────────────────── */
function PaperEnvelope({ openness, monogram }: { openness: number; monogram: string }) {
  const crack = Math.min(1, Math.max(0, (openness - 0.12) / 0.26));
  const swing = Math.min(1, Math.max(0, (openness - 0.3) / 0.42));
  const lift = Math.min(1, Math.max(0, (openness - 0.52) / 0.4));
  const withdraw = Math.min(1, Math.max(0, (openness - 0.72) / 0.22));

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ perspective: "1400px" }}
      aria-hidden="true"
      data-no-print
    >
      <div
        className="relative aspect-[1/1.45] w-[min(74vw,26rem)]"
        style={{
          transformStyle: "preserve-3d",
          transform: `translateY(${-openness * 14}%) rotateX(${6 - openness * 4}deg) scale(${1 - withdraw * 0.12})`,
          opacity: 1 - withdraw,
          transition: "opacity 200ms linear",
        }}
      >
        {/* The body */}
        <div className="absolute inset-0 rounded-[4%] bg-gradient-to-br from-[#fdf8ef] via-[#f7f0e3] to-[#eee2cd] shadow-[0_40px_90px_-30px_rgba(90,70,40,0.45)]" />

        {/* The folded panels, drawn as the same V the reference shows */}
        <svg viewBox="0 0 100 145" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="panel-a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fffaf2" />
              <stop offset="100%" stopColor="#f0e6d5" />
            </linearGradient>
            <linearGradient id="panel-b" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fdf7ec" />
              <stop offset="100%" stopColor="#ebdfcb" />
            </linearGradient>
          </defs>
          <polygon points="0,0 50,72.5 0,145" fill="url(#panel-a)" stroke="#e0d0b6" strokeWidth="0.3" />
          <polygon points="100,0 50,72.5 100,145" fill="url(#panel-b)" stroke="#e0d0b6" strokeWidth="0.3" />
          <polygon points="0,145 50,72.5 100,145" fill="url(#panel-a)" stroke="#e0d0b6" strokeWidth="0.3" />
        </svg>

        {/* The hinged top panel */}
        <div
          className="absolute inset-x-0 top-0 h-1/2 origin-top"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${swing * 146}deg)`,
            transition: "transform 120ms linear",
          }}
        >
          <svg viewBox="0 0 100 72.5" className="h-full w-full" preserveAspectRatio="none">
            <polygon
              points="0,0 100,0 50,72.5"
              fill="url(#panel-b)"
              stroke="#ddcbaf"
              strokeWidth="0.3"
            />
          </svg>
        </div>

        {/* The wax seal, breaking in two */}
        <div className="absolute left-1/2 top-1/2 h-[22%] w-[22%] -translate-x-1/2 -translate-y-1/2">
          {(["left", "right"] as const).map((side) => {
            const dir = side === "left" ? -1 : 1;
            return (
              <div
                key={side}
                className="absolute inset-0 overflow-hidden"
                style={{
                  clipPath: side === "left" ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)",
                  transform: `translate(${dir * crack * 120}%, ${crack * crack * 180}%) rotate(${dir * crack * 70}deg)`,
                  opacity: 1 - crack,
                  transition: "transform 120ms linear, opacity 120ms linear",
                }}
              >
                <SealMark monogram={monogram} className="h-full w-full drop-shadow-md" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Opening the letter by hand.
 *
 * A tap runs the same 0→1 the scroll drives, over a couple of unhurried
 * seconds — long enough for the wax to give, the flap to swing and the card
 * to rise, which is the whole point of the gesture.
 */
function useOpenOnClick() {
  const [opened, setOpened] = useState(false);
  const [openedProgress, setOpenedProgress] = useState(0);
  const startedAt = useRef(0);

  const open = useCallback(() => setOpened(true), []);

  useEffect(() => {
    if (!opened) return;

    // Reduced motion means arriving, not travelling.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOpenedProgress(1);
      return;
    }

    const DURATION = 2600;
    startedAt.current = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt.current) / DURATION);
      // Eased out, so the flap settles rather than stopping dead.
      setOpenedProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [opened]);

  return { opened, open, openedProgress };
}
