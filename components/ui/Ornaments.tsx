import type { ReactNode } from "react";

import { envelope as envelopeStyle } from "@/content/wedding";

/* ═══════════════════════════════════════════════════════════════════════
 *  The decorative vocabulary: arches, lanterns, rules and the monogram.
 *  All drawn as inline SVG — they scale to any screen without a single
 *  extra request, and they carry the whole design when the 3D layer is
 *  switched off for reduced motion or an older device.
 * ═══════════════════════════════════════════════════════════════════════ */

/**
 * The pointed arch that frames the ceremony.
 *
 * The crown is drawn at a fixed proportion and reserves its own height; the
 * two rails then simply run from its shoulders to the floor, however tall the
 * content inside turns out to be. One SVG stretched over the whole frame
 * would flatten the crown into a dome as soon as the content grew — which is
 * the one thing an arch must never do.
 */
export function Arch({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const rail =
    "linear-gradient(to bottom, var(--color-gold) 0%, color-mix(in oklab, var(--color-gold) 40%, transparent) 72%, transparent 100%)";

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none absolute inset-0 flex flex-col" aria-hidden="true">
        {/* The crown. Its shoulders land exactly on the bottom of this box. */}
        <svg viewBox="0 0 400 162" className="aspect-[400/162] w-full shrink-0">
          <defs>
            <linearGradient id="arch-foil" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#9a7838" />
              <stop offset="35%" stopColor="#d8bd83" />
              <stop offset="55%" stopColor="#f6e4bb" />
              <stop offset="75%" stopColor="#c2a15b" />
              <stop offset="100%" stopColor="#9a7838" />
            </linearGradient>
          </defs>

          {/* A soft, rounded crown */}
          <path
            d="M8 162 Q8 74 82 40 Q150 12 200 12 Q250 12 318 40 Q392 74 392 162"
            fill="none"
            stroke="url(#arch-foil)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          {/* The inner reveal a carved arch has */}
          <path
            d="M24 162 Q24 90 92 58 Q152 32 200 32 Q248 32 308 58 Q376 90 376 162"
            fill="none"
            stroke="url(#arch-foil)"
            strokeWidth="0.8"
            strokeOpacity="0.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* The rails, picking up where the shoulders left off */}
        <div className="relative flex-1">
          <span className="absolute bottom-0 left-[2%] top-0 w-px" style={{ background: rail }} />
          <span className="absolute bottom-0 right-[2%] top-0 w-px" style={{ background: rail }} />
        </div>
      </div>

      <div className="relative">{children}</div>
    </div>
  );
}

/** A horizontal rule with a small bloom at its centre. */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 24"
      className={`h-6 w-[min(240px,60%)] ${className}`}
      aria-hidden="true"
    >
      <g stroke="#c2a15b" fill="none" strokeLinecap="round">
        <path d="M4 12 H92" strokeWidth="0.8" strokeOpacity="0.45" />
        <path d="M148 12 H236" strokeWidth="0.8" strokeOpacity="0.45" />
        <path d="M100 12 Q108 6 114 12 Q108 18 100 12 Z" strokeWidth="0.9" />
        <path d="M140 12 Q132 6 126 12 Q132 18 140 12 Z" strokeWidth="0.9" />
        <circle cx="120" cy="12" r="3" strokeWidth="0.9" />
        <circle cx="120" cy="12" r="1" fill="#c2a15b" stroke="none" />
      </g>
    </svg>
  );
}

/**
 * The wax seal.
 *
 * Not a flat disc with a letter on it. Wax is poured, so it domes; it is
 * lacquered, so it takes a hard specular; it sits proud of the paper, so it
 * throws a shadow; and the die presses the monogram IN, which means the
 * letters carry a shadow on one side and a highlight on the other.
 *
 * The dome is real shading, not a painted gradient: the shape's own alpha is
 * blurred into a height field and lit with feSpecularLighting, so the
 * highlight follows the scalloped rim instead of ignoring it.
 */
