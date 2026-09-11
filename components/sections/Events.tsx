import { Divider, SealMark } from "@/components/ui/Ornaments";
import * as content from "@/content/wedding";

/** Mehndi, Nikkah, Walima — each celebration in its own arched card. */
export function Events() {
  if (!content.events.length) return null;

  return (
    <section
      aria-labelledby="events-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
    >
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <h2 id="events-heading" className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep">
            The Celebrations
          </h2>
          <Divider className="mx-auto mt-5" />
        </header>

        <ol className="mt-[clamp(2.5rem,7vh,4rem)] grid gap-6 md:grid-cols-3">
          {content.events.map((event, i) => (
            <li
              key={event.name}
              className="u-reveal relative flex flex-col rounded-t-[7rem] border bg-gradient-to-b from-white/80 to-parchment/40 px-7 pb-9 pt-14 text-center backdrop-blur-[1px]"
              style={{
                borderColor: "var(--rule)",
                "--reveal-delay": `${i * 130}ms`,
              } as React.CSSProperties}
            >
              <p className="u-script u-foil text-[clamp(2rem,6vw,2.6rem)]">{event.name}</p>
              {event.tagline && (
                <p className="u-display mt-2 text-sm italic leading-relaxed text-ink-faint">
                  {event.tagline}
                </p>
              )}

              <Divider className="mx-auto my-6 !w-24" />

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="u-eyebrow">Date</dt>
                  <dd className="u-display mt-1 text-ink">{event.date}</dd>
                </div>
                <div>
                  <dt className="u-eyebrow">Time</dt>
                  <dd className="u-display mt-1 text-ink">{event.time}</dd>
                </div>
                <div>
                  <dt className="u-eyebrow">Where</dt>
                  <dd className="u-display mt-1 text-ink">{event.venue}</dd>
                  {event.address && (
                    <dd className="u-display text-ink-faint">{event.address}</dd>
                  )}
                </div>
                {event.dressCode && (
                  <div>
                    <dt className="u-eyebrow">Dress</dt>
                    <dd className="u-display mt-1 text-ink">{event.dressCode}</dd>
                  </div>
                )}
              </dl>
            </li>
          ))}
        </ol>

        <SealMark
          monogram={content.couple.monogram}
          className="u-reveal mx-auto mt-[clamp(2.5rem,7vh,4rem)] h-16 w-16 opacity-90"
        />
      </div>
    </section>
  );
}
