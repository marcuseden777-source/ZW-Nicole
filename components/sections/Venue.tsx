import { Divider } from "@/components/ui/Ornaments";
import * as content from "@/content/wedding";

/** Where to come, and a calendar the guest can keep. */
export function Venue() {
  const calendarHref = buildCalendarLink();

  return (
    <section
      aria-labelledby="venue-heading"
      className="relative z-[1] px-[var(--gutter)] py-[clamp(3rem,10vh,7rem)]"
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 id="venue-heading" className="u-reveal u-script text-[clamp(2.5rem,9vw,4rem)] text-gold-deep">
          Finding Us
        </h2>
        <Divider className="mx-auto mt-5" />

        <div className="u-reveal mt-9">
          <p className="u-display text-[clamp(1.2rem,4vw,1.6rem)] text-ink">{content.venue.name}</p>
          <address className="u-display mt-2 not-italic leading-relaxed text-ink-soft">
            {content.venue.address}
          </address>
          {content.venue.note && (
            <p className="u-display mt-4 text-sm italic text-ink-faint">{content.venue.note}</p>
          )}
        </div>

        <div className="u-reveal mt-9 flex flex-wrap items-center justify-center gap-3">
          {content.venue.mapUrl && (
            <a
              href={content.venue.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="u-eyebrow rounded-full border px-7 py-3.5 text-ink transition-colors duration-300 hover:bg-gold-ink hover:text-white"
              style={{ borderColor: "var(--rule)" }}
            >
              Open the map
            </a>
          )}
          {calendarHref && (
            <a
              href={calendarHref}
              download="wedding.ics"
              className="u-eyebrow rounded-full border px-7 py-3.5 text-ink transition-colors duration-300 hover:bg-gold-ink hover:text-white"
              style={{ borderColor: "var(--rule)" }}
            >
              Save the date
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * A calendar entry built as a data link, so "Save the date" works on every
 * phone without a server request or a third-party calendar service.
 */
function buildCalendarLink(): string | null {
  const start = new Date(content.weddingDate.iso);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start.getTime() + 6 * 60 * 60 * 1000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  // Long lines and stray commas break calendar clients; both need escaping.
  const escape = (s: string) => s.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wedding//Invitation//EN",
    "BEGIN:VEVENT",
    `UID:${stamp(start)}-wedding@invitation`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(`${content.couple.groom.name} & ${content.couple.bride.name} — ${content.events[0]?.name ?? "Wedding"}`)}`,
    `LOCATION:${escape(content.venue.address)}`,
    `DESCRIPTION:${escape(content.opening.body)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
