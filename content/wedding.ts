/* ═══════════════════════════════════════════════════════════════════════════
 *
 *   Z H I   W E I   &   N I C O L E
 *   Sunday, 11 October 2026 · Sofitel Singapore City Centre
 *
 *   This is the only file you need to edit.
 *
 *   Everything the site says and shows lives here — names, the date, the
 *   schedule, their story, the photographs, the closing words. Change a
 *   value, save, and the page updates. The design is never touched.
 *
 *   Lines beginning with // are notes for you. They never appear on the site.
 *
 * ═══════════════════════════════════════════════════════════════════════════ */

export type Phase = "invitation" | "keepsake";

/* ───────────────────────────────────────────────────────────────────────────
 *  1.  W H I C H   L I F E   I S   T H E   S I T E   L I V I N G ?
 *
 *  "invitation" — before the wedding. Sealed envelope, schedule, RSVP.
 *  "keepsake"   — after the wedding. The RSVP is replaced by the photographs
 *                 and the messages people left. Same link, same design.
 *
 *  Change this one word after the wedding and the site becomes the memory.
 *  (NEXT_PUBLIC_PHASE in the hosting dashboard overrides it, so the switch
 *  can be flipped without touching this file at all.)
 * ─────────────────────────────────────────────────────────────────────────── */
export const phase: Phase = "invitation";

/* ───────────────────────────────────────────────────────────────────────────
 *  2.  T H E   C O U P L E
 * ─────────────────────────────────────────────────────────────────────────── */
export const couple = {
  // The two of them, in the order you would like them read. Whoever is first
  // appears first everywhere — the arch, the share card, the calendar entry —
  // so this is the only place that order needs deciding.
  partnerOne: {
    name: "Zhi Wei",
    // A line beneath the name — parents, family, however they should be
    // introduced. Left empty, it simply does not appear.
    lineage: "",
  },
  partnerTwo: {
    name: "Nicole",
    lineage: "",
  },

  // The initials pressed into the wax seal on the envelope.
  monogram: "Z&N",

  // The word joining the names. "&" or "and" or "•" all sit well.
  ampersand: "&",
} as const;

/* ───────────────────────────────────────────────────────────────────────────
 *  3.  T H E   D A T E
 *
 *  `iso` must stay in YYYY-MM-DDTHH:MM form — the countdown, the calendar
 *  button and the search listing all read it. `display` is the pretty version
 *  on screen, written however you like.
 * ─────────────────────────────────────────────────────────────────────────── */
export const weddingDate = {
  // The first guests arrive for the cocktail reception at 11:30.
  //
  // The "+08:00" matters and must stay. Without an offset, every browser
  // reads this as 11:30 in ITS OWN timezone — so the countdown and the
  // "Save the date" file would have told a guest in London to be somewhere
  // seven hours after the wedding started. It is one instant in time now,
  // and it is the same instant wherever it is read.
  iso: "2026-10-11T11:30:00+08:00",
  display: "Sunday, the Eleventh of October",
  year: "Two Thousand & Twenty-Six",
  place: "Singapore",
  timeZone: "Asia/Singapore",
};

/* ───────────────────────────────────────────────────────────────────────────
 *  4.  T H E   O P E N I N G   W O R D S
 * ─────────────────────────────────────────────────────────────────────────── */
export const opening = {
  // The small line above the names on the arch.
  // Kept to what is actually known. A line like "Together with their
  // families" implies who is hosting, which is not ours to assume.
  eyebrow: "The wedding of",

  salutation: "With Joyful Hearts",
  body: "Your presence means the world to us, and we would be honoured to have you join our wedding celebration.",
};

/* A line set apart on its own. Set `enabled: false` to leave it out. */
export const verse = {
  enabled: true,
  text: "One drink became many more, and somewhere between all the laughter, conversations and late nights, we realised how much we actually had in common.",
  attribution: "",
};

/* ───────────────────────────────────────────────────────────────────────────
 *  5.  T H E I R   S T O R Y
 *
 *  Each string is one paragraph. Add or remove as you like.
 * ─────────────────────────────────────────────────────────────────────────── */
