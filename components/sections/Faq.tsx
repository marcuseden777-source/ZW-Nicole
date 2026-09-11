import { Divider } from "@/components/ui/Ornaments";
import * as content from "@/content/wedding";

/** The handful of things every guest wants to know before the day. */
export function Faq() {
  if (!content.faq.length) return null;

  return (
    <section
      aria-labelledby="faq-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
    >
      <div className="mx-auto max-w-2xl">
        <header className="text-center">
          <h2
            id="faq-heading"
            className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep"
          >
            Good to Know
          </h2>
          <Divider className="mx-auto mt-5" />
        </header>

        <dl className="mt-[clamp(2.5rem,7vh,4rem)] space-y-8">
          {content.faq.map((item, i) => (
            <div
              key={item.question}
              className="u-reveal border-b pb-7 last:border-0 last:pb-0"
              style={{
                borderColor: "var(--rule)",
                "--reveal-delay": `${i * 90}ms`,
              } as React.CSSProperties}
            >
              <dt className="u-display text-[clamp(1.05rem,3.3vw,1.25rem)] text-ink">
                {item.question}
              </dt>
              <dd className="u-display mt-2 leading-relaxed text-ink-soft">{item.answer}</dd>
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
