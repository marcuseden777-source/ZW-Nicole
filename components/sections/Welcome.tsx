import { Arch, CornerSpray, Divider, Lantern } from "@/components/ui/Ornaments";
import * as content from "@/content/wedding";

/** The arch: the moment the invitation proper begins. */
export function Welcome() {
  return (
    <section
      aria-labelledby="welcome-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(4rem,12vh,9rem)]"
    >
      <div className="relative mx-auto max-w-3xl">
        {/* Lanterns flank the arch, and step aside on a narrow screen. */}
        <Lantern className="absolute -left-4 top-6 hidden h-32 w-14 opacity-80 sm:block lg:-left-16 lg:h-44 lg:w-20" />
        <Lantern flip className="absolute -right-4 top-6 hidden h-32 w-14 opacity-80 sm:block lg:-right-16 lg:h-44 lg:w-20" />

        <Arch className="px-[clamp(1.5rem,6vw,4rem)] pb-10 pt-[clamp(3rem,9vw,5.5rem)]">
          <div className="u-reveal text-center">
            {content.opening.bismillah && (
              <>
                <p className="u-arabic text-[clamp(1.05rem,3.4vw,1.5rem)] text-gold-deep">
                  {content.opening.bismillah}
                </p>
                <p className="u-eyebrow mt-3 normal-case tracking-[0.18em]">
                  {content.opening.bismillahTranslit}
                </p>
                <Divider className="mx-auto my-8" />
              </>
            )}

            <h2 id="welcome-heading" className="u-eyebrow">
              {content.opening.eyebrow}
            </h2>

            <p className="u-script u-foil mt-6 text-[clamp(3rem,12vw,6.5rem)]">
              <span className="block">{content.couple.groom.name}</span>
              <span className="my-1 block text-[0.42em]">{content.couple.ampersand}</span>
              <span className="block">{content.couple.bride.name}</span>
            </p>

            <div className="mt-9 space-y-1">
              <p className="u-display text-[clamp(0.9rem,2.8vw,1.15rem)] uppercase tracking-[0.24em] text-ink-soft">
                {content.weddingDate.display}
              </p>
              <p className="u-eyebrow">{content.weddingDate.year}</p>
            </div>
          </div>
        </Arch>

        {/* Held inside the gutter on a phone; only allowed to break out once
            there is room to the side for them to break out into. */}
        <CornerSpray className="pointer-events-none absolute -bottom-4 left-0 h-20 w-28 opacity-70 sm:-bottom-6 sm:-left-6 sm:h-32 sm:w-44" />
        <CornerSpray
          flip
          className="pointer-events-none absolute -bottom-4 right-0 h-20 w-28 opacity-70 sm:-bottom-6 sm:-right-6 sm:h-32 sm:w-44"
        />
      </div>
    </section>
  );
}
