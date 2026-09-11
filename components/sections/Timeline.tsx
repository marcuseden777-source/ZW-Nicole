import { Divider } from "@/components/ui/Ornaments";
import * as content from "@/content/wedding";

/** The evening, hour by hour, down a single gold thread. */
export function Timeline() {
  if (!content.timeline.length) return null;

  return (
    <section
      aria-labelledby="timeline-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
    >
      <div className="mx-auto max-w-2xl">
        <header className="text-center">
          <h2 id="timeline-heading" className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep">
            The Evening
          </h2>
          <Divider className="mx-auto mt-5" />
        </header>

        <ol className="relative mt-[clamp(2.5rem,7vh,4rem)]">
          {/* The thread itself */}
          <span
            aria-hidden="true"
            className="absolute bottom-6 left-[7.5rem] top-2 w-px sm:left-[9.5rem]"
            style={{
              background:
                "linear-gradient(to bottom, transparent, var(--color-gold) 12%, var(--color-gold) 88%, transparent)",
              opacity: 0.5,
            }}
          />

          {content.timeline.map((item, i) => (
            <li
              key={`${item.time}-${item.title}`}
              className="u-reveal relative grid grid-cols-[7.5rem_1fr] gap-x-7 pb-9 last:pb-0 sm:grid-cols-[9.5rem_1fr]"
              style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
            >
              <p className="u-display pt-1 text-right text-[clamp(0.85rem,2.6vw,1rem)] uppercase tracking-[0.14em] text-gold-deep">
                {item.time}
              </p>

              {/* The bead on the thread */}
              <span
                aria-hidden="true"
                className="absolute left-[7.5rem] top-2 h-[7px] w-[7px] -translate-x-1/2 rotate-45 border border-gold bg-ivory sm:left-[9.5rem]"
              />

              <div className="pl-2">
                <h3 className="u-display text-[clamp(1.1rem,3.4vw,1.35rem)] text-ink">
                  {item.title}
                </h3>
                {item.detail && (
                  <p className="u-display mt-1 text-sm italic text-ink-faint">{item.detail}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
