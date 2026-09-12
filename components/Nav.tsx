"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SealMark } from "@/components/ui/Ornaments";
import { hasEntered, subscribeToEntry } from "@/lib/entryState";
import * as content from "@/content/wedding";

type Destination = { id: string; label: string };

/**
 * Getting somewhere without scrolling there.
 *
 * A single scroll is the right shape for reading this once, front to back.
 * It is the wrong shape entirely for the morning of the wedding, when a
 * guest sitting in a taxi wants the address and nothing else. This is the
 * shortcut for that person.
 *
 * The marker travelling down the list is a scroll-spy, so the menu also
 * answers "where am I" — which a static list of links cannot.
 */
export function Nav({ destinations }: { destinations: Destination[] }) {
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(hasEntered);
  /**
   * Only the destinations that are actually on the page.
   *
   * Sections come and go with the content — the Album is not there until
   * there are photographs, the film is not there until there is a film — and
   * a menu offering to take someone somewhere that does not exist is worse
   * than a shorter menu. Settled after mount so the server and the first
   * paint agree, then narrowed.
   */
  const [present, setPresent] = useState<Destination[]>(destinations);
  const [active, setActive] = useState(destinations[0]?.id ?? "");

  useEffect(() => {
    setPresent(destinations.filter((d) => document.getElementById(d.id)));
  }, [destinations]);
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => subscribeToEntry(setEntered), []);

  // Which section is the reader actually in?
  useEffect(() => {
    if (!entered) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      // A band across the middle of the screen: the section a guest is
      // reading is the one in front of them, not the one at the very top.
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    for (const d of present) {
      const el = document.getElementById(d.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [entered, present]);

  // Escape closes it, and focus goes back where it came from.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;

      // The page behind an open menu is not inert, and the menu covers it
      // completely — so tabbing past the last entry put focus on something
      // no one could see.
      const focusable = panel.current?.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.current?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = useCallback((id: string) => {
    setOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    // Reveals fire on scroll; a guest jumping ahead would otherwise arrive
    // at a section still at opacity 0.
    el.closest("section")?.querySelectorAll<HTMLElement>(".u-reveal")
      .forEach((n) => n.setAttribute("data-shown", "true"));
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    // The menu closes, so the button that was focused goes inert and focus
    // falls to <body>. Someone using a mouse sees the page move and thinks
    // nothing of it; someone using a keyboard or a screen reader is told
    // nothing and is back at the top of the document. Send focus to the
    // heading they asked for, which is the thing they actually chose.
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  }, []);

  // Never over the door.
  if (!entered) return null;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="fixed right-[clamp(1rem,3vw,2rem)] top-[clamp(1rem,3vw,2rem)] z-40 flex h-12 w-12 items-center justify-center rounded-full border bg-ivory/85 backdrop-blur-sm transition-transform duration-500 hover:scale-105"
        style={{ borderColor: "var(--rule)" }}
        data-no-print
        // Lives outside #site-root, so an overlay has to silence it by name.
        data-outside-overlay
      >
        <span className="sr-only">Open the menu</span>
        <span aria-hidden="true" className="flex flex-col gap-[5px]">
          <span className="block h-px w-5 bg-gold-deep" />
          <span className="block h-px w-5 bg-gold-deep" />
        </span>
      </button>

      <div
        // Only a dialog while it is actually open — an aria-modal element
        // sitting permanently in the DOM reads as a trap to assistive tech.
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label="Menu"
        data-menu
        data-outside-overlay
        ref={panel}
        // `justify-center` alone centres a list that is taller than the
        // screen by pushing both ends off it, with no way to scroll to
        // either. `overflow-y-auto` plus `my-auto` on the contents centres
        // it when it fits and scrolls it when it does not.
        className="fixed inset-0 z-50 flex flex-col overflow-y-auto overscroll-contain px-[var(--gutter)] py-[clamp(4.5rem,12vh,7rem)]"
        style={{
          background: "var(--color-ivory)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 500ms var(--ease-silk)",
        }}
        aria-hidden={!open}
        // aria-hidden alone leaves every button inside still tabbable, so a
        // keyboard guest walks into an invisible menu and is lost. `inert`
        // takes the whole subtree out of the tab order and the accessibility
        // tree at once, which is the thing that was actually meant.
        inert={!open}
        data-no-print
      >
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            trigger.current?.focus();
          }}
          className="absolute right-[clamp(1rem,3vw,2rem)] top-[clamp(1rem,3vw,2rem)] flex h-12 w-12 items-center justify-center rounded-full border"
          style={{ borderColor: "var(--rule)" }}
        >
          <span className="sr-only">Close the menu</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path d="M6 6 L18 18 M18 6 L6 18" stroke="var(--color-gold-deep)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          </svg>
        </button>

        <div className="mx-auto my-auto w-full max-w-md">
          <SealMark monogram={content.couple.monogram} className="mb-10 h-14 w-14" />

          <nav>
            <ul className="space-y-1">
              {present.map((d, i) => {
                const here = active === d.id;
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => go(d.id)}
                      className="group flex w-full items-baseline gap-4 py-3 text-left"
                      style={{
                        // Staggered in, so the list arrives rather than appears.
                        opacity: open ? 1 : 0,
                        transform: open ? "none" : "translateY(0.5rem)",
                        transition: `opacity 500ms var(--ease-silk) ${i * 45}ms, transform 500ms var(--ease-silk) ${i * 45}ms`,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="block h-px transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{
                          width: here ? "2.5rem" : "1rem",
                          background: here ? "var(--color-gold-deep)" : "var(--rule)",
                        }}
                      />
                      <span
                        className="u-display text-[clamp(1.5rem,6vw,2.1rem)] transition-colors duration-500"
                        style={{ color: here ? "var(--color-gold-deep)" : "var(--color-ink)" }}
                      >
                        {d.label}
                      </span>
                      {here && <span className="sr-only">(you are here)</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <p className="u-eyebrow mt-10">
            {content.weddingDate.display} · {content.weddingDate.place}
          </p>
        </div>
      </div>
    </>
  );
}
