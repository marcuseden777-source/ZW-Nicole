import type { ReactNode } from "react";

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

/** The wax seal, flattened — used as a signature mark through the page. */
export function SealMark({
  monogram,
  className = "",
}: {
  monogram: string;
  className?: string;
}) {
  // The scalloped rim, generated rather than hand-drawn so it stays regular.
  const points = Array.from({ length: 128 }, (_, i) => {
    const a = (i / 128) * Math.PI * 2;
    const r = 46 * (1 + Math.sin(a * 11) * 0.055);
    return `${(50 + Math.cos(a) * r).toFixed(2)},${(50 + Math.sin(a) * r).toFixed(2)}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={`${monogram} monogram`}>
      <defs>
        <radialGradient id="seal-wax" cx="38%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#f3e2c4" />
          <stop offset="55%" stopColor="#e0c99e" />
          <stop offset="100%" stopColor="#c2a15b" />
        </radialGradient>
      </defs>
      <polygon points={points} fill="url(#seal-wax)" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="#9a7838" strokeWidth="0.8" strokeOpacity="0.6" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#8a6b2f"
        fillOpacity="0.85"
        style={{ fontFamily: "var(--font-script), cursive", fontSize: "34px" }}
      >
        {monogram}
      </text>
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