export function SealMark({
  monogram,
  className = "",
}: {
  monogram: string;
  className?: string;
}) {
  // A stable id per monogram, so two seals on one page cannot collide in the
  // SVG id namespace and steal each other's filters.
  const uid = `seal-${monogram.replace(/[^a-z0-9]/gi, "") || "mark"}`;

  // The scalloped rim, generated rather than hand-drawn, with the same three
  // layered frequencies the three-dimensional seal uses so the two match.
  const points = Array.from({ length: 180 }, (_, i) => {
    const a = (i / 180) * Math.PI * 2;
    const lobes = Math.sin(a * 10 + 0.4) * 0.072;
    const spread = Math.sin(a * 3 + 1.7) * 0.038 + Math.sin(a * 5.5 - 0.8) * 0.022;
    const n = Math.sin(i * 12.9898) * 43758.5453;
    const jitter = (n - Math.floor(n) - 0.5) * 0.022;
    const r = 44 * (1 + lobes + spread + jitter);
    return `${(50 + Math.cos(a) * r).toFixed(2)},${(50 + Math.sin(a) * r).toFixed(2)}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={`${monogram} monogram`}>
      <defs>
        {/* The body colour: lit from the upper left, deepening into the rim. */}
        <radialGradient id={`${uid}-wax`} cx="36%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#a8404a" />
          <stop offset="38%" stopColor="#8d2830" />
          <stop offset="72%" stopColor="#6d1a21" />
          <stop offset="100%" stopColor="#4a0f15" />
        </radialGradient>

        {/* Real domed shading, derived from the shape's own silhouette. */}
        <filter id={`${uid}-dome`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3.2" result="height" />
          <feSpecularLighting
            in="height"
            surfaceScale="4.5"
            specularConstant="0.78"
            specularExponent="24"
            lightingColor="#ffe6d2"
            result="spec"
          >
            <fePointLight x="22" y="14" z="62" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="specClipped" />
          <feComposite
            in="SourceGraphic"
            in2="specClipped"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="0"
          />
        </filter>

        {/* The seal sits proud of the paper and says so. */}
        <filter id={`${uid}-cast`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0.8" dy="2.2" stdDeviation="2" floodColor="#4a2a18" floodOpacity="0.42" />
        </filter>
      </defs>

      <g filter={`url(#${uid}-cast)`}>
        <polygon points={points} fill={`url(#${uid}-wax)`} filter={`url(#${uid}-dome)`} />

        {/* The ring the die leaves, pressed in: dark on the light side,
            catching light on the far side. */}
        <circle cx="50" cy="50" r="35" fill="none" stroke="#3d0c11" strokeOpacity="0.55" strokeWidth="1.6" />
        <circle cx="50.5" cy="50.9" r="35" fill="none" stroke="#c9707a" strokeOpacity="0.3" strokeWidth="0.9" />

        {/* The monogram, pressed in. Drawn three times: the shadow it casts
            into its own groove, the light catching the far wall, and the
            letter itself sitting deeper than the surface around it. */}
        <g style={{ fontFamily: "var(--font-script), cursive", fontSize: "36px" }}>
          <text x="50" y="51.4" textAnchor="middle" dominantBaseline="central" fill="#38090e" fillOpacity="0.85">
            {monogram}
          </text>
          <text x="50.7" y="52.2" textAnchor="middle" dominantBaseline="central" fill="#d4828b" fillOpacity="0.34">
            {monogram}
          </text>
          <text x="50" y="51" textAnchor="middle" dominantBaseline="central" fill="#6b1a22" fillOpacity="0.92">
            {monogram}
          </text>
        </g>
      </g>
    </svg>
  );
}

/** A corner spray of blossom, for the top and bottom of framed sections. */
export function CornerSpray({
  className = "",
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={className}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden="true"
    >
      <g stroke="#c2a15b" fill="none" strokeWidth="0.9" strokeLinecap="round" strokeOpacity="0.75">
        <path d="M4 116 Q42 104 66 76 Q92 46 152 10" />
        <path d="M30 110 Q38 92 26 80" />
        <path d="M56 88 Q70 76 64 58" />
        <path d="M92 56 Q108 48 108 30" />
        <path d="M122 32 Q138 28 142 12" />
      </g>
      {[
        [26, 78, 9],
        [64, 56, 11],
        [108, 28, 8],
        [142, 11, 6],
      ].map(([cx, cy, r], i) => (
        <g key={i}>
          {Array.from({ length: 6 }, (_, k) => {
            const a = (k / 6) * Math.PI * 2;
            return (
              <ellipse
                key={k}
                cx={cx + Math.cos(a) * r * 0.52}
                cy={cy + Math.sin(a) * r * 0.52}
                rx={r * 0.46}
                ry={r * 0.3}
                transform={`rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * r * 0.52} ${cy + Math.sin(a) * r * 0.52})`}
                fill="#e4cfa1"
                fillOpacity="0.5"
              />
            );
          })}
          <circle cx={cx} cy={cy} r={r * 0.2} fill="#c2a15b" fillOpacity="0.7" />
        </g>
      ))}
    </svg>
  );
}

/**
 * A rose in bud, drawn small enough to sit on a hairline.
 *
 * Used as the marker that travels down the schedule as the page is read, so
 * it has to hold its shape at around twenty pixels — which is why the petals
 * are a handful of spirals rather than a botanical study.
 */
export function Rose({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 62" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="rose-bloom" cx="42%" cy="34%" r="68%">
          <stop offset="0%" stopColor="#f6e4bb" />
          <stop offset="45%" stopColor="#d8b268" />
          <stop offset="100%" stopColor="#9a7838" />
        </radialGradient>
      </defs>

      {/* Stem and leaves */}
      <g stroke="#9a7838" fill="none" strokeWidth="1.4" strokeLinecap="round">
        <path d="M24 30 V60" />
        <path d="M24 44 Q14 42 11 34 Q21 33 24 41" fill="#c2a15b" fillOpacity="0.32" />
        <path d="M24 50 Q34 48 37 40 Q27 39 24 47" fill="#c2a15b" fillOpacity="0.32" />
      </g>

      {/* The outer petals, then the spiral of the bud */}
      <g>
        <path
          d="M24 4 Q40 8 41 20 Q42 33 24 36 Q6 33 7 20 Q8 8 24 4 Z"
          fill="url(#rose-bloom)"
        />
        <g fill="none" stroke="#8a6b2f" strokeOpacity="0.55" strokeWidth="1.1" strokeLinecap="round">
          <path d="M24 32 Q13 29 13 20 Q13 11 24 9 Q35 11 35 20 Q35 27 26 29" />
          <path d="M26 29 Q19 28 19 21 Q19 15 24 14 Q30 15 30 21 Q30 25 25 25" />
          <path d="M25 25 Q22 24 22 21 Q22 19 24 19" />
        </g>
      </g>
    </svg>
  );
}
