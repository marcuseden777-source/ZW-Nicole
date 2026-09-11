"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { SealMark } from "@/components/ui/Ornaments";
import { useCapability } from "@/lib/useCapability";
import { useEntryGate } from "@/lib/useEntryGate";
import type { FilmSources } from "@/lib/media";
import * as content from "@/content/wedding";

// The 3D layer is fetched only once we know the device wants it, and never on
// the server. A guest on a modest phone pays nothing for it.
const Scene = dynamic(() => import("@/components/three/Scene").then((m) => m.Scene), {
  ssr: false,
});

/**
 * The door.
 *
 * A full-viewport gate holding the sealed envelope. Tapping it breaks the wax,
 * swings the flap and lifts the card out; the gate then clears away to the
 * film beneath and unmounts entirely.
 *
 * It is mounted only on the client, above a page that is already complete in
 * the HTML. A crawler, a link-preview bot and a guest with JavaScript off all
 * get the invitation itself and never see a door at all — which is the point:
 * a gate should be a gift to the people who can enjoy it, never a wall to
 * everyone else.
 */
export function EntryGate({ bloom }: { bloom: FilmSources | null }) {
  const capability = useCapability();

  // A guest who asked their system for reduced motion never meets the door at
  // all. Snapping it open in front of them is still a thing that happened on
  // screen; not mounting it is the honest reading of the request.
  const { stage, progress, live, open, mounted } = useEntryGate({
    openDuration: content.door.openDuration,
    clearDuration: content.door.clearDuration,
    rememberForSession: content.door.rememberForSession,
    ready: capability.ready,
    reducedMotion: capability.reducedMotion,
  });

  const button = useRef<HTMLButtonElement>(null);

  // The page is held hidden from before first paint until the door is
  // actually up — or until it is settled that there will not be one, because
  // they asked for reduced motion or have already come through this session.
  //
  // Deliberately not released on "the device has been measured": that is one
  // commit earlier than the door rendering, and the page showed through the
  // gap. `mounted` and `done` are the two states where releasing is safe,
  // and this effect runs after the commit that produced them.
  useEffect(() => {
    if (!mounted && stage !== "done") return;
    document.documentElement.classList.remove("gating");
  }, [mounted, stage]);

  // Send focus to the door as soon as it exists, so a keyboard guest is not
  // tabbing blindly through a page they cannot see.
  useEffect(() => {
    if (stage === "sealed" && mounted) button.current?.focus();
  }, [stage, mounted]);

  // Nobody should be able to tab into a page they cannot see. `inert` is
  // native containment — it removes the whole subtree from the tab order and
  // from assistive technology, with no key handler to get wrong, and it does
  // not stop the hero film decoding behind the door.
  useEffect(() => {
    const root = document.getElementById("site-root");
    if (!root) return;
    const gated = mounted && stage !== "done";
    if (gated) root.setAttribute("inert", "");
    else root.removeAttribute("inert");
    return () => root.removeAttribute("inert");
  }, [stage, mounted]);

  // When the door finishes and unmounts, the element that had focus goes with
  // it and focus falls to <body>. A sighted guest never notices; a guest using
  // a screen reader loses their place in the document entirely and has to
  // start again from the top. So hand focus deliberately to the start of the
  // invitation — which is where opening the door was asking to go.
  useEffect(() => {
    if (stage !== "done" || !mounted) return;
    const main = document.querySelector<HTMLElement>("#site-root main");
    if (!main) return;
    main.focus({ preventScroll: true });
  }, [stage, mounted]);

  // Escape opens it too — nobody should feel shut out by a decoration.
  useEffect(() => {
    if (stage !== "sealed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") open();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, open]);

  if (!mounted || stage === "done") return null;

  const useWebGL = capability.ready && capability.webgl && content.motion.webgl;
  const clearing = stage === "entering";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`An invitation from ${content.couple.partnerOne.name} and ${content.couple.partnerTwo.name}`}
      className="u-vignette u-grain fixed inset-0 z-50 overflow-hidden"
      style={{
        background: "var(--color-ivory)",
        // The gate lifts and fades as one movement, then stops receiving
        // anything at all so it can never intercept a tap on the page below.
        opacity: clearing ? 0 : 1,
        transform: clearing ? "scale(1.06)" : "none",
        transition: capability.reducedMotion
          ? "none"
          : `opacity ${content.door.clearDuration}ms cubic-bezier(0.22,1,0.36,1), transform ${content.door.clearDuration}ms cubic-bezier(0.22,1,0.36,1)`,
        pointerEvents: clearing ? "none" : "auto",
      }}
      aria-hidden={clearing}
      data-no-print
    >
      {/* Warm ground, so the envelope sits in candlelight rather than on a
          sheet of screen-white. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 38%, #ffffff 0%, var(--color-ivory) 42%, var(--color-champagne) 100%)",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        {useWebGL ? (
          <Scene
            progress={live}
            monogram={content.couple.monogram}
            petalCount={capability.lowPower ? 90 : 220}
            lowPower={capability.lowPower}
          />
        ) : (
          <PaperEnvelope openness={progress} monogram={content.couple.monogram} />
        )}
      </div>

      {/* Petals opening over the letter as the wax gives way, so the door
          blooms into the film beneath rather than simply dissolving. */}
      <DoorBloom film={bloom} openness={live} playing={stage !== "sealed"} />

      {/* The whole door is the control. Nobody should have to discover that
          a decoration was secretly the way in. */}
      <button
        ref={button}
        type="button"
        onClick={open}
        disabled={stage !== "sealed"}
        className="absolute inset-0 z-10 cursor-pointer disabled:cursor-default"
      >
        <span className="sr-only">
          Open the invitation from {content.couple.partnerOne.name} and{" "}
          {content.couple.partnerTwo.name}
        </span>
      </button>

      <p
        className="u-eyebrow pointer-events-none absolute inset-x-0 bottom-[clamp(2rem,7vh,4rem)] z-10 text-center"
        style={{
          opacity: stage === "sealed" ? 1 : 0,
          transition: "opacity 500ms ease",
        }}
      >
        {content.door.prompt}
      </p>
    </div>
  );
}

