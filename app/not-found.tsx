import Link from "next/link";

import { Divider, SealMark } from "@/components/ui/Ornaments";
import * as content from "@/content/wedding";

export const metadata = {
  title: "Not found",
  // A page that does not exist has nothing to say to a search engine.
  robots: { index: false, follow: false },
};

/**
 * The page a guest reaches by mistyping the link.
 *
 * Next's own 404 is a black sans-serif line on white, and it is the one place
 * on this site a guest could land that looks like a different website
 * entirely. An invitation gets forwarded, retyped off a screenshot and
 * shortened by chat apps, so this is not a hypothetical page.
 *
 * It does exactly one job: say the invitation is real and put them back on
 * the path to it in a single tap. No apology, no "Oops", and no error code
 * set in a heavier weight than the couple's names.
 */
export default function NotFound() {
  const both = `${content.couple.partnerOne.name} ${content.couple.ampersand} ${content.couple.partnerTwo.name}`;

  return (
    <main className="relative z-[1] flex min-h-[100svh] flex-col items-center justify-center px-[var(--gutter)] py-[clamp(3rem,10vh,6rem)] text-center">
      <SealMark monogram={content.couple.monogram} className="mx-auto h-16 w-16 opacity-80" />

      <p className="u-eyebrow mt-9">This page does not exist</p>

      <h1 className="u-script u-foil mt-5 text-[clamp(2.5rem,9vw,4.25rem)]">{both}</h1>

      <Divider className="mx-auto my-8" />

      <p className="u-display max-w-[34ch] text-balance text-[clamp(1.05rem,3.4vw,1.25rem)] leading-relaxed text-ink-soft">
        The invitation is still here — the link simply picked up something extra
        along the way.
      </p>

      <Link
        href="/"
        className="u-eyebrow mt-10 inline-flex min-h-[44px] items-center rounded-full bg-gold-ink px-8 text-white transition-colors duration-300 hover:bg-gold-deep"
        style={{ letterSpacing: "0.2em" }}
      >
        Open the invitation
      </Link>

      <p className="u-eyebrow mt-10 text-ink-faint">
        {content.weddingDate.display} · {content.weddingDate.place}
      </p>
    </main>
  );
}
