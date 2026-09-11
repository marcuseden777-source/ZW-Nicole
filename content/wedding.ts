/* ═══════════════════════════════════════════════════════════════════════════
 *
 *   T H E   I N V I T A T I O N
 *
 *   This is the only file you need to edit.
 *
 *   Everything the site says, shows and celebrates lives here — names, dates,
 *   venues, the timeline, the photographs, the closing dua. Change a value,
 *   save, and the page updates. You never have to touch the design or the code.
 *
 *   Lines that begin with // are notes for you. They are invisible on the site.
 *
 * ═══════════════════════════════════════════════════════════════════════════ */

export type Phase = "invitation" | "keepsake";

/* ───────────────────────────────────────────────────────────────────────────
 *  1.  W H I C H   L I F E   I S   T H E   S I T E   L I V I N G ?
 *
 *  "invitation" — before the wedding. Sealed envelope, event details, RSVP.
 *  "keepsake"   — after the wedding. The RSVP form is replaced by the photo
 *                 gallery and the guest messages. Same link, same design.
 *
 *  Change this one word after the wedding and the site becomes the memory.
 *  (You can also set NEXT_PUBLIC_PHASE in the hosting dashboard to flip it
 *  without editing this file at all.)
 * ─────────────────────────────────────────────────────────────────────────── */
export const phase: Phase = "invitation";

/* ───────────────────────────────────────────────────────────────────────────
 *  2.  T H E   C O U P L E
 * ─────────────────────────────────────────────────────────────────────────── */
export const couple = {
  // How the names appear in the large script across the arch.
  bride: {
    name: "Adeena",
    // The traditional line beneath the name. Set to "" to leave it out.
    lineage: "Daughter of Mr & Mrs Ch. Farooqi",
  },
  groom: {
    name: "Daanish",
    lineage: "Son of Mr & Mrs S. Rehman",
  },

  // The two letters pressed into the wax seal on the envelope.
  monogram: "D&A",

  // The word joining the names. "&" or "and" or "•" all look right.
  ampersand: "&",
} as const;

/* ───────────────────────────────────────────────────────────────────────────
 *  3.  T H E   D A T E
 *
 *  `iso` must stay in YYYY-MM-DDTHH:MM form — the countdown, the calendar
 *  button and the search-engine listing all read it. `display` is the pretty
 *  version shown on screen; write it however you like.
 * ─────────────────────────────────────────────────────────────────────────── */
export const weddingDate = {
  iso: "2026-11-14T18:00",
  display: "Saturday, the Fourteenth of November",
  year: "Two Thousand & Twenty-Six",
  // IANA timezone — keeps the countdown honest for guests abroad.
  timeZone: "Europe/Stockholm",
};

/* ───────────────────────────────────────────────────────────────────────────
 *  4.  T H E   O P E N I N G   W O R D S
 * ─────────────────────────────────────────────────────────────────────────── */
export const opening = {
  // Shown in Arabic script above the arch. Set to "" to omit.
  bismillah: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
  bismillahTranslit: "In the name of Allah, the Most Gracious, the Most Merciful",

  // The line above the couple's names on the arch.
  eyebrow: "Welcome to the Nikkah Ceremony of",

  // The invitation proper.
  salutation: "Dear Friends and Family",
  body: "Join us for an evening of love, laughter, duas, and unforgettable memories as we begin our forever.",
};

/* A verse or quotation, set apart on its own. Set `enabled: false` to hide. */
export const verse = {
  enabled: true,
  text: "And among His signs is that He created for you mates from among yourselves, that you may dwell in tranquillity with them, and He has put love and mercy between your hearts.",
  attribution: "Surah Ar-Rum, 30:21",
};

/* ───────────────────────────────────────────────────────────────────────────
 *  5.  T H E   C E L E B R A T I O N S
 *
 *  Add, remove or reorder freely — the page builds itself from this list.
 *  Delete an entry by removing everything between its { and its },
 * ─────────────────────────────────────────────────────────────────────────── */
export const events = [
  {
    name: "Mehndi",
    tagline: "An evening of colour, music and henna",
    date: "Thursday, 12 November 2026",
    time: "7:00 PM onwards",
    venue: "The Garden Room",
    address: "Strandvägen 12, Stockholm",
    dressCode: "Festive colours",
  },
  {
    name: "Nikkah",
    tagline: "The ceremony, and the promise",
    date: "Saturday, 14 November 2026",
    time: "6:00 PM",
    venue: "Grand Mosque Hall",
    address: "Kapellgränd 10, Stockholm",
    dressCode: "Formal traditional",
  },
  {
    name: "Walima",
    tagline: "Dinner, and the first celebration as one",
    date: "Sunday, 15 November 2026",
    time: "7:30 PM",
    venue: "Villa Aurora",
    address: "Djurgårdsvägen 68, Stockholm",
    dressCode: "Black tie with a touch of gold",
  },
];

/* ───────────────────────────────────────────────────────────────────────────
 *  6.  T H E   E V E N I N G,   H O U R   B Y   H O U R
 * ─────────────────────────────────────────────────────────────────────────── */
