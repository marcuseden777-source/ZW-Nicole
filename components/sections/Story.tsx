import { Divider, SealMark } from "@/components/ui/Ornaments";
import * as content from "@/content/wedding";

/** How the two of them found each other. */
export function Story() {
  if (!content.story.enabled || !content.story.paragraphs.length) return null;

  return (
    <section
      aria-labelledby="story-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
    >
      <div className="mx-auto max-w-2xl">
        <header className="text-center">
          <h2
            id="story-heading"
            className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep"
          >
            {content.story.heading}
          </h2>
          <Divider className="mx-auto mt-5" />
        </header>

        <div className="mt-[clamp(2.5rem,7vh,4rem)] space-y-6">
          {content.story.paragraphs.map((paragraph, i) => (
            <p
              key={i}
              className="u-reveal u-display text-pretty text-[clamp(1rem,3.1vw,1.15rem)] leading-[1.85] text-ink-soft"
              style={{ "--reveal-delay": `${i * 110}ms` } as React.CSSProperties}
            >
              {paragraph}
            </p>
          ))}
        </div>

        <SealMark
          monogram={content.couple.monogram}
          className="u-reveal mx-auto mt-[clamp(2.5rem,7vh,4rem)] h-14 w-14 opacity-85"
        />
      </div>
    </section>
  );
}
