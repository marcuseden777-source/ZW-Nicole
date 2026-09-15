"use client";

/**
 * Whether the recording is playing, and the one way to start it.
 *
 * A module store rather than React state, for a reason that is specific to
 * sound: iOS only honours play() when it is called SYNCHRONOUSLY inside the
 * gesture that asked for it. Routing the request through setState and an
 * effect puts a render between the tap and the call, and Safari refuses it.
 * So the door calls straight into here, in the same tick as the tap that
 * breaks the seal.
 */

const KEY = "zw-sound";

let element: HTMLAudioElement | null = null;
let wanted = false;
const listeners = new Set<(playing: boolean) => void>();

function announce() {
  for (const listener of listeners) listener(wanted);
}

export function registerSoundtrack(audio: HTMLAudioElement | null) {
  element = audio;
}

export function soundWanted() {
  return wanted;
}

/** Whether the guest turned it off earlier in this visit. */
export function soundDeclined() {
  try {
    return sessionStorage.getItem(KEY) === "off";
  } catch {
    return false;
  }
}

function remember(on: boolean) {
  try {
    sessionStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* Private browsing. The choice simply does not outlive the page. */
  }
}

/**
 * Start it, and bring it up gently.
 *
 * Nobody wants a voice at full volume the instant a page opens, however
 * lovely the voice. It arrives over three seconds, which is about as long as
 * the envelope takes to open.
 *
 * Returns false when the browser refuses — which it will, if this was not
 * called from a real gesture. The control then shows itself as off and a tap
 * on it is a gesture that works.
 */
export async function playSoundtrack(): Promise<boolean> {
  const audio = element;
  if (!audio) return false;
  try {
    audio.volume = 0;
    await audio.play();
    wanted = true;
    remember(true);
    announce();
    fadeTo(audio, 1, 3000);
    return true;
  } catch {
    wanted = false;
    announce();
    return false;
  }
}

export function pauseSoundtrack() {
  const audio = element;
  wanted = false;
  remember(false);
  announce();
  if (!audio) return;
  fadeTo(audio, 0, 600, () => audio.pause());
}

let fade = 0;

function fadeTo(audio: HTMLAudioElement, target: number, ms: number, done?: () => void) {
  cancelAnimationFrame(fade);
  const from = audio.volume;
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    // Equal-power-ish: a linear ramp on a volume control sounds like it does
    // nothing and then rushes, because loudness is not linear in amplitude.
    const eased = t * t * (3 - 2 * t);
    audio.volume = Math.max(0, Math.min(1, from + (target - from) * eased));
    if (t < 1) fade = requestAnimationFrame(step);
    else done?.();
  };
  fade = requestAnimationFrame(step);
}

export function subscribeToSound(listener: (playing: boolean) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
