"use client";

import { useEffect, useRef, useState } from "react";

import {
  pauseSoundtrack,
  playSoundtrack,
  registerSoundtrack,
  soundDeclined,
  soundWanted,
  subscribeToSound,
} from "@/lib/soundtrack";

/**
 * The recording, and the way to stop it.
 *
 * The control is not a nicety. A page that starts making sound and gives you
 * no obvious way to stop it is the rudest thing a website can do, and being a
 * lovely recording does not change that — a guest may be opening this at a
 * desk, on a train, or beside someone asleep. So the button is always there,
 * always the same place, says what it will do, and its answer is remembered
 * for the rest of the visit.
 *
 * It starts from the tap that breaks the seal, which is a real gesture and
 * therefore something every browser will honour. Anyone who comes back on a
 * later page load, or who never meets the door at all, gets it silent with
 * the control showing as off — because at that point there has been no
 * gesture, and starting sound without one is both rude and refused.
 */
export function SoundTrack({
  sources,
  label,
}: {
  sources: { m4a?: string; webm?: string };
  label: string;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [still, setStill] = useState(false);

  // SMIL is not CSS. The blanket `animation-duration: 0.001ms` under
  // prefers-reduced-motion cannot touch an <animate> element, so it has to be
  // asked directly — the same trap the hero's scroll arrow fell into.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setStill(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  useEffect(() => {
    registerSoundtrack(audio.current);
    setReady(true);
    setPlaying(soundWanted());
    return () => registerSoundtrack(null);
  }, []);

  useEffect(() => subscribeToSound(setPlaying), []);

  // Playing to an empty room helps nobody and costs a guest their battery.
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const onVisibility = () => {
      if (document.hidden) el.pause();
      else if (soundWanted() && !soundDeclined()) void el.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (!sources.m4a && !sources.webm) return null;

  return (
    <>
      <audio
        ref={audio}
        loop
        preload="none"
        playsInline
        // Not aria-hidden: a screen-reader user should be able to find the
        // thing that is making the noise.
        aria-label={label}
      >
        {sources.webm && <source src={sources.webm} type="audio/webm" />}
        {sources.m4a && <source src={sources.m4a} type="audio/mp4" />}
      </audio>

      <button
        type="button"
        onClick={() => {
          if (playing) pauseSoundtrack();
          else void playSoundtrack();
        }}
        // Bottom left, because the menu owns the top right and nothing should
        // ever have to be hunted for.
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-[max(1.25rem,env(safe-area-inset-left))] z-[90] flex h-11 w-11 items-center justify-center rounded-full border bg-ivory/80 backdrop-blur-sm transition-colors duration-300 hover:bg-ivory"
        style={{ borderColor: "var(--rule)", opacity: ready ? 1 : 0 }}
        aria-pressed={playing}
        aria-label={playing ? `Turn off ${label}` : `Play ${label}`}
        data-no-print
        data-outside-overlay
      >
        <SoundMark playing={playing} still={still} />
        <span className="sr-only">{playing ? "Sound is on" : "Sound is off"}</span>
      </button>
    </>
  );
}

/**
 * Three bars that move while it plays and lie flat when it does not.
 *
 * Drawn rather than pulled from an icon set, so it carries the same weight of
 * line as the ornaments and the rules everywhere else on the page.
 */
function SoundMark({ playing, still }: { playing: boolean; still: boolean }) {
  const moving = playing && !still;
  // Resting heights, so the mark reads as a level meter at every moment —
  // flat bars collapsed to nothing looked like three dots and a slash.
  const bars = [6, 11, 8, 5];

  return (
    <svg viewBox="0 0 18 16" className="h-[0.95rem] w-[1.05rem]" aria-hidden="true">
      <g
        fill="none"
        stroke="var(--color-gold-deep)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity={playing ? 1 : 0.7}
      >
        {bars.map((h, i) => (
          <line key={i} x1={3 + i * 4} x2={3 + i * 4} y1={8 - h / 2} y2={8 + h / 2}>
            {moving && (
              <animate
                attributeName="y1"
                values={`${8 - h / 2};2.5;${8 - h / 2};5;${8 - h / 2}`}
                dur={`${1.3 + i * 0.27}s`}
                repeatCount="indefinite"
              />
            )}
            {moving && (
              <animate
                attributeName="y2"
                values={`${8 + h / 2};13.5;${8 + h / 2};11;${8 + h / 2}`}
                dur={`${1.3 + i * 0.27}s`}
                repeatCount="indefinite"
              />
            )}
          </line>
        ))}
        {/* A line through it, so "off" is legible without relying on the bars
            being shorter — which reads as "quiet", not as "off", and is no
            help at all to anyone who cannot compare the two states. */}
        {!playing && (
          <line
            x1="2"
            y1="14"
            x2="16"
            y2="2"
            strokeWidth="1.5"
            stroke="var(--color-ink-soft)"
          />
        )}
      </g>
    </svg>
  );
}
