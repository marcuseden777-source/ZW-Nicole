"use client";

/**
 * One loop, for every scroll-linked thing on the page.
 *
 * The naive way to animate on scroll is a hook per element: each one keeps
 * its own listener, calls getBoundingClientRect, and sets React state. Thirty
 * of those means thirty layout reads and thirty re-renders per frame, and the
 * page starts to feel like it is thinking rather than moving.
 *
 * This is the other way round. Every participating element is measured ONCE
 * — where it sits in the document, how tall it is — and cached. After that a
 * frame costs one read of window.scrollY and one custom-property write per
 * visible element. Nothing re-renders. Nothing reads layout. The whole page
 * can be choreographed and the main thread barely notices.
 *
 *   <div data-m="rise">                      arrives as it is read
 *   <figure data-m="reveal">                 unmasks, photograph settling from 1.12
 *   <div data-m="drift" data-depth="0.3">    parallax, positive = slower than the page
 *
 * Each element is given two numbers every frame:
 *
 *   --p   0 → 1 as it crosses the viewport, bottom edge to top edge.
 *         Symmetrical: 0.5 means dead centre. This is the one for parallax.
 *   --e   0 → 1 as it ENTERS, settling at 1 once it is properly on screen
 *         and never going back down. This is the one for reveals.
 *
 * CSS does the rest, which means the effect of any element can be changed
 * without touching a line of JavaScript.
 */

const VARS = new WeakMap<HTMLElement, { p: number; e: number }>();

type Tracked = {
  el: HTMLElement;
  /** Document-space top and height, cached until something invalidates them. */
  top: number;
  height: number;
  /** Sticky and fixed subtrees move under the scroll; those must be measured live. */
  live: boolean;
  /** Reveals latch: once arrived, they stay arrived even if scrolled back past. */
  latch: boolean;
  e: number;
};

let items: Tracked[] = [];
let frame = 0;
let viewport = 0;
let running = false;
let measureQueued = false;

/** Round hard: a custom property that changes by 0.0001 still costs a style recalc. */
const q = (n: number) => Math.round(n * 500) / 500;

function measure() {
  measureQueued = false;
  const scrollY = window.scrollY;
  viewport = window.innerHeight;
  for (const item of items) {
    const rect = item.el.getBoundingClientRect();
    item.top = rect.top + scrollY;
    item.height = rect.height;
  }
}

function collect() {
  const found = document.querySelectorAll<HTMLElement>("[data-m]");
  const seen = new Set<HTMLElement>();
  const next: Tracked[] = [];

  for (const el of found) {
    seen.add(el);
    const existing = items.find((i) => i.el === el);
    if (existing) {
      next.push(existing);
      continue;
    }
    next.push({
      el,
      top: 0,
      height: 0,
      live: el.hasAttribute("data-m-live"),
      latch: !el.hasAttribute("data-m-loop"),
      e: 0,
    });
  }

  items = next;
  measure();
}

function pass() {
  const scrollY = window.scrollY;

  for (const item of items) {
    let top = item.top;
    let height = item.height;

    if (item.live) {
      const rect = item.el.getBoundingClientRect();
      top = rect.top + scrollY;
      height = rect.height;
    }

    // Cheap rejection first: anything a full viewport away from the screen
    // gets no work at all. On a long page that is most of the document.
    const distance = top - scrollY;
    if (distance > viewport * 1.35 || distance + height < -viewport * 0.35) continue;

    // p: 0 when the element's top is at the bottom of the screen, 1 when its
    // bottom has passed the top of the screen. The span is viewport + height,
    // so a tall section and a single line both travel the same 0 → 1.
    const span = viewport + height;
    const p = span > 0 ? (scrollY + viewport - top) / span : 0;

    // e: how far in it is, measured from the point its top crosses 88% of the
    // screen. Anything below that is still arriving; anything above has
    // arrived. Eased so it lands softly rather than tracking the wheel.
    const raw = (viewport * 0.88 - (top - scrollY)) / Math.max(1, viewport * 0.42);
    const clamped = raw < 0 ? 0 : raw > 1 ? 1 : raw;
    const eased = 1 - Math.pow(1 - clamped, 3);
    const e = item.latch ? Math.max(item.e, eased) : eased;
    item.e = e;

    const pq = q(p < 0 ? 0 : p > 1 ? 1 : p);
    const eq = q(e);

    // A custom-property write is cheap but not free, and an unchanged one
    // still invalidates style for the subtree. Only write what moved.
    const last = VARS.get(item.el);
    if (!last || last.p !== pq) item.el.style.setProperty("--p", String(pq));
    if (!last || last.e !== eq) item.el.style.setProperty("--e", String(eq));
    VARS.set(item.el, { p: pq, e: eq });
  }
}

