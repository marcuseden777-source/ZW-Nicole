import { CornerSpray, Divider, SealMark } from "@/components/ui/Ornaments";
import * as content from "@/content/wedding";
import type { Phase } from "@/content/wedding";

/** The last word, and the seal pressed once more. */
export function Closing({ phase }: { phase: Phase }) {
  return (
    <footer className="relative z-[1] overflow-hidden px-[var(--gutter)] pb-[clamp(3rem,9vh,6rem)] pt-[clamp(3rem,10vh,7rem)]">
      <CornerSpray className="pointer-events-none absolute left-0 top-0 h-20 w-28 opacity-40 sm:-left-8 sm:h-28 sm:w-40" />
      <CornerSpray flip className="pointer-events-none absolute right-0 top-0 h-20 w-28 opacity-40 sm:-right-8 sm:h-28 sm:w-40" />

      <div className="mx-auto max-w-xl text-center">
        <SealMark
          monogram={content.couple.monogram}
          className="u-reveal mx-auto h-20 w-20 drop-shadow-sm"
        />

        <p className="u-reveal u-display mt-8 text-balance text-[clamp(1.1rem,3.6vw,1.4rem)] italic leading-relaxed text-ink-soft">
          {phase === "keepsake" ? content.closing.keepsake : content.closing.invitation}
        </p>

        <Divider className="mx-auto my-9" />
        <p className="u-script u-foil mt-12 text-[clamp(2.25rem,8vw,3.25rem)]">
          {content.couple.partnerOne.name} {content.couple.ampersand} {content.couple.partnerTwo.name}
        </p>
        <p className="u-eyebrow mt-3">{content.weddingDate.year}</p>
      </div>
    </footer>
  );
}
