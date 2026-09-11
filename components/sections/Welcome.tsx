import { Arch, CornerSpray, Divider } from "@/components/ui/Ornaments";
import * as content from "@/content/wedding";

/**
 * The invitation proper, under the arch.
 *
 * The names are carried by the hero now, so this does not repeat them at full
 * size a screen later — it says the thing the arch is actually for: the
 * address to the guest, the date, and where.
 */
export function Welcome() {
  const people = [content.couple.partnerOne, content.couple.partnerTwo].filter(
    (person) => person.lineage,
  );

  return (
    <section
      aria-labelledby="welcome-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(4rem,12vh,9rem)]"
    >
      <div className="relative mx-auto max-w-3xl">
        <Arch className="px-[clamp(1.75rem,7vw,4.5rem)] pb-12 pt-[clamp(3.5rem,10vw,6rem)]">
          <div className="u-reveal text-center">
            <h2
              id="welcome-heading"
              // The skip link lands here, so it must be focusable.
              tabIndex={-1}
              className="u-script u-foil text-[clamp(2.5rem,9vw,4.25rem)]"
            >
              {content.opening.salutation}
            </h2>

            <p
              className="u-reveal u-display mt-7 text-balance text-[clamp(1.05rem,3.4vw,1.35rem)] leading-relaxed text-ink-soft"
              style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
            >
              {content.opening.body}
            </p>

            <Divider className="mx-auto my-9" />

            <div className="space-y-1">
              <p className="u-display text-[clamp(0.9rem,2.8vw,1.15rem)] uppercase tracking-[0.24em] text-ink-soft">
                {content.weddingDate.display}
              </p>
              <p className="u-eyebrow">{content.weddingDate.year}</p>
              <p className="u-eyebrow pt-3">{content.venue.name}</p>
              <p className="u-eyebrow">{content.weddingDate.place}</p>
            </div>

            {/* Only drawn when at least one of them has a line to introduce. */}
            {people.length > 0 && (
              <div className="mt-10 grid gap-8 sm:grid-cols-2">
                {people.map((person, i) => (
                  <div
                    key={person.name}
                    className="u-reveal"
                    style={{ "--reveal-delay": `${i * 140}ms` } as React.CSSProperties}
                  >
                    <p className="u-script u-foil text-[clamp(2rem,7vw,2.75rem)]">{person.name}</p>
                    <p className="u-eyebrow mt-2 leading-relaxed">{person.lineage}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Arch>

        <CornerSpray className="pointer-events-none absolute -bottom-4 left-0 h-20 w-28 opacity-70 sm:-bottom-6 sm:-left-6 sm:h-32 sm:w-44" />
        <CornerSpray
          flip
          className="pointer-events-none absolute -bottom-4 right-0 h-20 w-28 opacity-70 sm:-bottom-6 sm:-right-6 sm:h-32 sm:w-44"
        />
      </div>
    </section>
  );
}
