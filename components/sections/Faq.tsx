import { Divider } from "@/components/ui/Ornaments";
import * as content from "@/content/wedding";

/**
 * The handful of things every guest wants to know before the day.
 *
 * Two columns once there is room for them. Every other section on this page
 * is a single centred measure, and eight of those in a row is a rhythm that
 * puts a reader to sleep — this is the one place with short, parallel,
 * scannable items, so it is the natural place to break the column and let the
 * page breathe differently for a moment.
 *
 * Each item is ruled above rather than below. In a single stack a rule below
 * separates; in a grid it leaves the last item in each column hanging, and a
 * rule above reads as a header instead of a leftover.
 */
export function Faq() {
  if (!content.faq.length) return null;

  return (
    <section
      aria-labelledby="faq-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
    >
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <h2
            id="faq-heading"
            className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep"
          >
            Good to Know
          </h2>
          <Divider className="mx-auto mt-5" />
        </header>

        <dl className="mt-[clamp(2.5rem,7vh,4rem)] grid gap-x-14 gap-y-10 sm:grid-cols-2">
          {content.faq.map((item, i) => (
            <div
              key={item.question}
              className="u-reveal border-t pt-6"
              style={
                {
                  borderColor: "var(--rule)",
                  // Down the first column, then the second, so the eye is led
                  // the way the items are actually read.
                  "--reveal-delay": `${i * 80}ms`,
                } as React.CSSProperties
              }
            >
              <dt className="u-display text-[clamp(1.05rem,3.3vw,1.25rem)] text-ink">
                {item.question}
              </dt>
              <dd className="u-display mt-2 leading-relaxed text-ink-soft">
                {item.answer}
              </dd>
              {item.link && (
                <dd className="mt-3">
                  <a
                    href={item.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    // On its own line rather than trailing the sentence. Set
                    // inline it was twenty pixels tall — a fiddly thing to hit
                    // with a thumb, which rather defeats the point of adding a
                    // way to act on the answer. Underlined as well as
                    // coloured, so it still reads as a link to someone who
                    // cannot tell gold from ink.
                    className="u-eyebrow inline-flex min-h-11 items-center gap-1.5 underline decoration-from-font underline-offset-[6px] transition-colors duration-300 hover:text-gold-deep"
                    style={{ color: "var(--color-gold-ink)" }}
                  >
                    {item.link.label}
                    <span aria-hidden="true">&rarr;</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </dd>
              )}
            </div>
          ))}
        </dl>

        {content.contacts.enabled && (
          <div className="u-reveal mt-[clamp(2.5rem,7vh,3.5rem)] text-center">
            <p className="u-eyebrow">{content.contacts.heading}</p>
            <p className="u-display mt-3 text-ink-soft">
              {content.contacts.people
                .filter((person) => person.contact)
                .map((person) => `${person.name} — ${person.contact}`)
                .join("  ·  ")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
