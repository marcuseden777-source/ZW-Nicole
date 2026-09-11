import { Arch, CornerSpray, Divider } from "@/components/ui/Ornaments";
import * as content from "@/content/wedding";

/** The arch: the moment the invitation proper begins. */
export function Welcome() {
  return (
    <section
      aria-labelledby="welcome-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(4rem,12vh,9rem)]"
    >
      <div className="relative mx-auto max-w-3xl">
        <Arch className="px-[clamp(1.5rem,6vw,4rem)] pb-10 pt-[clamp(3.5rem,10vw,6rem)]">
          <div className="u-reveal text-center">
            <h2 id="welcome-heading" className="u-eyebrow">
              {content.opening.eyebrow}
            </h2>

            <p className="u-script u-foil mt-6 text-[clamp(3rem,12vw,6.5rem)]">
              <span className="block">{content.couple.partnerOne.name}</span>
              <span className="my-1 block text-[0.42em]">{content.couple.ampersand}</span>
              <span className="block">{content.couple.partnerTwo.name}</span>
            </p>

            <Divider className="mx-auto my-8" />

            <div className="space-y-1">
              <p className="u-display text-[clamp(0.9rem,2.8vw,1.15rem)] uppercase tracking-[0.24em] text-ink-soft">
                {content.weddingDate.display}
              </p>
              <p className="u-eyebrow">{content.weddingDate.year}</p>
              <p className="u-eyebrow pt-3">{content.weddingDate.place}</p>
            </div>
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
