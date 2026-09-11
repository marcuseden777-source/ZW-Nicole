import { SmoothScroll } from "@/components/SmoothScroll";
import { Closing } from "@/components/sections/Closing";
import { Countdown } from "@/components/sections/Countdown";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { Invitation } from "@/components/sections/Invitation";
import { Gallery, Guestbook } from "@/components/sections/Keepsake";
import { Rsvp } from "@/components/sections/Rsvp";
import { Story } from "@/components/sections/Story";
import { Timeline } from "@/components/sections/Timeline";
import { Venue } from "@/components/sections/Venue";
import { Welcome } from "@/components/sections/Welcome";
import * as content from "@/content/wedding";
import type { Phase } from "@/content/wedding";

/**
 * Which life the site is living. The hosting dashboard can override the
 * content file, so the couple can turn the invitation into the keepsake
 * the morning after the wedding without touching a line of code.
 */
function resolvePhase(): Phase {
  const override = process.env.NEXT_PUBLIC_PHASE;
  return override === "invitation" || override === "keepsake" ? override : content.phase;
}

export default function Page() {
  const phase = resolvePhase();

  return (
    <>
      <SmoothScroll />

      {/* Guests arriving with a keyboard or a screen reader should not have to
          scroll through an envelope to reach the details. */}
      <a
        href="#invitation-heading"
        className="u-eyebrow sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:border focus:border-gold focus:bg-ivory focus:px-6 focus:py-3"
      >
        Skip to the invitation
      </a>

      <main>
        <Hero />
        <Welcome />
        <Invitation />
        <Story />

        {phase === "invitation" ? (
          <>
            <Timeline />
            <Countdown />
            <Venue />
            <Faq />
            <Rsvp />
          </>
        ) : (
          <>
            <Gallery />
            <Guestbook />
            <Timeline />
            <Venue />
          </>
        )}
      </main>

      <Closing phase={phase} />

      <StructuredData />
    </>
  );
}

/**
 * Tells search engines and assistants what this page actually is — an event,
 * with a date and a place — rather than leaving them to guess from the prose.
 */
function StructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${content.couple.partnerOne.name} ${content.couple.ampersand} ${content.couple.partnerTwo.name}`,
    description: content.meta.description,
    startDate: content.weddingDate.iso,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: content.venue.name,
      address: content.venue.address,
    },
  };

  return (
    <script
      type="application/ld+json"
      // The object is built here from our own content file — there is no
      // external input in it to escape.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
