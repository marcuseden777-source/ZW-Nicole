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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
      <body>{children}</body>
    </html>
  );
}
