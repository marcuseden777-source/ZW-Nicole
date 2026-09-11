"use client";

import { useEffect, useState } from "react";
import * as content from "@/content/wedding";

type Remaining = { days: number; hours: number; minutes: number; seconds: number } | null;

function remainingUntil(target: number): Remaining {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  return {
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms / 3_600_000) % 24),
    minutes: Math.floor((ms / 60_000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
  };
}

/**
 * The wait, counted down. Rendered only after the browser takes over, because
 * the server and the guest are rarely in the same hour — anything else would
 * flash the wrong number on arrival.
 */
export function Countdown() {
  const target = new Date(content.weddingDate.iso).getTime();
  const [remaining, setRemaining] = useState<Remaining>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (Number.isNaN(target)) return;
    setMounted(true);
    setRemaining(remainingUntil(target));
    const id = setInterval(() => setRemaining(remainingUntil(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!mounted || Number.isNaN(target)) return null;

  const units = remaining
    ? ([
        ["Days", remaining.days],
        ["Hours", remaining.hours],
        ["Minutes", remaining.minutes],
        ["Seconds", remaining.seconds],
      ] as const)
    : null;

  return (
    <section
      aria-label="Time until the ceremony"
      className="relative z-[1] px-[var(--gutter)] pb-[clamp(2rem,6vh,4rem)]"
    >
      <div className="mx-auto max-w-2xl text-center">
        {units ? (
          <>
            <p className="u-eyebrow mb-6">Until we gather</p>
            <div className="flex items-start justify-center gap-[clamp(1rem,5vw,3rem)]">
              {units.map(([label, value]) => (
                <div key={label}>
                  <p
                    className="u-display u-foil text-[clamp(2rem,8vw,3.25rem)] leading-none tabular-nums"
                    // The seconds change every tick; announcing that would be
                    // maddening on a screen reader, so it is read as one label.
                    aria-hidden="true"
                  >
                    {String(value).padStart(2, "0")}
                  </p>
                  <p className="u-eyebrow mt-2 text-[0.58rem]">{label}</p>
                </div>
              ))}
            </div>
            <p className="sr-only">
              {remaining!.days} days, {remaining!.hours} hours and {remaining!.minutes} minutes
              until the ceremony.
            </p>
          </>
        ) : (
          <p className="u-script text-[clamp(1.75rem,6vw,2.5rem)] text-gold-deep">
            Today is the day.
          </p>
        )}
      </div>
    </section>
  );
}