export const story = {
  enabled: true,
  heading: "Our Story",
  paragraphs: [
    "It all started back in 2012 at the IT Show in Suntec City Convention Hall, where both of us were working at a Singtel booth. Zhi Wei was handling inventory while Nicole was busy doing face-to-face sales for mobile and tablet accessories alongside his sister. Back then, we barely interacted — and life simply carried on in different directions.",
    "Even so, Instagram quietly kept us connected over the years, letting us catch little glimpses of each other's lives from afar. Fast forward to 2022, when Zhi Wei finally slid into Nicole's DMs after replying to one of the fun questionnaires on her Instagram story. What started as casual conversations slowly turned into a friendship, and after saying “Let's catch up for drinks someday” countless times over the years… we finally did.",
    "Then came our trip to Phuket in 2022 — the trip that changed everything. Somewhere between the sunsets, adventures, and little moments together, we both knew we had found someone truly special. From there, love and trust blossomed naturally, and what started as a simple friendship became the forever we have today.",
  ],
};

/* ───────────────────────────────────────────────────────────────────────────
 *  5b.  T H E   P A U S E S
 *
 *  Three places where the page stops talking and gives you a photograph,
 *  floor to ceiling. They take their pictures from /public/gallery on their
 *  own — you never have to name a file — so they keep working as photographs
 *  are added or removed.
 *
 *  `line` is what is written across the bottom. Leave it empty ("") and the
 *  photograph is shown with nothing on it at all, which is often the stronger
 *  of the two. Keep them SHORT: this is set very large, and anything past
 *  about six words stops being a line and starts being a paragraph.
 *
 *  These are drafts written from the story above. Say them out loud and change
 *  anything that does not sound like the two of you.
 * ─────────────────────────────────────────────────────────────────────────── */
export const interludes = [
  {
    eyebrow: "Two thousand and twelve",
    line: "Ten years of almost meeting.",
  },
  {
    // Nothing written on this one — by the time a guest reaches it they have
    // just come out of the album, and another line of type would be noise.
    eyebrow: "",
    line: "",
  },
  {
    eyebrow: "Phuket, two thousand and twenty-two",
    line: "And everything after.",
  },
];

/* ───────────────────────────────────────────────────────────────────────────
 *  6.  T H E   D A Y,   H O U R   B Y   H O U R
 * ─────────────────────────────────────────────────────────────────────────── */
export const timeline = [
  {
    time: "11:30 AM",
    title: "Cocktail Reception",
    detail: "Join us early to enjoy the cocktails, snacks, drinks and photobooth.",
  },
  {
    time: "12:00 PM",
    title: "Solemnisation",
    detail:
      "Open to everyone. Grab your drinks with you and get seated to witness our solemnisation ceremony.",
  },
  {
    time: "12:30 PM",
    title: "Lunch Banquet",
    detail:
      "After we say “I do”, we're keeping the celebration going with great food, drinks and wonderful company. Come ready to celebrate with us.",
  },
];

/* ───────────────────────────────────────────────────────────────────────────
 *  7.  G E T T I N G   T H E R E
 * ─────────────────────────────────────────────────────────────────────────── */
export const venue = {
  name: "Sofitel Singapore City Centre",
  address: "9 Wallich Street, Singapore 078885",
  mapUrl: "https://maps.google.com/?q=Sofitel+Singapore+City+Centre+9+Wallich+Street",

  // Each of these becomes its own card. Remove one by deleting its block.
  directions: [
    {
      mode: "By car",
      detail:
        "Park at Guoco Tower Carpark B — it gives the most direct access to the hotel lobby. Complimentary parking tickets are available; do collect them at the reception.",
    },
    {
      mode: "By train",
      detail:
        "Tanjong Pagar MRT (EW15). Follow signs to Exit A / Guoco Tower, take the escalator or lift up to Level 5, and the hotel entrance is visible inside the connected building. Very convenient even if it's raining.",
    },
  ],
};

/* ───────────────────────────────────────────────────────────────────────────
 *  8.  G O O D   T O   K N O W
 *
 *  The questions guests actually ask. Add or remove freely.
 * ─────────────────────────────────────────────────────────────────────────── */
