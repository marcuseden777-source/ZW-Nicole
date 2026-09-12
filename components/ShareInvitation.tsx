"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Pass the invitation on.
 *
 * A wedding invitation is forwarded more often than it is opened — to a
 * parent, to a sibling, into a family group chat. Without this the only way
 * to do that is to select the address bar on a phone, which is a fiddly thing
 * to ask of a grandparent.
 *
 * Three behaviours, in order of what the guest's device can actually do:
 * the native share sheet, then the clipboard, then simply showing the address
 * so it can be read or selected by hand. Nothing here is required for the
 * invitation to work, so it renders nothing at all until the browser has been
 * asked what it supports — no button that might not do anything.
 */
export function ShareInvitation({ title }: { title: string }) {
  const [can, setCan] = useState<"share" | "copy" | "show" | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setAddress(window.location.href);
    setCan(
      typeof navigator.share === "function"
        ? "share"
        : navigator.clipboard && typeof navigator.clipboard.writeText === "function"
          ? "copy"
          : "show",
    );
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const announce = (message: string) => {
    setSaid(message);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSaid(null), 4000);
  };

  const onClick = async () => {
    const url = window.location.href;

    if (can === "share") {
      try {
        await navigator.share({ title, url });
      } catch (error) {
        // Dismissing the share sheet rejects with AbortError. That is the
        // guest changing their mind, not a failure, and telling them it went
        // wrong would be a lie.
        if ((error as Error)?.name !== "AbortError") announce("Could not open sharing");
      }
      return;
    }

    if (can === "copy") {
      try {
        await navigator.clipboard.writeText(url);
        announce("Link copied");
      } catch {
        // Clipboard access can be refused outright — a locked-down browser, an
        // insecure context. Fall back to showing the address rather than
        // leaving a button that silently does nothing.
        setCan("show");
      }
      return;
    }

    setCan("show");
  };

  // The wrapper is rendered from the first paint even though its contents are
  // not yet decided. The page's reveal observer collects `.u-reveal` elements
  // when it mounts, so an element that appears later is never observed and
  // stays at opacity 0 forever — present, clickable, and invisible.
  return (
    <div className="u-reveal mt-12" data-no-print>
      {!can ? null : can === "show" ? (
        <p className="u-eyebrow break-all normal-case tracking-[0.08em] text-ink-soft">
          {address}
        </p>
      ) : (
        <button
          type="button"
          onClick={onClick}
          className="u-eyebrow inline-flex h-12 items-center gap-2.5 rounded-full border px-7 text-ink-soft transition-colors duration-500 hover:border-gold-ink hover:text-gold-deep"
          style={{ borderColor: "var(--rule)" }}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
            <path
              d="M12 3.5 L12 15 M12 3.5 L8.5 7 M12 3.5 L15.5 7 M5.5 13 L5.5 19.5 L18.5 19.5 L18.5 13"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          Share this invitation
        </button>
      )}

      {/* Said out loud once, then allowed to go quiet again. */}
      <p className="sr-only" aria-live="polite">
        {said}
      </p>
    </div>
  );
}