export const timeline = [
  { time: "6:00 PM", title: "Guest Arrival", detail: "Welcome drinks and photographs" },
  { time: "6:45 PM", title: "Entrance of the Bride", detail: "Please be seated by this time" },
  { time: "7:15 PM", title: "Nikkah Ceremony", detail: "The vows, and the signing" },
  { time: "8:00 PM", title: "Duas & Blessings", detail: "Family and elders" },
  { time: "8:30 PM", title: "Dinner Is Served", detail: "" },
  { time: "10:00 PM", title: "The First Dance", detail: "And the evening opens up" },
  { time: "12:00 AM", title: "Farewell", detail: "Rukhsati" },
];

/* ───────────────────────────────────────────────────────────────────────────
 *  7.  G E T T I N G   T H E R E
 * ─────────────────────────────────────────────────────────────────────────── */
export const venue = {
  name: "Grand Mosque Hall",
  address: "Kapellgränd 10, 116 25 Stockholm, Sweden",
  // Paste any map link here — Google, Apple or Waze all work.
  mapUrl: "https://maps.google.com/?q=Kapellgr%C3%A4nd+10+Stockholm",
  note: "Parking is available on site. The hall is fully step-free.",
};

/* ───────────────────────────────────────────────────────────────────────────
 *  8.  R S V P      (shown while phase is "invitation")
 * ─────────────────────────────────────────────────────────────────────────── */
export const rsvp = {
  enabled: true,
  heading: "Will you be there?",
  note: "Kindly reply by the first of October so we can hold your seat.",
  deadlineDisplay: "1 October 2026",
  // The most people one guest may bring, themselves included.
  maxPartySize: 6,
  // Ask each guest which celebrations they will attend. Names must match
  // the `name` values in the events list above.
  askWhichEvents: true,
};

/* ───────────────────────────────────────────────────────────────────────────
 *  9.  T H E   G A L L E R Y      (shown once phase is "keepsake")
 *
 *  Drop photographs into the /public/gallery folder, then list them here.
 *  `alt` is read aloud by screen readers and shown if an image fails to
 *  load — write it as you would describe the photo to someone on the phone.
 *
 *  Leave the list empty and the gallery shows a graceful "coming soon" card
 *  instead of breaking.
 * ─────────────────────────────────────────────────────────────────────────── */
export const gallery: { src: string; alt: string; span?: "wide" | "tall" }[] = [
  // { src: "/gallery/01.jpg", alt: "Adeena and Daanish beneath the arch", span: "wide" },
  // { src: "/gallery/02.jpg", alt: "Signing the nikkah nama" },
];

/* A film from the day — a YouTube or Vimeo link. Set to "" to leave it out. */
export const filmUrl = "";

/* ───────────────────────────────────────────────────────────────────────────
 * 10.  M E S S A G E S   F R O M   G U E S T S      (phase "keepsake")
 *
 *  Paste in the notes people send — from the RSVP form, from WhatsApp, from
 *  the cards on the night. They appear as a wall of handwriting.
 * ─────────────────────────────────────────────────────────────────────────── */
export const guestbook: { from: string; message: string }[] = [
  // { from: "Nani", message: "May your home always be full of laughter." },
];

/* ───────────────────────────────────────────────────────────────────────────
 * 11.  T H E   L A S T   W O R D
 * ─────────────────────────────────────────────────────────────────────────── */
export const closing = {
  // Shown only while phase is "invitation".
  invitation: "We cannot wait to celebrate with you.",
  // Shown once phase is "keepsake".
  keepsake: "Thank you for standing with us on the best day of our lives.",
  dua: "بَارَكَ اللَّهُ لَكُمَا وَبَارَكَ عَلَيْكُمَا",
  duaTranslit: "May Allah bless you both, and bless your union.",
};

/* ───────────────────────────────────────────────────────────────────────────
 * 12.  H O W   I T   L O O K S   W H E N   S H A R E D
 *
 *  The title and line that appear when the link is sent on WhatsApp,
 *  iMessage or Instagram, and what search engines list.
 * ─────────────────────────────────────────────────────────────────────────── */
export const meta = {
  title: `${couple.groom.name} ${couple.ampersand} ${couple.bride.name}`,
  tagline: "You are invited",
  description: `Join ${couple.groom.name} and ${couple.bride.name} as they begin their forever — ${weddingDate.display}, ${weddingDate.year}.`,
};

/* ───────────────────────────────────────────────────────────────────────────
 * 13.  T H E   E N V E L O P E
 *
 *  The sealed envelope guests meet first. `waxColor` is the seal — a deep
 *  oxblood by default, the way a pressed wax seal actually looks. The initials
 *  in `couple.monogram` are pressed into it.
 *
 *  `emboss` adds a raised botanical pattern across the paper. Off by default,
 *  for the clean smooth stock of a classic envelope — set it to true if you
 *  would rather have the florals.
 * ─────────────────────────────────────────────────────────────────────────── */
export const envelope = {
  waxColor: "#7d2228",
  paperColor: "#fdf8ee",
  emboss: false,
};

/* ───────────────────────────────────────────────────────────────────────────
 * 14.  M O T I O N
 *
 *  The envelope, the petals and the depth are built in real 3D. If you ever
 *  want the quieter version, set `webgl` to false — the site keeps its full
 *  design and simply stops rendering the three-dimensional layer.
 *
 *  Guests who ask their phone to reduce motion are always given the calm
 *  version automatically. You do not need to do anything for that.
 * ─────────────────────────────────────────────────────────────────────────── */
export const motion = {
  webgl: true,
  // Petals drifting through the arch. 0 turns them off.
  petalCount: 90,
};
