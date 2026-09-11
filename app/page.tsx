import { EntryGate } from "@/components/EntryGate";
import { World } from "@/components/World";
import { SkipLink } from "@/components/SkipLink";
import { GateBoundary } from "@/components/GateBoundary";
import { Nav } from "@/components/Nav";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Closing } from "@/components/sections/Closing";
import { Carousel } from "@/components/sections/Carousel";
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
import { readAmbient, readDayGallery, readGallery } from "@/lib/media";

/**
 * Which life the site is living. The hosting dashboard can override the
 * content file, so the couple can turn the invitation into the keepsake
 * the morning after the wedding without touching a line of code.
 */
function resolvePhase(): Phase {
  const override = process.env.NEXT_PUBLIC_PHASE;
  return override === "invitation" || override === "keepsake" ? override : content.phase;
}

export default async function Page() {
  const phase = resolvePhase();

  // The photographs and the films are read from /public at build time rather
  // than listed by hand. Drop files into the folders and they appear; leave
  // the folders empty and every section that uses them shows its considered
  // empty state instead. Nobody has to edit TypeScript to add a picture.
  //
  // Two folders, because they are two sets: /public/gallery holds the
  // pictures the couple already have of each other, which the Moments reel
  // shows in both phases, and /public/gallery/the-day holds the photographs
  // of the wedding itself, which the keepsake wall shows afterwards.
  const [photos, dayPhotos] = await Promise.all([readGallery(), readDayGallery()]);
  const films = readAmbient();

  return (
    <>
      {/* First in the document, because a skip link that is not the first
          thing a keyboard reaches is decoration. Guests arriving with a
          keyboard or a screen reader should not have to pass the menu and an
          envelope to get to the details. */}
      <SkipLink targetId="welcome-heading" />

      {/* The door. Client-only and above everything, over a page that is
          already complete in the HTML — so a crawler, a link-preview bot and
          a guest without JavaScript get the invitation and never meet a gate. */}
      <GateBoundary>
        <EntryGate bloom={films.bloom ?? null} />
      </GateBoundary>

      <SmoothScroll />

      {/* One scene the whole document scrolls through, behind everything. */}
      <World />

      {/* The shortcut for the guest in a taxi who wants the address and
          nothing else. Appears only once the door is open. */}
      <Nav
        destinations={
          phase === "invitation"
            ? [
                { id: "welcome-heading", label: "The Invitation" },
                { id: "story-heading", label: "Our Story" },
                { id: "carousel-heading", label: "Moments" },
                { id: "timeline-heading", label: "The Day" },
                { id: "venue-heading", label: "Getting There" },
                { id: "faq-heading", label: "Good to Know" },
                { id: "rsvp-heading", label: "RSVP" },
              ]
            : [
                { id: "welcome-heading", label: "The Invitation" },
                { id: "story-heading", label: "Our Story" },
                { id: "carousel-heading", label: "Moments" },
                { id: "gallery-heading", label: "The Day" },
                // Guestbook renders nothing until somebody has written
                // something, so listing it unconditionally gave the menu an
                // entry that scrolled nowhere.
                ...(content.guestbook.length
                  ? [{ id: "guestbook-heading", label: "In Their Words" }]
                  : []),
                { id: "venue-heading", label: "Getting There" },
              ]
        }
      />

      <div id="site-root">
        {/* tabIndex -1 so the door can hand focus here when it closes. It is
            not a tab stop; it is somewhere focus can legitimately land. */}
        <main tabIndex={-1} className="focus:outline-none">
        <Hero />
        <Welcome />

        {phase === "invitation" && <Countdown />}

        <Story film={films.silk ?? null} />
        <Carousel photos={photos} />

        {phase === "invitation" ? (
          <>
            <Timeline phase={phase} />
            <Venue phase={phase} />
            <Faq />
            <Rsvp />
          </>
        ) : (
          <>
            <Gallery photos={dayPhotos} />
            <Guestbook />
            <Timeline phase={phase} />
            <Venue phase={phase} />
          </>
        )}
        </main>

        <Closing phase={phase} film={films.letter ?? null} />
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
