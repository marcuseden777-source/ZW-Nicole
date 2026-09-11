import { Divider } from "@/components/ui/Ornaments";
import * as content from "@/content/wedding";

/**
 * The reply.
 *
 * Replies are collected on the couple's own Joy page, so this is a single
 * clear invitation to go there — not a second form asking the same guest the
 * same questions twice and splitting the headcount across two places.
 */
export function Rsvp() {
  if (!content.rsvp.enabled || !content.rsvp.url) return null;

  return (
    <section
      aria-labelledby="rsvp-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
      data-no-print
    >
      <div className="mx-auto max-w-xl text-center">
        <h2
          id="rsvp-heading"
          className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep"
        >
          {content.rsvp.heading}
        </h2>
        <Divider className="mx-auto mt-5" />

        {content.rsvp.note && (
          <p className="u-reveal u-display mt-7 text-balance text-[clamp(1rem,3.2vw,1.2rem)] italic leading-relaxed text-ink-soft">
            {content.rsvp.note}
          </p>
        )}

        <div className="u-reveal mt-10">
          <a
            href={content.rsvp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="u-eyebrow inline-block rounded-full border border-gold-ink bg-gold-ink px-10 py-4 text-white transition-opacity duration-300 hover:opacity-85"
          >
            {content.rsvp.buttonLabel}
          </a>

          {content.rsvp.deadlineDisplay && (
            <p className="u-eyebrow mt-7 normal-case tracking-[0.14em]">
              Kindly reply by {content.rsvp.deadlineDisplay}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