function tick() {
  pass();
  frame = requestAnimationFrame(tick);
}

/** Everything held still and complete, for a guest who asked for less motion. */
function settle() {
  for (const item of items) {
    item.el.style.setProperty("--p", "0.5");
    item.el.style.setProperty("--e", "1");
  }
}

export function startMotion(): () => void {
  if (running) return () => {};
  running = true;

  collect();

  // Order matters. The class is what hides anything not yet arrived, so if it
  // were added before the elements had values there would be a frame — a
  // visible one on a slow phone — of a page with holes in it. Measure, write
  // every value, and only then admit that the engine is running.
  document.documentElement.classList.add("motion-on");

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const onResize = () => {
    if (measureQueued) return;
    measureQueued = true;
    requestAnimationFrame(measure);
  };

  // Sections that render nothing until they have measured the browser, images
  // that change a row's height when they finally decode, the gate unmounting
  // and letting the page lay out for real — every one of those moves
  // everything below it, and a cached offset that is wrong is worse than no
  // caching at all.
  const observer =
    "ResizeObserver" in window
      ? new ResizeObserver(onResize)
      : null;
  observer?.observe(document.documentElement);

  const watcher =
    "MutationObserver" in window
      ? new MutationObserver((records) => {
          for (const record of records) {
            for (const node of record.addedNodes) {
              if (!(node instanceof HTMLElement)) continue;
              if (node.matches("[data-m]") || node.querySelector?.("[data-m]")) {
                collect();
                return;
              }
            }
          }
        })
      : null;
  // childList only — this loop writes inline styles every frame, and watching
  // attributes here would wake the observer on every one of them.
  watcher?.observe(document.body, { childList: true, subtree: true });

  const apply = () => {
    cancelAnimationFrame(frame);
    if (reduced.matches) {
      settle();
    } else {
      pass();
      frame = requestAnimationFrame(tick);
    }
  };

  apply();
  reduced.addEventListener("change", apply);
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });
  // Web fonts land after first paint and reflow every line of type under them.
  document.fonts?.ready.then(onResize).catch(() => {});

  return () => {
    running = false;
    cancelAnimationFrame(frame);
    reduced.removeEventListener("change", apply);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", onResize);
    observer?.disconnect();
    watcher?.disconnect();
    document.documentElement.classList.remove("motion-on");
    items = [];
  };
}

/* ───────────────────────────────────────────────────────────────────────────
 *  S P L I T   T Y P E
 *
 *  A heading that fades in as one block is a heading fading in. A heading
 *  whose lines rise one after another from behind their own baselines reads
 *  as something being SET — which is the difference between a web page and a
 *  piece of print, and it is most of what this site is trying to be.
 *
 *  Done in the DOM rather than with a library: every word becomes a span,
 *  spans are grouped by the line they landed on, and each line gets a masked
 *  wrapper. Re-run on resize, because where the lines break is a property of
 *  the width, and re-run after the fonts load, because the lines break
 *  differently in Cormorant than they did in Georgia.
 * ─────────────────────────────────────────────────────────────────────────── */

const ORIGINAL = new WeakMap<HTMLElement, string>();