/**
 * The bloom over the door.
 *
 * Cream petals opening toward the lens, brought up as the seal breaks so the
 * envelope is carried into the film rather than cut to it. Its opacity is
 * written straight to the element from the door's own live position — putting
 * a sixty-times-a-second fade through React state would re-render the whole
 * gate, envelope and all, for the sake of one number.
 *
 * Renders nothing when the film has not been dropped into /public/ambient,
 * which is the situation until someone does. The door then clears exactly as
 * it always has.
 */
function DoorBloom({
  film,
  openness,
  playing,
}: {
  film: FilmSources | null;
  openness: { current: number };
  playing: boolean;
}) {
  const layer = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [cut, setCut] = useState<FilmSources["desktop"] | null>(null);

  useEffect(() => {
    if (!film) return;
    setCut(window.matchMedia("(min-width: 768px)").matches ? film.desktop : film.mobile);
  }, [film]);

  useEffect(() => {
    if (!playing || !cut) return;
    video.current?.play().catch(() => {});

    let frame = 0;
    const tick = () => {
      const el = layer.current;
      if (el) {
        // Nothing until the wax has actually broken, then all the way up.
        const t = Math.min(1, Math.max(0, (openness.current - 0.34) / 0.5));
        el.style.opacity = String(t * content.ambient.bloom.opacity);
        el.style.transform = `scale(${(1.18 - t * 0.14).toFixed(3)})`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, cut, openness]);

  if (!film || !cut) return null;

  return (
    <div
      ref={layer}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ opacity: 0, transform: "scale(1.18)", mixBlendMode: "screen" }}
      aria-hidden="true"
      data-no-print
    >
      <video
        ref={video}
        muted
        playsInline
        loop
        preload="auto"
        poster={cut.poster}
        className="h-full w-full object-cover"
      >
        {cut.webm && <source src={cut.webm} type="video/webm" />}
        {cut.mp4 && <source src={cut.mp4} type="video/mp4" />}
      </video>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
 *  The envelope in paper and CSS, for guests whose device cannot or should not
 *  run WebGL. It is not a placeholder — it opens exactly as the
 *  three-dimensional one does, and nobody arriving here should feel they were
 *  handed the lesser invitation.
 * ─────────────────────────────────────────────────────────────────────────── */
function PaperEnvelope({ openness, monogram }: { openness: number; monogram: string }) {
  const crack = clamp((openness - 0.12) / 0.26);
  const swing = clamp((openness - 0.3) / 0.42);
  const lift = clamp((openness - 0.52) / 0.4);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ perspective: "1400px" }}
      aria-hidden="true"
    >
      <div
        className="relative aspect-[1/1.45] w-[min(74vw,24rem)]"
        style={{
          transformStyle: "preserve-3d",
          transform: `translateY(${-openness * 6}%) rotateX(${5 - openness * 3}deg)`,
        }}
      >
        {/* The card, sliding out of the pocket */}
        <div
          className="absolute inset-x-[6%] top-[6%] h-[86%] rounded-[3%] bg-gradient-to-b from-[#fffdf8] to-[#f6efe2] shadow-[0_18px_40px_-24px_rgba(90,70,40,0.5)]"
          style={{ transform: `translateY(${-lift * 46}%)` }}
        />

        {/* The body */}
        <div className="absolute inset-0 rounded-[3%] bg-gradient-to-br from-[#fdf8ef] via-[#f8f2e6] to-[#efe4d1] shadow-[0_40px_90px_-30px_rgba(90,70,40,0.45)]" />

        {/* The folded panels */}
        <svg viewBox="0 0 100 145" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="gate-panel-a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fffaf2" />
              <stop offset="100%" stopColor="#f0e6d5" />
            </linearGradient>
            <linearGradient id="gate-panel-b" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fdf7ec" />
              <stop offset="100%" stopColor="#ebdfcb" />
            </linearGradient>
          </defs>
          <polygon points="0,0 50,72.5 0,145" fill="url(#gate-panel-a)" stroke="#e4d6bd" strokeWidth="0.25" />
          <polygon points="100,0 50,72.5 100,145" fill="url(#gate-panel-b)" stroke="#e4d6bd" strokeWidth="0.25" />
          <polygon points="0,145 50,72.5 100,145" fill="url(#gate-panel-a)" stroke="#e4d6bd" strokeWidth="0.25" />
        </svg>

        {/* The hinged top panel */}
        <div
          className="absolute inset-x-0 top-0 h-1/2 origin-top"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${swing * 148}deg)`,
            transition: "transform 90ms linear",
          }}
        >
          <svg viewBox="0 0 100 72.5" className="h-full w-full" preserveAspectRatio="none">
            <polygon points="0,0 100,0 50,72.5" fill="url(#gate-panel-b)" stroke="#ddcbaf" strokeWidth="0.25" />
          </svg>
        </div>

        {/* The wax seal, breaking in two */}
        <div className="absolute left-1/2 top-1/2 h-[21%] w-[21%] -translate-x-1/2 -translate-y-1/2">
          {(["left", "right"] as const).map((side) => {
            const dir = side === "left" ? -1 : 1;
            return (
              <div
                key={side}
                className="absolute inset-0 overflow-hidden"
                style={{
                  clipPath: side === "left" ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)",
                  transform: `translate(${dir * crack * 130}%, ${crack * crack * 190}%) rotate(${dir * crack * 75}deg)`,
                  opacity: 1 - crack,
                  transition: "transform 90ms linear, opacity 90ms linear",
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

function clamp(v: number) {
  return Math.min(1, Math.max(0, v));
}
