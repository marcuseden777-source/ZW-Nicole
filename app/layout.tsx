import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Italianno, Jost } from "next/font/google";

import * as content from "@/content/wedding";
import "./globals.css";

/* Self-hosted at build time by next/font — no request ever leaves for a
   font service, so the invitation loads fast and tracks nobody. */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const italianno = Italianno({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-italianno",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-jost",
  display: "swap",
});

/**
 * The address this invitation lives at.
 *
 * It matters more than it looks: share previews and the `Event` structured
 * data are both built from it, so if it is wrong the card that lands in the
 * family WhatsApp group is wrong, and that is the first thing anybody sees.
 *
 * Set NEXT_PUBLIC_SITE_URL to the real domain. If nobody remembers to,
 * Vercel's own build-time variables are used rather than localhost — a
 * forgotten setting should not be the reason a link preview is broken.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${content.meta.title} — ${content.meta.tagline}`,
    template: `%s — ${content.meta.title}`,
  },
  description: content.meta.description,
  applicationName: content.meta.title,
  authors: [{ name: content.meta.title }],
  keywords: [
    content.couple.partnerOne.name,
    content.couple.partnerTwo.name,
    "wedding",
    "solemnisation",
    "invitation",
    content.weddingDate.place,
    content.venue.name,
  ],
  // How the link looks the moment it lands in a WhatsApp thread.
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: content.meta.title,
    title: `${content.meta.title} — ${content.meta.tagline}`,
    description: content.meta.description,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: `${content.meta.title} — ${content.meta.tagline}`,
    description: content.meta.description,
  },
  robots: {
    // A private celebration should not be indexed by default. Change both to
    // true if you would like the invitation to be findable in search.
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf7f0",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${italianno.variable} ${jost.variable}`}
    >
      <head>
        {/*
          Runs before first paint, so there is no flash of revealed content.

          Two jobs. It grants `html.js`, which is what licenses the scroll
          reveals to start hidden — without it every section stays visible,
          so a guest with no JavaScript reads a complete invitation.

          And it sets a dead-man's switch: if React has not booted within
          four seconds (a 404'd chunk, a dropped connection at the venue),
          the class is dropped and everything becomes visible anyway. The
          reveal hook clears the timer the moment it runs.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'document.documentElement.className+=" js";window.__zwReveal=setTimeout(function(){document.documentElement.classList.remove("js")},4000)',
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
