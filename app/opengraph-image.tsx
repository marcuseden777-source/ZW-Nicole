import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import * as content from "@/content/wedding";

/**
 * The card people actually see when the link is shared.
 *
 * This is the most-viewed surface of the whole project — it appears in every
 * WhatsApp forward and every iMessage thread, and most people will see it
 * before they ever open the invitation. It has to look like the invitation.
 *
 * It did not. The card declared `fontFamily: "Georgia, serif"` and loaded no
 * font at all; the renderer has no Georgia, so it silently fell back to a
 * generic sans and the couple's names went out to everyone set in the one
 * typeface that appears nowhere on the site. The three real faces are read
 * from disk here and passed in. They are committed to the repository rather
 * than fetched, so building this never depends on the network.
 *
 * Generated from the same content file as the page, so it cannot drift.
 */

export const alt = `${content.meta.title} — ${content.meta.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GOLD = "#9a7838";
const GOLD_LIGHT = "#c2a15b";
const INK = "#5c5145";
const MUTED = "#8d7f6d";

/**
 * Never throws.
 *
 * This runs during the build, so a font that cannot be read would not
 * degrade the card — it would fail the whole deployment. A share card in a
 * substitute face is a disappointment; a wedding invitation that will not
 * deploy the week it is due to go out is a different order of problem.
 */
async function font(file: string) {
  try {
    return await readFile(join(process.cwd(), "app", "_fonts", file));
  } catch {
    return null;
  }
}

type Face = { name: string; data: Buffer; weight: 400 | 600; style: "normal" };

/** The card stock, with no type on it. Needs no font, so it cannot fail. */
function blankCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(150deg, #fdfaf4 0%, #f5ece0 48%, #e9d9bf 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 34,
            left: 34,
            width: size.width - 68,
            height: size.height - 68,
            border: `1px solid ${GOLD_LIGHT}`,
            opacity: 0.5,
            display: "flex",
          }}
        />
      </div>
    ),
    size,
  );
}

export default async function Image() {
  const [script, serif, sans] = await Promise.all([
    font("Italianno-Regular.ttf"),
    font("CormorantGaramond-SemiBold.ttf"),
    font("Jost-Regular.ttf"),
  ]);

  const faces: Face[] = [];
  if (script) faces.push({ name: "Italianno", data: script, weight: 400, style: "normal" });
  if (serif) faces.push({ name: "Cormorant Garamond", data: serif, weight: 600, style: "normal" });
  if (sans) faces.push({ name: "Jost", data: sans, weight: 400, style: "normal" });

  // The renderer cannot lay out a single character without a font, so if none
  // of the three could be read there is no card to draw — only the paper it
  // would have been printed on. The link preview still carries the title and
  // description from the page metadata, and the build still finishes, which
  // is the part that matters.
  if (faces.length === 0) return blankCard();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(150deg, #fdfaf4 0%, #f5ece0 48%, #e9d9bf 100%)",
          fontFamily: "Jost",
          color: INK,
          position: "relative",
        }}
      >
        {/* The drawn frame a printed card has. Previously written with `inset`,
            which this renderer ignores — both rules were simply absent from
            every card that has gone out. Explicit box, explicit size. */}
        <div
          style={{
            position: "absolute",
            top: 34,
            left: 34,
            width: size.width - 68,
            height: size.height - 68,
            border: `1px solid ${GOLD_LIGHT}`,
            opacity: 0.5,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 44,
            left: 44,
            width: size.width - 88,
            height: size.height - 88,
            border: `1px solid ${GOLD_LIGHT}`,
            opacity: 0.28,
            display: "flex",
          }}
        />

        <div
          style={{
            fontSize: 21,
            letterSpacing: 11,
            textTransform: "uppercase",
            color: MUTED,
            display: "flex",
          }}
        >
          {content.meta.tagline}
        </div>

        {/* The names, in the hand they are written in on the page itself. */}
        <div
          style={{
            fontFamily: "Italianno",
            fontSize: 138,
            lineHeight: 1.1,
            marginTop: 4,
            color: GOLD,
            display: "flex",
            alignItems: "center",
            gap: 22,
          }}
        >
          <span>{content.couple.partnerOne.name}</span>
          <span style={{ color: GOLD_LIGHT }}>{content.couple.ampersand}</span>
          <span>{content.couple.partnerTwo.name}</span>
        </div>

        {/* The same small ornament the page uses between its sections. */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
          <div style={{ width: 96, height: 1, background: GOLD_LIGHT, opacity: 0.65, display: "flex" }} />
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: 9,
              border: `1px solid ${GOLD_LIGHT}`,
              display: "flex",
            }}
          />
          <div style={{ width: 96, height: 1, background: GOLD_LIGHT, opacity: 0.65, display: "flex" }} />
        </div>

        <div
          style={{
            fontFamily: "Cormorant Garamond",
            fontSize: 40,
            marginTop: 30,
            color: INK,
            display: "flex",
          }}
        >
          {/* The year, in figures, appended rather than set on its own line.
              This card is read at about 200px wide in a chat thread, and
              "Sunday, the Eleventh of October" thirteen months ahead does not
              say WHICH October. The page spells the year out because it has
              room to; a thumbnail does not, and being understood in one
              glance is the entire job here.

              Taken from the ISO date rather than typed, so it can never drift
              away from the date everything else is computed from. */}
          {content.weddingDate.display} {content.weddingDate.iso.slice(0, 4)}
        </div>

        <div
          style={{
            fontSize: 18,
            letterSpacing: 5,
            textTransform: "uppercase",
            marginTop: 16,
            color: MUTED,
            display: "flex",
          }}
        >
          {content.venue.name}
        </div>
      </div>
    ),
    { ...size, fonts: faces },
  );
}
