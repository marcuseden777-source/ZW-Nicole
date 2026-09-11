import { ImageResponse } from "next/og";
import * as content from "@/content/wedding";

/* The card people actually see when the link is shared. Generated from the
   same content file as the page, so it can never drift out of date. */

export const alt = `${content.meta.title} — ${content.meta.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
          fontFamily: "Georgia, serif",
          color: "#3b332a",
          position: "relative",
        }}
      >
        {/* A drawn frame, inset the way a printed card is */}
        <div
          style={{
            position: "absolute",
            inset: 38,
            border: "1px solid #c2a15b",
            opacity: 0.55,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 50,
            border: "1px solid #c2a15b",
            opacity: 0.3,
          }}
        />

        <div
          style={{
            fontSize: 22,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "#a1917e",
            display: "flex",
          }}
        >
          {content.meta.tagline}
        </div>

        <div
          style={{
            fontSize: 104,
            marginTop: 30,
            color: "#9a7838",
            display: "flex",
            alignItems: "center",
            gap: 26,
          }}
        >
          <span>{content.couple.groom.name}</span>
          <span style={{ fontSize: 62, color: "#c2a15b" }}>{content.couple.ampersand}</span>
          <span>{content.couple.bride.name}</span>
        </div>

        <div
          style={{
            width: 220,
            height: 1,
            background: "#c2a15b",
            opacity: 0.6,
            margin: "38px 0",
          }}
        />

        <div
          style={{
            fontSize: 27,
            letterSpacing: 5,
            textTransform: "uppercase",
            color: "#6d6051",
            display: "flex",
          }}
        >
          {content.weddingDate.display}
        </div>

        <div
          style={{
            fontSize: 19,
            letterSpacing: 4,
            marginTop: 14,
            color: "#a1917e",
            display: "flex",
          }}
        >
          {content.venue.name}
        </div>
      </div>
    ),
    size,
  );
}
