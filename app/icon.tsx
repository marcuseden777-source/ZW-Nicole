import { ImageResponse } from "next/og";
import * as content from "@/content/wedding";

/* The wax seal, as the tab icon — generated from the same monogram as the
   envelope, so the two can never disagree. */

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 38% 32%, #f3e2c4 0%, #dcc49e 55%, #c2a15b 100%)",
          color: "#8a6b2f",
          fontSize: 34,
          fontFamily: "Georgia, serif",
          borderRadius: "50%",
        }}
      >
        {content.couple.monogram}
      </div>
    ),
    size,
  );
}