export const faq: {
  question: string;
  answer: string;
  /** Optional. Give an answer a way to act on itself. */
  link?: { label: string; href: string };
}[] = [
  {
    question: "What should I wear?",
    answer: "Smart casual — an outfit for a luncheon, to be specific.",
  },
  {
    question: "Can I bring a date?",
    answer: "Please check your invite for your +1.",
  },
  {
    question: "What's the RSVP deadline?",
    answer: "Please reply by the 31st of July, so we can get an accurate headcount.",
    link: { label: "Reply now", href: "https://withjoy.com/nicole-zhiwei/rsvp?v=1" },
  },
  {
    question: "I have a dietary restriction — what should I do?",
    answer:
      "Do let us know beforehand, so we can have the restaurant prepare according to your needs.",
    // Without this the answer is a dead end: it asks the guest to tell you
    // something and offers them nowhere to say it.
    link: { label: "Tell us in your reply", href: "https://withjoy.com/nicole-zhiwei/rsvp?v=1" },
  },
];

/* ───────────────────────────────────────────────────────────────────────────
 *  9.  R S V P      (shown while phase is "invitation")
 *
 *  Replies are handled on the couple's own Joy page, so this section is a
 *  single invitation to go there rather than a second form collecting the
 *  same answers twice.
 * ─────────────────────────────────────────────────────────────────────────── */
export const rsvp = {
  enabled: true,
  heading: "Will you be there?",
  note: "Kindly reply by the thirty-first of July, so we can hold your seat.",
  buttonLabel: "Reply to the invitation",
  url: "https://withjoy.com/nicole-zhiwei/rsvp?v=1",
};

/* ───────────────────────────────────────────────────────────────────────────
 * 10.  W H O   T O   A S K
 *
 *  Left deliberately blank: this repository may be public one day, and the
 *  couple's personal numbers should not be sitting in it. Fill them in only
 *  if the site is going somewhere private, or leave them out and let the
 *  Joy page carry them.
 * ─────────────────────────────────────────────────────────────────────────── */
export const contacts = {
  enabled: false,
  heading: "Any questions?",
  people: [
    { name: "Zhi Wei", contact: "" },
    { name: "Nicole", contact: "" },
  ],
};

/* ───────────────────────────────────────────────────────────────────────────
 * 11.  T H E   G A L L E R Y      (shown once phase is "keepsake")
 *
 *  There is no list of photographs here, and there is not meant to be.
 *  Drop image files into /public/gallery and the site finds them when it
 *  builds: it reads each picture's real proportions out of the file, takes the
 *  caption from the filename, and makes a blurred placeholder. Nobody has to
 *  measure a photograph to add one. See ASSETS.md.
 *
 *  What lives here is only what the page should say while the folder is still
 *  empty — which is a different sentence before the wedding and after it.
 * ─────────────────────────────────────────────────────────────────────────── */
export const galleryEmpty = {
  /* Shown where the photographs will go, before the wedding. */
  invitation: "The photographs are being gathered. They will live here soon.",
  /* And afterwards, while they are still being chosen. */
  keepsake: "The photographs from the day are being chosen. They will be here shortly.",
};

/* A film from the day — a YouTube or Vimeo embed link. "" leaves it out. */
export const filmUrl = "";

/* ───────────────────────────────────────────────────────────────────────────
 * 12.  M E S S A G E S   F R O M   G U E S T S      (phase "keepsake")
 * ─────────────────────────────────────────────────────────────────────────── */
export const guestbook: { from: string; message: string }[] = [];

/* ───────────────────────────────────────────────────────────────────────────
 * 13.  T H E   L A S T   W O R D
 * ─────────────────────────────────────────────────────────────────────────── */
export const closing = {
  invitation: "We cannot wait to celebrate with you.",
  keepsake: "Thank you for standing with us on the best day of our lives.",
};

/* ───────────────────────────────────────────────────────────────────────────
 * 14.  H O W   I T   L O O K S   W H E N   S H A R E D
 * ─────────────────────────────────────────────────────────────────────────── */
export const meta = {
  title: `${couple.partnerOne.name} ${couple.ampersand} ${couple.partnerTwo.name}`,
  tagline: "You are invited",
  description: `Join ${couple.partnerOne.name} and ${couple.partnerTwo.name} as they begin their forever — ${weddingDate.display}, ${weddingDate.year}, in ${weddingDate.place}.`,
};

