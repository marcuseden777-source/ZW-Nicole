"use client";

import dynamic from "next/dynamic";

import { AmbientFilm } from "@/components/AmbientFilm";
import { CornerSpray, Divider, SealMark } from "@/components/ui/Ornaments";
import { ShareInvitation } from "@/components/ShareInvitation";
import { useCapability } from "@/lib/useCapability";
import { useNearViewport } from "@/lib/useNearViewport";
import * as content from "@/content/wedding";
import type { Phase } from "@/content/wedding";
import type { FilmSources } from "@/lib/media";

/** The last word, and the seal pressed once more. */
const SealScene = dynamic(
  () => import("@/components/three/SealScene").then((m) => m.SealScene),
  { ssr: false },
);

export function Closing({ phase, film }: { phase: Phase; film: FilmSources | null }) {
  const capability = useCapability();
  const { ref: nearRef, near } = useNearViewport<HTMLElement>();
  // Not merely "is WebGL available" — also "is anyone anywhere near this".
  // It used to mount on page load and render for the whole visit, several
  // screens below a guest who was still looking at the envelope.
  // The seal is an object, not an animation. A guest who asked for less
  // motion still gets it in wax with real depth and a real highlight — it
  // simply does not turn. Switching the whole third dimension off for them
  // was reading "reduce motion" as "remove everything", and on iOS that
  // setting is on for a great many people who never thought of it as one.
  const useWebGL = near && capability.ready && capability.webgl && content.motion.webgl;

  return (
    <footer ref={nearRef} className="relative z-[1] overflow-hidden px-[var(--gutter)] pb-[clamp(3rem,9vh,6rem)] pt-[clamp(3rem,10vh,7rem)]">
      <AmbientFilm film={film} opacity={content.ambient.closing.opacity} />

      <CornerSpray className="pointer-events-none absolute left-0 top-0 h-20 w-28 opacity-40 sm:-left-8 sm:h-28 sm:w-40" />
      <CornerSpray flip className="pointer-events-none absolute right-0 top-0 h-20 w-28 opacity-40 sm:-right-8 sm:h-28 sm:w-40" />

      <div className="relative mx-auto max-w-xl text-center">
        {/* The motif returns in three dimensions — or flat, for anyone whose
            device should not be asked for a second canvas. */}
        {useWebGL ? (
          <div
            className="u-reveal relative mx-auto h-[clamp(11rem,26vw,15rem)] w-[clamp(11rem,26vw,15rem)]"
            data-no-print
          >
            {/* The shadow it casts on the page. Wax does not float, and a
                soft ellipse under it costs nothing and does more for the
                sense of a real object sitting on real paper than another
                thousand triangles would. Drawn in CSS rather than in the
                scene because the canvas is transparent and has no ground to
                receive one. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[62%] -z-10 h-[26%] w-[76%] -translate-x-1/2 rounded-[50%] blur-[14px]"
              style={{ background: "rgba(92, 52, 30, 0.2)" }}
            />
            <SealScene
              monogram={content.couple.monogram}
              lowPower={capability.lowPower}
              still={capability.reducedMotion}
            />
          </div>
        ) : (
          <SealMark
            monogram={content.couple.monogram}
            className="u-reveal mx-auto h-20 w-20 drop-shadow-sm"
          />
        )}

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
