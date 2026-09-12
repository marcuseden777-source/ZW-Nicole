import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import * as content from "@/content/wedding";

/**
 * The wax seal, as the tab icon — generated from the same monogram as the
 * envelope, so the two can never disagree.
 *
 * It used to ask for Georgia, which the renderer does not have, so the
 * monogram came out in a generic sans at a size that ran off both edges of
 * the disc. The script face the seal actually uses is loaded here, and the
 * letters are given room to sit inside the circle.
 */

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  // Never throws: this runs during the build, so an unreadable font here
  // would fail the deployment rather than merely spoil the icon.
  let script: Buffer | null = null;
  try {
    script = await readFile(join(process.cwd(), "app", "_fonts", "Italianno-Regular.ttf"));
  } catch {
    script = null;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // Lit from the upper left, like the wax on the envelope.
          background: "radial-gradient(circle at 36% 30%, #f6e8cf 0%, #d9bf93 52%, #b08c45 100%)",
          borderRadius: "50%",
          // The pressed rim of a real seal.
          boxShadow: "inset 0 0 0 2px rgba(122,94,40,0.35)",
        }}
      >
        <div
          style={{
            // No font, no letters — the seal is still a seal.
            display: script ? "flex" : "none",
            fontFamily: "Italianno",
            fontSize: 29,
            lineHeight: 1,
            color: "#7a5e28",
            // The script sits high on its body; nudge it onto the centre line.
            marginTop: -2,
          }}
        >
          {content.couple.monogram}
        </div>
      </div>
    ),
    script
      ? {
          ...size,
          fonts: [
            { name: "Italianno" as const, data: script, weight: 400 as const, style: "normal" as const },
          ],
        }
      : size,
  );
}
