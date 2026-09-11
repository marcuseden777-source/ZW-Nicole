import { EntryGate } from "@/components/EntryGate";
import { SkipLink } from "@/components/SkipLink";
import { GateBoundary } from "@/components/GateBoundary";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Closing } from "@/components/sections/Closing";
import { Countdown } from "@/components/sections/Countdown";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
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
      {/* The door. Client-only and above everything, over a page that is
          already complete in the HTML — so a crawler, a link-preview bot and
          a guest without JavaScript get the invitation and never meet a gate. */}
      <GateBoundary>
        <EntryGate />
      </GateBoundary>

      <SmoothScroll />

      {/* Guests arriving with a keyboard or a screen reader should not have to
          scroll through an envelope to reach the details. */}
      <SkipLink targetId="welcome-heading" />

      <div id="site-root">
        <main>
        <Hero />
        <Welcome />

        {phase === "invitation" && <Countdown />}

        <Story />

        {phase === "invitation" ? (
          <>
            <Timeline />
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
      </div>

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
