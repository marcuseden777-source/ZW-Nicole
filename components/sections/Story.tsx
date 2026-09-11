import { AmbientFilm } from "@/components/AmbientFilm";
import { Divider, SealMark } from "@/components/ui/Ornaments";
import * as content from "@/content/wedding";

/** How the two of them found each other. */
export function Story() {
  if (!content.story.enabled || !content.story.paragraphs.length) return null;

  return (
    <section
      aria-labelledby="story-heading"
      className="relative z-[1] overflow-hidden px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
    >
      <AmbientFilm
        enabled={content.ambient.story.enabled}
        opacity={content.ambient.story.opacity}
        desktop={content.ambient.story.desktop}
        mobile={content.ambient.story.mobile}
      />

      <div className="relative mx-auto max-w-2xl">
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

        {content.verse.enabled && (
          <figure
            className="u-reveal mt-[clamp(2.5rem,8vh,4rem)] border-y py-9 text-center"
            style={{ borderColor: "var(--rule)" }}
          >
            <blockquote className="u-display text-balance text-[clamp(1.05rem,3.3vw,1.3rem)] italic leading-relaxed text-ink-soft">
              &ldquo;{content.verse.text}&rdquo;
            </blockquote>
            {content.verse.attribution && (
              <figcaption className="u-eyebrow mt-5">{content.verse.attribution}</figcaption>
            )}
          </figure>
        )}

        <SealMark
          monogram={content.couple.monogram}
          className="u-reveal mx-auto mt-[clamp(2.5rem,7vh,4rem)] h-14 w-14 opacity-85"
        />
      </div>
    </section>
  );
}
