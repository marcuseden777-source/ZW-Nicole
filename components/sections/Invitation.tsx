import { Divider } from "@/components/ui/Ornaments";
import * as content from "@/content/wedding";

/** The address to the guest, the two lineages, and the verse. */
export function Invitation() {
  const people = [content.couple.bride, content.couple.groom];

  return (
    <section
      aria-labelledby="invitation-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="invitation-heading" className="u-reveal u-script text-[clamp(2.25rem,8vw,3.5rem)] text-gold-deep">
          {content.opening.salutation}
        </h2>

        <p
          className="u-reveal u-display mt-6 text-balance text-[clamp(1.05rem,3.4vw,1.4rem)] leading-relaxed text-ink-soft"
          style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
        >
          {content.opening.body}
        </p>

        <Divider className="mx-auto my-[clamp(2.5rem,7vh,4rem)]" />

        {/* The two families, side by side */}
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-8">
          {people.map((person, i) => (
            <div
              key={person.name}
              className="u-reveal"
              style={{ "--reveal-delay": `${i * 140}ms` } as React.CSSProperties}
            >
              <p className="u-script u-foil text-[clamp(2.5rem,9vw,3.75rem)]">{person.name}</p>
              {person.lineage && (
                <p className="u-eyebrow mt-3 leading-relaxed">{person.lineage}</p>
              )}
            </div>
          ))}
        </div>

        {content.verse.enabled && (
          <figure
            className="u-reveal mt-[clamp(3rem,9vh,5rem)] border-y py-9"
            style={{ borderColor: "var(--rule)" }}
          >
            <blockquote className="u-display text-balance text-[clamp(1rem,3.2vw,1.25rem)] italic leading-relaxed text-ink-soft">
              &ldquo;{content.verse.text}&rdquo;
            </blockquote>
            <figcaption className="u-eyebrow mt-5">{content.verse.attribution}</figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
