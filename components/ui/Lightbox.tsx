"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { releaseScrollLock, takeScrollLock } from "@/lib/scrollLock";
import type { Photo } from "@/lib/media";

type Props = {
  photos: Photo[];
  /** The photograph on screen, or null when the lightbox is closed. */
  index: number | null;
  onClose: () => void;
  onIndex: (next: number) => void;
};

/**
 * One photograph, full size, over everything.
 *
 * There is exactly one of these and both the carousel and the gallery wall
 * open it. Two lightboxes would mean two focus traps, two sets of key
 * handlers and two chances to get the escape route wrong — and the escape
 * route is the part that matters. A guest who opens a photograph must always
 * be able to get back out, whether they came in with a mouse, a thumb, a
 * keyboard or a screen reader.
 *
 * Deliberately NOT a <dialog>. The native element is tempting, but its
 * top-layer rendering sits above everything including the 3D world, its
 * backdrop cannot be animated consistently across browsers, and `showModal`
 * fights the smooth-scroll driver for control of the document. The parts
 * worth having — the focus trap, inert background, escape-to-close — are
 * written out here where their behaviour is visible.
 */
export function Lightbox({ photos, index, onClose, onIndex }: Props) {
  const open = index !== null;
  const count = photos.length;

  const panel = useRef<HTMLDivElement>(null);
  /** Only true on the client, which is the only place a portal can exist. */
  const [mounted, setMounted] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  /** Where focus was before we took it, so it can be handed straight back. */
  const returnFocus = useRef<HTMLElement | null>(null);

  const go = useCallback(
    (delta: number) => {
      if (index === null || count === 0) return;
      onIndex((index + delta + count) % count);
    },
    [index, count, onIndex],
  );

  useEffect(() => setMounted(true), []);

  /* Everything outside this photograph stops existing while it is open.
     `inert` is native containment: it removes a subtree from the tab order
     and from assistive technology at once, with no key handler to get wrong.
     The menu button lives outside the page root and needs saying separately,
     or it floats above the photograph and steals the corner the close button
     is in. */
  useEffect(() => {
    if (!open) return;
    const outside = [
      document.getElementById("site-root"),
      ...Array.from(document.querySelectorAll<HTMLElement>("[data-outside-overlay]")),
    ].filter((el): el is HTMLElement => el !== null);
    outside.forEach((el) => el.setAttribute("inert", ""));
    return () => outside.forEach((el) => el.removeAttribute("inert"));
  }, [open]);

  /* Hold the document still — at the position the guest was already at, so
     closing the photograph puts them back beside the one they tapped rather
     than at the top of the page. */
  useEffect(() => {
    if (!open) return;
    takeScrollLock("lightbox");
    return () => releaseScrollLock("lightbox");
  }, [open]);

  /* Take focus on open, give it back on close. */
  useEffect(() => {
    if (!open) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    // After paint, or the button is not yet focusable.
    const id = requestAnimationFrame(() => closeButton.current?.focus());
    return () => {
      cancelAnimationFrame(id);
      // Only reclaim focus if nothing else has taken it in the meantime.
      const active = document.activeElement;
      if (!active || active === document.body) returnFocus.current?.focus();
    };
  }, [open]);

  /* Keys. Escape out, arrows across, Home and End to the ends — and Tab kept
     inside, because a keyboard guest who tabs out of a modal ends up steering
     a page they cannot see. */
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          event.preventDefault();
          onClose();
          return;
        case "ArrowRight":
          event.preventDefault();
          go(1);
          return;
        case "ArrowLeft":
          event.preventDefault();
          go(-1);
          return;
        case "Home":
          event.preventDefault();
          onIndex(0);
          return;
        case "End":
          event.preventDefault();
          onIndex(count - 1);
          return;
        case "Tab": {
          const focusable = panel.current?.querySelectorAll<HTMLElement>(
            'button, [href], [tabindex]:not([tabindex="-1"])',
          );
          if (!focusable || focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          const active = document.activeElement;
          if (event.shiftKey && (active === first || !panel.current?.contains(active))) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go, onClose, onIndex, count]);

  /* A thumb should be able to flick between photographs, because on a phone
     that is the only gesture anyone will try. */
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (event: React.TouchEvent) => {
    const t = event.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (event: React.TouchEvent) => {
    if (!touch.current) return;
    const t = event.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    // Horizontal intent only, and far enough to be deliberate.
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  if (!open || count === 0 || !mounted) return null;

  const photo = photos[index];
  // A photograph whose filename said nothing still needs to announce itself.
  // Silence would leave a screen reader user with no idea anything is there.
  const described = photo.alt || `Photograph ${index + 1} of ${count}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={described}
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center"
      style={{ background: "rgba(24,19,12,0.94)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        ref={panel}
        className="relative flex h-full w-full flex-col items-center justify-center px-[var(--gutter)] py-[clamp(4.5rem,10vh,6rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButton}
          type="button"
          onClick={onClose}
          className="absolute right-[var(--gutter)] top-[clamp(1rem,3vw,2rem)] flex h-12 w-12 items-center justify-center rounded-full border transition-colors duration-500 hover:bg-white/10"
          style={{ borderColor: "rgba(240,226,199,0.4)" }}
        >
          <span className="sr-only">Close this photograph</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M6 6 L18 18 M18 6 L6 18"
              stroke="var(--color-champagne)"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>

        <figure className="flex min-h-0 w-full max-w-5xl flex-1 flex-col items-center justify-center">
          <div
            className="relative flex min-h-0 w-full flex-1 items-center justify-center"
            // The photograph's own shape, so the frame never letterboxes a
            // portrait into a landscape hole or crops a panorama.
            style={{ maxWidth: `min(100%, ${(photo.width / photo.height) * 74}vh)` }}
          >
            <Image
              key={photo.src}
              src={photo.src}
              alt={described}
              width={photo.width}
              height={photo.height}
              sizes="100vw"
              placeholder={photo.blurDataURL ? "blur" : "empty"}
              blurDataURL={photo.blurDataURL}
              priority
              className="max-h-full w-auto object-contain"
              style={{ maxHeight: "100%" }}
            />
          </div>

          <figcaption
            className="u-eyebrow mt-6 shrink-0 text-center"
            style={{ color: "var(--color-champagne)" }}
          >
            {photo.alt ? `${photo.alt} · ` : ""}
            {index + 1} of {count}
          </figcaption>
        </figure>

        {count > 1 && (
          <>
            <Arrow side="left" onClick={() => go(-1)} label="Previous photograph" />
            <Arrow side="right" onClick={() => go(1)} label="Next photograph" />
          </>
        )}
      </div>

      {/* The neighbours, fetched quietly so the next tap is instant. Hidden
          from everything — this is a cache warmer, not content. */}
      <div className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0" aria-hidden="true">
        {/* With exactly two photographs both neighbours are the same picture,
            so they are deduplicated rather than rendered twice under one key. */}
        {[...new Set([-1, 1].map((d) => photos[(index + d + count) % count]?.src))].map((src) => {
          const neighbour = photos.find((p) => p.src === src);
          if (!neighbour || neighbour.src === photo.src) return null;
          return (
            <Image
              key={neighbour.src}
              src={neighbour.src}
              alt=""
              width={32}
              height={32}
              sizes="100vw"
            />
          );
        })}
      </div>
    </div>,
    document.body,
  );
}

/** A generous target on both edges — 44px is the floor, this clears it. */
function Arrow({
  side,
  onClick,
  label,
}: {
  side: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border transition-colors duration-500 hover:bg-white/10"
      style={{
        borderColor: "rgba(240,226,199,0.4)",
        [side]: "var(--gutter)",
      } as React.CSSProperties}
    >
      <span className="sr-only">{label}</span>
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          d={side === "left" ? "M15 5 L8 12 L15 19" : "M9 5 L16 12 L9 19"}
          stroke="var(--color-champagne)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </button>
  );
}
