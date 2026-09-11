"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Lightbox } from "@/components/ui/Lightbox";
import { Divider } from "@/components/ui/Ornaments";
import type { Photo } from "@/lib/media";
import * as content from "@/content/wedding";

/**
 * The reel of photographs.
 *
 * Built from CSS 3D rather than WebGL on purpose. These are pictures people
 * want to open, and inside a canvas a photograph is not a link: it cannot be
 * tabbed to, cannot be described to a screen reader, cannot be saved and does
 * not exist for a crawler. Here each one is a real <button> around a real
 * <Image>, arranged on a shallow arc that the page scroll turns.
 *
 * The one decision everything else follows from: EVERY CARD IS THE SAME
 * HEIGHT AND ITS OWN WIDTH. A wedding set is portrait and landscape mixed
 * together — the ceremony shot upright, the long table wide — and a carousel
 * of identical frames has to crop most of them to fit. Cropping a wedding
 * photograph is not a layout decision, it is throwing away the bit the
 * photographer chose. So the frames vary instead, which is also what a
 * contact sheet looks like, and nothing is ever cut.
 *
 * Without JavaScript, and for anyone who asked for reduced motion, this is a
 * plain horizontal strip that scrolls and snaps. That version is not a
 * degraded fallback bolted on afterwards; it is what the markup actually is,
 * and the arc is layered on top of it.
 */

/**
 * The widest and narrowest a card may be, as a multiple of its height.
 *
 * Every shape a camera actually produces sits inside this — 2:3 is 0.67, 3:2
 * is 1.5, 4:3 is 1.33, 16:9 is 1.78 — so in practice nothing is cropped. The
 * clamp exists for the stitched panorama and the extreme crop, which would
 * otherwise be wider than the screen or thinner than a finger. Those two are
 * eased in at the edges, and the lightbox still shows them whole.
 */
const WIDEST = 1.9;
const NARROWEST = 0.55;

/** How far from the centre a card still earns a transform. */
const WINDOW = 5;

/**
 * The space between cards, as a fraction of their shared height.
 *
 * This number appears twice — once in the arithmetic that decides where each
 * card sits along the reel, and once as the gap the browser actually lays
 * out. They have to be the same number or the two disagree a little at every
 * card and the reel walks out of centre as you go along it.
 */
const GAP = 0.08;

