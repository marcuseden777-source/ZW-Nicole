"use client";

import { Divider, Rose } from "@/components/ui/Ornaments";
import { useSectionProgress } from "@/lib/useSectionProgress";
import * as content from "@/content/wedding";

/**
 * The day, hour by hour, down a single gold thread — with a rose that travels
 * the thread as the page is read, so a guest can see at a glance where they
 * are in the day rather than reading three equally-weighted blocks.
 */
export function Timeline() {
  const { ref, progress } = useSectionProgress<HTMLOListElement>();

  if (!content.timeline.length) return null;

  const count = content.timeline.length;
  // The rose travels between the first and last bead rather than the full
  // height of the list, so it lands on a moment rather than in the margin.
  const first = 100 / (count * 2);
  const span = 100 - first * 2;
  const rosePercent = first + progress * span;

  return (
    <section
      aria-labelledby="timeline-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
    >
      <div className="mx-auto max-w-2xl">
        <header className="text-center">
          <h2
            id="timeline-heading"
            className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep"
          >
            The Day
          </h2>
          <p className="u-reveal u-eyebrow mt-4">{content.weddingDate.display}</p>
          <Divider className="mx-auto mt-5" />
        </header>

        <ol ref={ref} className="relative mt-[clamp(2.5rem,7vh,4rem)]">
          {/* The thread, unlit */}
          <span
            aria-hidden="true"
            className="absolute bottom-6 left-[5.5rem] top-2 w-px sm:left-[8rem]"
            style={{ background: "var(--rule)" }}
          />
          {/* The thread behind the rose, lit as it passes */}
          <span
            aria-hidden="true"
            className="absolute left-[5.5rem] top-2 w-px sm:left-[8rem]"
            style={{
              height: `calc(${rosePercent}% - 0.5rem)`,
              background:
                "linear-gradient(to bottom, color-mix(in oklab, var(--color-gold) 30%, transparent), var(--color-gold))",
            }}
          />

          {/* The rose itself */}
          <span
            aria-hidden="true"
            className="absolute left-[5.5rem] z-10 -translate-x-1/2 -translate-y-1/2 sm:left-[8rem]"
            style={{ top: `${rosePercent}%` }}
          >
            <Rose className="h-[2.4rem] w-[1.85rem] drop-shadow-[0_2px_5px_rgba(120,95,50,0.28)]" />
          </span>

          {content.timeline.map((item, i) => {
            // Has the rose reached this moment yet?
            const at = first + (i / Math.max(count - 1, 1)) * span;
            const passed = rosePercent >= at - 1;

            return (
              <li
                key={`${item.time}-${item.title}`}
                className="u-reveal relative grid grid-cols-[5.5rem_1fr] gap-x-7 pb-12 last:pb-0 sm:grid-cols-[8rem_1fr]"
                style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
              >
                <p
                  className="u-display pr-4 pt-1 text-right text-[clamp(0.85rem,2.6vw,1rem)] uppercase tracking-[0.14em] transition-colors duration-700"
                  style={{ color: passed ? "var(--color-gold-deep)" : "var(--color-ink-faint)" }}
                >
                  {item.time}
                </p>

                {/* The bead the rose comes to rest on */}
                <span
                  aria-hidden="true"
                  className="absolute left-[5.5rem] top-2 h-[7px] w-[7px] -translate-x-1/2 rotate-45 border transition-colors duration-700 sm:left-[8rem]"
                  style={{
                    borderColor: passed ? "var(--color-gold)" : "var(--rule)",
                    background: passed ? "var(--color-gold)" : "var(--color-ivory)",
                  }}
                />

                <div className="pl-2">
                  <h3 className="u-display text-[clamp(1.15rem,3.6vw,1.45rem)] text-ink">
                    {item.title}
                  </h3>
                  {item.detail && (
                    <p className="u-display mt-2 text-pretty leading-relaxed text-ink-soft">
                      {item.detail}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