/* ───────────────────────────────────────────────────────────────────────────
 * 15.  T H E   E N V E L O P E
 *
 *  The sealed envelope guests meet first. The initials in `couple.monogram`
 *  are pressed into the wax.
 *
 *  `emboss` adds a raised botanical pattern across the paper. Off by default,
 *  for clean smooth stock — set it true if you would rather have the florals.
 * ─────────────────────────────────────────────────────────────────────────── */
export const envelope = {
  waxColor: "#7d2228",
  paperColor: "#fdf8ee",
  emboss: false,
};

/* ───────────────────────────────────────────────────────────────────────────
 * 16.  T H E   D O O R
 *
 *  The sealed envelope guests meet first. It is the way in: tap it, the wax
 *  breaks, and it clears away to the film beneath.
 *
 *  `rememberForSession` skips the door if the guest has already come through
 *  it in this browser session, so a refresh halfway down the page does not
 *  put them back outside. Close the tab and it greets them again.
 * ─────────────────────────────────────────────────────────────────────────── */
export const door = {
  prompt: "Tap to open",
  // Milliseconds. The opening is deliberately unhurried — it is the gift.
  openDuration: 2800,
  clearDuration: 1100,
  rememberForSession: true,
};

/* ───────────────────────────────────────────────────────────────────────────
 * 17.  T H E   L A N D I N G   F I L M
 *
 *  The film behind the sealed envelope. Two cuts: one framed for laptops,
 *  one for phones — the browser downloads only the one it needs.
 *
 *  Both are muted and looping, because every browser refuses to autoplay
 *  anything with sound. A guest who has asked their phone for reduced motion
 *  is shown the still poster frame instead, never the moving film.
 *
 *  Each cut ships twice. WebM/VP9 is offered first — it is roughly half the
 *  size and plays in Chrome, Firefox, Edge and Android; H.264 follows for
 *  Safari and iOS, which do not take VP9. Between them every guest is covered.
 *
 *  Replacing them: drop new files into /public/hero and keep the names. Do
 *  not ship H.265 — the originals were H.265, which plays in Safari but not
 *  in Chrome on Windows or Android, and not in Firefox at all.
 * ─────────────────────────────────────────────────────────────────────────── */
export const heroFilm = {
  enabled: true,
  desktop: {
    webm: "/hero/landing-desktop.webm",
    mp4: "/hero/landing-desktop.mp4",
    poster: "/hero/landing-desktop.jpg",
  },
  mobile: {
    webm: "/hero/landing-mobile.webm",
    mp4: "/hero/landing-mobile.mp4",
    poster: "/hero/landing-mobile.jpg",
  },
  // How far the film is dimmed so the cream envelope reads against it, 0–1.
  scrim: 0.26,
};

/* ───────────────────────────────────────────────────────────────────────────
 * 18.  A M B I E N T   F I L M S
 *
 *  Optional films that sit quietly behind sections, and the floral bloom that
 *  can cover the moment the door opens.
 *
 *  There is no switch to flip. A slot is on when its files are in
 *  /public/ambient and off when they are not — the site looks in the folder
 *  at build time and works it out. A slot that is off costs the guest
 *  nothing: no request, no broken frame, the section simply looks as it does
 *  now.
 *
 *  The only thing to set here is how strongly each film shows through.
 *
 *  Run `bash scripts/fetch-assets.sh` to bring the films in, or see
 *  ASSETS.md for which file belongs in which slot.
 * ─────────────────────────────────────────────────────────────────────────── */
export const ambient = {
  // Plays over the door as it opens, so the letter blooms into the film
  // rather than simply dissolving.
  bloom: { opacity: 0.85 },

  // Behind their story.
  story: { opacity: 0.2 },

  // Behind the closing words.
  closing: { opacity: 0.18 },
};

/* ───────────────────────────────────────────────────────────────────────────
 * 19.  M O T I O N
 *
 *  Set `webgl` to false for the quieter version — the site keeps its whole
 *  design and simply stops rendering the three-dimensional layer.
 *
 *  Guests who ask their phone to reduce motion always get the calm version
 *  automatically. You do not need to do anything for that.
 * ─────────────────────────────────────────────────────────────────────────── */
export const motion = {
  webgl: true,
  petalCount: 70,
};
