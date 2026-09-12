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
 * Every candidate is checked rather than merely present, because an
 * environment variable that exists and is EMPTY is the ordinary result of
 * adding one in a dashboard and not filling it in. `??` only steps past null
 * and undefined, so an empty string was taken as the answer and `new URL("")`
 * threw — during page-data collection, which fails the entire deployment.
 * A blank box in a form should not be able to do that.
 *
 * A bare domain is accepted too. "zw-nicole.vercel.app" is what people paste,
 * and refusing it on the grounds that it has no scheme helps nobody.
 */
function resolveSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (!value) continue;
    const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      return new URL(withScheme).origin;
    } catch {
      // Whatever was typed in there is not an address. Try the next one
      // rather than taking the whole build down over it.
    }
  }

  return "http://localhost:3000";
}

const siteUrl = resolveSiteUrl();

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

          Three jobs. It grants `html.js`, which is what licenses the scroll
          reveals to start hidden — without it every section stays visible,
          so a guest with no JavaScript reads a complete invitation.

          It also grants `html.gating`, which holds the page behind the door
          until the door has decided whether there is going to be one. The
          gate is client-only, so on a mid-range phone the hero was painting
          about a second and a half before the envelope arrived over the top
          of it — the guest saw the film and the couple's names, and then a
          sealed envelope dropped over them. That is the sequence backwards.

          And it sets a dead-man's switch: if React has not booted within
          four seconds (a 404'd chunk, a dropped connection at the venue),
          both classes are dropped and everything becomes visible anyway.
          Neither class exists without JavaScript at all, so a guest without
          it is never waiting on either.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'document.documentElement.className+=" js gating";window.__zwReveal=setTimeout(function(){document.documentElement.classList.remove("js");document.documentElement.classList.remove("gating")},4000)',
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
