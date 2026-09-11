"use client";

/**
 * Past the door and the film, straight to the invitation.
 *
 * A real anchor, so it works before hydration and in the browser's own
 * find-links behaviour. The click handler only fixes something an anchor
 * cannot: section content rises in on scroll, so a guest who skips ahead
 * would otherwise land focus on an element still at opacity 0.
 */
export function SkipLink({ targetId }: { targetId: string }) {
  return (
    <a
      href={`#${targetId}`}
      onClick={() => {
        const target = document.getElementById(targetId);
        if (!target) return;
        target.setAttribute("data-shown", "true");
        target
          .closest("section")
          ?.querySelectorAll<HTMLElement>(".u-reveal")
          .forEach((el) => el.setAttribute("data-shown", "true"));
      }}
      className="u-eyebrow sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:border focus:border-gold focus:bg-ivory focus:px-6 focus:py-3"
    >
      Skip to the invitation
    </a>
  );
}