export function Carousel({ photos }: { photos: Photo[] }) {
  const count = photos.length;

  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const cards = useRef<(HTMLLIElement | null)[]>([]);

  /** Live position along the reel, in cards. Read every frame, never rendered. */
  const position = useRef(0);
  /** Set while the guest is steering, which suspends the scroll coupling. */
  const held = useRef<number | null>(null);

  const [open, setOpen] = useState<number | null>(null);
  const [centred, setCentred] = useState(0);
  /**
   * What to say out loud, and only when the guest did something.
   *
   * Kept separate from `centred` on purpose. `centred` changes as the page
   * scrolls, and announcing it from there meant a screen reader reading out
   * photograph names to somebody who was simply scrolling past the section
   * on their way to the address.
   */
  const [announcement, setAnnouncement] = useState("");
  const [enhanced, setEnhanced] = useState(false);

  /* Each card's width as a multiple of the shared height. Clamped at both
     ends: an extreme panorama should not push everything else off the screen,
     and a very tall crop should not become a sliver. */
  const ratios = useMemo(
    () =>
      photos.map((p) => {
        const raw = p.width / p.height;
        return Math.min(WIDEST, Math.max(NARROWEST, raw));
      }),
    [photos],
  );

  /* Where the middle of each card sits along the reel, measured in heights.
     Built once, because it depends only on the pictures. */
  const centres = useMemo(() => {
    const out: number[] = [];
    let x = 0;
    for (const r of ratios) {
      out.push(x + r / 2);
      x += r + GAP;
    }
    return out;
  }, [ratios]);

  const centreAt = useCallback(
    (p: number) => {
      if (centres.length === 0) return 0;
      const clamped = Math.min(centres.length - 1, Math.max(0, p));
      const i = Math.floor(clamped);
      const j = Math.min(centres.length - 1, i + 1);
      return centres[i] + (centres[j] - centres[i]) * (clamped - i);
    },
    [centres],
  );

  /* Only enhance once the browser has been measured and has said it wants
     motion. Before that the plain strip is what is on screen, and it is
     already correct. */
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setEnhanced(!motion.matches);
    apply();
    motion.addEventListener("change", apply);
    return () => motion.removeEventListener("change", apply);
  }, []);

  /* The loop. One place, one frame, writing straight to the DOM — the reel
     moves continuously with the scroll and React is not involved in it. */
  useEffect(() => {
    if (!enhanced || count === 0) return;

    let frame = 0;
    let announced = -1;

    const tick = () => {
      const stageEl = stage.current;
      const trackEl = track.current;
      if (!stageEl || !trackEl) {
        frame = requestAnimationFrame(tick);
        return;
      }

      const box = stageEl.getBoundingClientRect();
      const height = box.height;

      if (held.current !== null) {
        position.current = held.current;
      } else if (height > 0) {
        // How far the section has travelled past the centre line of the
        // screen, 0 to 1 — the same measure the rest of the page uses, so the
        // reel turns in step with everything else.
        const travelled = (window.innerHeight / 2 - box.top) / (box.height + window.innerHeight * 0.6);
        const eased = Math.min(1, Math.max(0, travelled));
        position.current += (eased * (count - 1) - position.current) * 0.12;
      }

      // The laid-out gap, in the same units the browser uses. A percentage
      // gap would resolve against the track's width, not the card height the
      // rest of this geometry is measured in.
      const gap = `${(height * GAP).toFixed(2)}px`;
      if (trackEl.style.gap !== gap) trackEl.style.gap = gap;

      const p = position.current;
      trackEl.style.transform = `translate3d(${(box.width / 2 - centreAt(p) * height).toFixed(2)}px, 0, 0)`;

      for (let i = 0; i < count; i++) {
        const el = cards.current[i];
        if (!el) continue;
        const d = i - p;
        const away = Math.abs(d);

        if (away > WINDOW) {
          // Far enough away to be nobody's business. Not painted, not read.
          if (el.style.visibility !== "hidden") {
            // Hiding the element that currently has focus drops focus to
            // <body> without saying so, which for a keyboard guest means
            // their place in the page silently disappears mid-scroll. Hand
            // it to the photograph in front first.
            if (el.contains(document.activeElement)) {
              const front = cards.current[Math.round(p)];
              front?.querySelector<HTMLElement>("[data-open-photo]")?.focus({ preventScroll: true });
            }
            el.style.visibility = "hidden";
            el.setAttribute("aria-hidden", "true");
          }
          continue;
        }
        if (el.style.visibility === "hidden") {
          el.style.visibility = "";
          el.removeAttribute("aria-hidden");
        }

        const turn = Math.max(-34, Math.min(34, d * -17));
        const depth = -Math.min(away, WINDOW) * 3.2;
        // The one in front lifts and comes forward, so it reads as the
        // photograph being looked at rather than merely the middle one.
        const front = Math.max(0, 1 - away);
        const lift = front * -1.5;
        const scale = 1 + front * 0.06;

        el.style.transform = `translate3d(0, ${lift.toFixed(2)}rem, ${depth.toFixed(2)}rem) rotateY(${turn.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity = String(Math.max(0.22, 1 - away * 0.24));
        el.style.zIndex = String(100 - Math.round(away * 10));
      }

      // Tell React only when the photograph in front actually changes —
      // roughly once a second while scrolling, rather than sixty times.
      const now = Math.max(0, Math.min(count - 1, Math.round(p)));
      if (now !== announced) {
        announced = now;
        setCentred(now);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);

      // Everything this loop wrote has to be taken back off, because the
      // reason it stopped may be that the guest just asked their system for
      // reduced motion — in which case the plain strip is about to render
      // through these same elements. Left behind, `visibility: hidden` and
      // `aria-hidden` would keep most of their photographs permanently
      // invisible in a carousel that no longer has any way to reveal them.
      const trackEl = track.current;
      if (trackEl) {
        trackEl.style.transform = "";
        trackEl.style.gap = "";
      }
      for (const el of cards.current) {
        if (!el) continue;
        el.style.transform = "";
        el.style.opacity = "";
        el.style.zIndex = "";
        el.style.visibility = "";
        el.removeAttribute("aria-hidden");
      }
    };
  }, [enhanced, count, centreAt]);

  /* In the plain strip the browser owns the scrolling, so the counter follows
     it rather than the other way round. */
  useEffect(() => {
    if (enhanced || count === 0) return;
    const el = stage.current;
    if (!el) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const middle = el.scrollLeft + el.clientWidth / 2;
        let best = 0;
        let bestGap = Infinity;
        cards.current.forEach((card, i) => {
          if (!card) return;
          const gap = Math.abs(card.offsetLeft + card.offsetWidth / 2 - middle);
          if (gap < bestGap) {
            bestGap = gap;
            best = i;
          }
        });
        setCentred(best);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [enhanced, count]);

  /* Steering by hand. A drag scrubs the reel; letting go settles it on the
     nearest photograph and hands control back to the scroll. */
  const drag = useRef<{ x: number; from: number } | null>(null);
  /** The timer that hands steering back to the scroll, so it can be cancelled. */
  const settle = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (settle.current !== null) window.clearTimeout(settle.current);
    },
    [],
  );

  /** True once the pointer has travelled far enough to be a drag, not a tap. */
  const dragged = useRef(false);
  /** Swallows the click that a browser fires at the end of a drag. */
  const swallowClick = useRef(false);

  const onPointerDown = (event: React.PointerEvent) => {
    if (!enhanced || count < 2) return;
    // Deliberately NOT skipped when the pointer lands on a card. Every card
    // is a button covering its whole area, so refusing to start a drag there
    // meant refusing to start one anywhere — the reel could not be swiped at
    // all, which on a phone is the only way anybody would try to move it.
    // Tap and drag are told apart afterwards, by distance.
    drag.current = { x: event.clientX, from: position.current };
    dragged.current = false;
    held.current = position.current;
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;

    if (!dragged.current) {
      // A few pixels of slop, so a tap with an unsteady thumb is still a tap.
      if (Math.abs(dx) < 6) return;
      dragged.current = true;
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    }

    const height = stage.current?.getBoundingClientRect().height ?? 1;
    // Divided by the height because the reel is measured in heights.
    held.current = Math.max(0, Math.min(count - 1, drag.current.from - dx / (height * 0.85)));
  };

  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;

    if (!dragged.current) {
      // It was a tap. Hand the reel straight back to the scroll and let the
      // card's own click do its work.
      held.current = null;
      return;
    }

    // The browser fires a click after a drag ends. Without this, letting go
    // of a swipe would open whichever photograph happened to be under the
    // thumb.
    swallowClick.current = true;
    window.setTimeout(() => {
      swallowClick.current = false;
    }, 0);

    held.current = held.current === null ? null : Math.round(held.current);
    // Hold the settled position briefly, then let the scroll take over again.
    if (settle.current !== null) window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      held.current = null;
    }, 1400);
  };

  const step = useCallback(
    (delta: number) => {
      const next = Math.max(0, Math.min(count - 1, Math.round(position.current) + delta));

      if (!enhanced) {
        // The plain strip is a real scroll container; there is no transform to
        // move. Without this the buttons changed the counter and nothing else.
        cards.current[next]?.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
        setCentred(next);
        setAnnouncement(describe(photos, next));
        return;
      }

      held.current = next;
      position.current = next;
      setCentred(next);
      setAnnouncement(describe(photos, next));
      if (settle.current !== null) window.clearTimeout(settle.current);
      settle.current = window.setTimeout(() => {
        held.current = null;
      }, 2200);
    },
    [count, enhanced, photos],
  );

  /* ── Nothing to show yet ────────────────────────────────────────────── */
  if (count === 0) {
    return (
      <section
        aria-labelledby="carousel-heading"
        className="relative z-[1] px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="carousel-heading"
            className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep"
          >
            Moments
          </h2>
          <Divider className="mx-auto mt-5" />
          <div
            className="u-reveal mx-auto mt-12 max-w-md rounded-t-[6rem] border px-8 pb-10 pt-14"
            style={{ borderColor: "var(--rule)" }}
          >
            <p className="u-display text-balance italic leading-relaxed text-ink-soft">
              {content.galleryEmpty.invitation}
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
      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <h2
            id="carousel-heading"
            className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep"
          >
            Moments
          </h2>
          <Divider className="mx-auto mt-5" />
        </header>

        <div
          role="group"
          aria-roledescription="carousel"
          aria-label="Photographs"
          className="relative mt-[clamp(2.5rem,7vh,4rem)]"
        >
          <div
            ref={stage}
            // Full-bleed: out of the text column and across the whole screen.
            // The section above clips, so the extra width can never become a
            // horizontal scrollbar.
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={
              enhanced
                ? "relative left-1/2 h-[clamp(15rem,38vw,23rem)] w-screen -translate-x-1/2 touch-pan-y select-none overflow-hidden"
                : // The honest version: a strip you scroll and that snaps.
                  "relative h-[clamp(15rem,38vw,23rem)] snap-x snap-mandatory overflow-x-auto"
            }
            style={enhanced ? { perspective: "1500px", perspectiveOrigin: "50% 46%" } : undefined}
          >
            <ul
              ref={track}
              className={
                enhanced
                  ? "absolute left-0 top-0 flex h-full items-center"
                  : "flex h-full items-center gap-3"
              }
              style={enhanced ? { transformStyle: "preserve-3d", willChange: "transform" } : undefined}
            >
              {photos.map((photo, i) => {
                const ratio = ratios[i];
                const described = photo.alt || `Photograph ${i + 1} of ${count}`;
                const isCentre = i === centred;

                return (
                  <li
                    key={photo.src}
                    ref={(el) => {
                      cards.current[i] = el;
                    }}
                    className={enhanced ? "h-full shrink-0" : "h-full shrink-0 snap-center"}
                    style={{
                      // The card is as tall as the reel and as wide as its own
                      // photograph needs. Deriving the width from aspect-ratio
                      // rather than setting it is the whole trick: a percentage
                      // width here would resolve against the track, whose width
                      // is itself the sum of the cards, and run away.
                      aspectRatio: String(ratio),
                      transformStyle: enhanced ? "preserve-3d" : undefined,
                      transition: enhanced ? "opacity 500ms var(--ease-silk)" : undefined,
                    }}
                  >
                    <button
                      type="button"
                      data-open-photo
                      // Only the photograph in front takes a tab stop. The
                      // others are reached with the buttons underneath, which
                      // is how a carousel is supposed to work.
                      tabIndex={enhanced && !isCentre ? -1 : 0}
                      onClick={() => {
                        if (swallowClick.current) return;
                        if (enhanced && !isCentre) step(i - centred);
                        else setOpen(i);
                      }}
                      className="group relative block h-full w-full overflow-hidden rounded-sm border bg-parchment shadow-[0_34px_70px_-38px_rgba(74,56,30,0.62)]"
                      style={{ borderColor: "var(--rule)" }}
                    >
                      <Image
                        src={photo.src}
                        alt={described}
                        fill
                        // Roughly the card's share of the screen. No phone
                        // downloads a picture wider than its own display.
                        sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 30rem"
                        placeholder={photo.blurDataURL ? "blur" : "empty"}
                        blurDataURL={photo.blurDataURL}
                        // The first few are what a guest sees immediately.
                        loading={i < 3 ? "eager" : "lazy"}
                        className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                      />
                      <span className="sr-only">
                        {enhanced && !isCentre
                          ? `Bring ${described} to the front`
                          : `Open ${described} full size`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* The reel runs past both edges of the screen. Fading it out
                there is what a hard clipped edge is pretending to be — and
                unlike a mask on the stage it cannot flatten the 3D the cards
                sit in. */}
            {enhanced && (
              <>
                <Edge side="left" />
                <Edge side="right" />
              </>
            )}
          </div>

          {/* Real controls. This has to work with a keyboard, with a thumb,
              and for anyone who never scrolls far enough to turn the reel. */}
          {count > 1 && (
            <div className="mt-9 flex items-center justify-center gap-4" data-no-print>
              <Control label="Previous photograph" onClick={() => step(-1)} disabled={centred === 0} dir="left" />
              <p className="u-eyebrow min-w-[6.5rem] text-center text-ink-soft" aria-hidden="true">
                {centred + 1} / {count}
              </p>
              <Control
                label="Next photograph"
                onClick={() => step(1)}
                disabled={centred === count - 1}
                dir="right"
              />
            </div>
          )}

          {/* Said out loud, politely, when the guest moves the reel — never
              when the page merely scrolls past it. */}
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {announcement}
          </p>
        </div>
      </div>

      <Lightbox photos={photos} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </section>
  );
}

/** How a photograph is announced when the guest brings it to the front. */
function describe(photos: Photo[], i: number): string {
  const photo = photos[i];
  if (!photo) return "";
  return `${photo.alt || `Photograph ${i + 1}`}, ${i + 1} of ${photos.length}`;
}

/** A soft ivory fade at one end of the reel. */
function Edge({ side }: { side: "left" | "right" }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 w-[clamp(3.5rem,14vw,12rem)]"
      style={{
        [side]: 0,
        background: `linear-gradient(to ${side === "left" ? "right" : "left"}, var(--color-ivory), color-mix(in oklab, var(--color-ivory) 70%, transparent) 55%, transparent)`,
      } as React.CSSProperties}
    />
  );
}

function Control({
  label,
  onClick,
  disabled,
  dir,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  dir: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-12 w-12 items-center justify-center rounded-full border text-ink transition-colors duration-500 hover:bg-gold-ink hover:text-white disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-ink"
      style={{ borderColor: "var(--rule)" }}
    >
      <span className="sr-only">{label}</span>
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          d={dir === "left" ? "M15 5 L8 12 L15 19" : "M9 5 L16 12 L9 19"}
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </button>
  );
}
