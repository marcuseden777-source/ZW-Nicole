"use client";

import { AmbientFilm } from "@/components/AmbientFilm";
import { CornerSpray, Divider } from "@/components/ui/Ornaments";
import { ShareInvitation } from "@/components/ShareInvitation";
import { useNearViewport } from "@/lib/useNearViewport";
import * as content from "@/content/wedding";
import type { Phase } from "@/content/wedding";
import type { FilmSources } from "@/lib/media";

export function Closing({ phase, film }: { phase: Phase; film: FilmSources | null }) {
  // nearRef stays: the ambient film below still waits until somebody is
  // anywhere near it before it starts decoding.
  const { ref: nearRef } = useNearViewport<HTMLElement>();

  return (
    <footer ref={nearRef} className="relative z-[1] overflow-hidden px-[var(--gutter)] pb-[clamp(3rem,9vh,6rem)] pt-[clamp(3rem,10vh,7rem)]">
      <AmbientFilm film={film} opacity={content.ambient.closing.opacity} />

      <CornerSpray className="pointer-events-none absolute left-0 top-0 h-20 w-28 opacity-40 sm:-left-8 sm:h-28 sm:w-40" />
      <CornerSpray flip className="pointer-events-none absolute right-0 top-0 h-20 w-28 opacity-40 sm:-right-8 sm:h-28 sm:w-40" />

      <div className="relative mx-auto max-w-xl text-center">
        {/* The wax seal used to return here in three dimensions, and it read
            as a moulded button no matter how it was built. The blossom
            growing down both edges of the page is the motif now — it is
            already on screen when a guest reaches this, so repeating anything
            here would only be repeating. */}

        <p className="u-reveal u-display mt-8 text-balance text-[clamp(1.1rem,3.6vw,1.4rem)] italic leading-relaxed text-ink-soft">
          {phase === "keepsake" ? content.closing.keepsake : content.closing.invitation}
        </p>

        <Divider className="mx-auto my-9" />
        <p className="u-script u-foil mt-12 text-[clamp(2.25rem,8vw,3.25rem)]">
          {content.couple.partnerOne.name} {content.couple.ampersand} {content.couple.partnerTwo.name}
        </p>
        <p className="u-eyebrow mt-3">{content.weddingDate.year}</p>

        {/* An invitation is forwarded more often than it is opened. */}
        <ShareInvitation
          title={`${content.couple.partnerOne.name} ${content.couple.ampersand} ${content.couple.partnerTwo.name} — ${content.meta.tagline}`}
        />
      </div>
    </footer>
  );
}