function splitOne(el: HTMLElement) {
  const text = ORIGINAL.get(el) ?? el.textContent ?? "";
  if (!text.trim()) return;
  ORIGINAL.set(el, text);

  // Screen readers should hear the sentence, not seventeen fragments of it.
  // The label carries the real text; the pieces below it are decoration.
  el.setAttribute("aria-label", text.trim());

  const words = text.split(/(\s+)/);
  el.textContent = "";

  const holder = document.createElement("span");
  holder.setAttribute("aria-hidden", "true");
  holder.style.display = "block";

  const spans: HTMLElement[] = [];
  for (const word of words) {
    if (!word) continue;
    if (/^\s+$/.test(word)) {
      holder.appendChild(document.createTextNode(" "));
      continue;
    }
    const span = document.createElement("span");
    span.className = "u-w";
    span.textContent = word;
    holder.appendChild(span);
    spans.push(span);
  }
  el.appendChild(holder);

  // Group by where each word actually landed. One layout read for the whole
  // heading, taken before anything is written back.
  const tops = spans.map((s) => s.offsetTop);
  const lines: HTMLElement[][] = [];
  let current: HTMLElement[] = [];
  let lastTop = tops.length ? tops[0] : 0;

  spans.forEach((span, i) => {
    if (Math.abs(tops[i] - lastTop) > 2) {
      lines.push(current);
      current = [];
      lastTop = tops[i];
    }
    current.push(span);
  });
  if (current.length) lines.push(current);

  const rebuilt = document.createElement("span");
  rebuilt.setAttribute("aria-hidden", "true");
  rebuilt.style.display = "block";

  lines.forEach((line, i) => {
    const mask = document.createElement("span");
    mask.className = "u-line";
    mask.style.setProperty("--li", String(i));
    const inner = document.createElement("span");
    inner.className = "u-line-i";
    line.forEach((word, w) => {
      if (w > 0) inner.appendChild(document.createTextNode(" "));
      inner.appendChild(word);
    });
    mask.appendChild(inner);
    rebuilt.appendChild(mask);
  });

  el.textContent = "";
  el.appendChild(rebuilt);
  el.setAttribute("data-split", "done");
}

export function startSplit(): () => void {
  const run = () => {
    document
      .querySelectorAll<HTMLElement>("[data-lines]")
      .forEach((el) => splitOne(el));
  };

  run();

  let queued = 0;
  const onResize = () => {
    cancelAnimationFrame(queued);
    queued = requestAnimationFrame(run);
  };

  window.addEventListener("resize", onResize, { passive: true });
  document.fonts?.ready.then(run).catch(() => {});

  return () => {
    cancelAnimationFrame(queued);
    window.removeEventListener("resize", onResize);
  };
}

/* ───────────────────────────────────────────────────────────────────────────
 *  T H E   C A N D L E
 *
 *  A very faint warm light that follows the pointer across the page. Not a
 *  cursor effect — there is no ring, nothing tracks exactly, and it is far
 *  too soft to be noticed directly. It exists because a flat page lit evenly
 *  from nowhere is the one thing a photograph never is, and a light source
 *  that moves is the cheapest way to say the paper is in a room.
 *
 *  Pointer only. A phone gets nothing, which is right: there is no pointer to
 *  follow, and a light that jumped to wherever a thumb last touched would be
 *  a distraction rather than an atmosphere.
 * ─────────────────────────────────────────────────────────────────────────── */
export function startCandle(): () => void {
  if (!window.matchMedia("(pointer: fine)").matches) return () => {};
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  const root = document.documentElement;
  let tx = 0.5;
  let ty = 0.35;
  let x = 0.5;
  let y = 0.35;
  let frame = 0;
  let idle = true;

  const onMove = (event: PointerEvent) => {
    tx = event.clientX / window.innerWidth;
    ty = event.clientY / window.innerHeight;
    if (idle) {
      idle = false;
      root.classList.add("candle-on");
      frame = requestAnimationFrame(loop);
    }
  };

  const loop = () => {
    // Lagging well behind the pointer, so it reads as a lamp being carried
    // rather than a spotlight bolted to the cursor.
    x += (tx - x) * 0.045;
    y += (ty - y) * 0.045;
    root.style.setProperty("--cx", `${(x * 100).toFixed(2)}%`);
    root.style.setProperty("--cy", `${(y * 100).toFixed(2)}%`);
    frame = requestAnimationFrame(loop);
  };

  window.addEventListener("pointermove", onMove, { passive: true });

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("pointermove", onMove);
    root.classList.remove("candle-on");
  };
}
