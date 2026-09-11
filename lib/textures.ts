import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════════════
 *  Every surface on the envelope is drawn in code rather than loaded as an
 *  image. The emboss stays crisp on a 6.7" phone and on a 5K display alike,
 *  it costs the guest nothing to download, and the colour of the paper can
 *  be changed by editing a single hex value.
 * ═══════════════════════════════════════════════════════════════════════ */

function makeCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { canvas, ctx };
}

/** A small deterministic generator, so the paper looks identical every visit. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/* ── The botanical relief ─────────────────────────────────────────────────
 *  Drawn first as a height field — white is raised, black is flat — then
 *  converted to a normal map so real light catches the petal edges.        */

function drawSprig(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  angle: number,
  rand: () => number,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // The stem.
  ctx.strokeStyle = "#8a8a8a";
  ctx.lineWidth = length * 0.012;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(length * 0.18, -length * 0.34, length * 0.05, -length);
  ctx.stroke();

  // Leaves alternating up the stem.
  const leaves = 7;
  for (let i = 1; i <= leaves; i++) {
    const t = i / (leaves + 1);
    const ly = -length * t;
    const lx = length * 0.18 * Math.sin(t * Math.PI) * (1 - t * 0.3);
    const side = i % 2 === 0 ? 1 : -1;
    const leafLen = length * 0.2 * (1 - t * 0.45) * (0.85 + rand() * 0.3);

    ctx.fillStyle = `rgba(190,190,190,${0.55 + rand() * 0.25})`;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.quadraticCurveTo(
      lx + side * leafLen * 0.6,
      ly - leafLen * 0.55,
      lx + side * leafLen,
      ly - leafLen * 0.15,
    );
    ctx.quadraticCurveTo(lx + side * leafLen * 0.5, ly + leafLen * 0.2, lx, ly);
    ctx.fill();
  }

  ctx.restore();
}

function drawBloom(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  petals: number,
  rand: () => number,
) {
  ctx.save();
  ctx.translate(x, y);

  // Three rings of petals, each smaller and slightly rotated — the way a
  // real peony is layered, which is what makes the relief read as carved.
  for (let ring = 0; ring < 3; ring++) {
    const r = radius * (1 - ring * 0.26);
    const offset = (ring * Math.PI) / petals;
    const brightness = 150 + ring * 32;

    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2 + offset;
      const wobble = 0.88 + rand() * 0.24;
      ctx.save();
      ctx.rotate(a);
      ctx.fillStyle = `rgba(${brightness},${brightness},${brightness},0.9)`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        r * 0.42 * wobble,
        -r * 0.3,
        r * 0.95 * wobble,
        -r * 0.22,
        r * wobble,
        0,
      );
      ctx.bezierCurveTo(
        r * 0.95 * wobble,
        r * 0.22,
        r * 0.42 * wobble,
        r * 0.3,
        0,
        0,
      );
      ctx.fill();
      ctx.restore();
    }
  }

  // The raised centre.
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.2);
  core.addColorStop(0, "rgba(240,240,240,1)");
  core.addColorStop(1, "rgba(160,160,160,0)");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function heightToNormal(
  source: HTMLCanvasElement,
  strength: number,
): HTMLCanvasElement {
  const size = source.width;
  const sctx = source.getContext("2d")!;
  const height = sctx.getImageData(0, 0, size, size).data;

  const { canvas, ctx } = makeCanvas(size);
  const out = ctx.createImageData(size, size);

  // Sampling wraps, so the relief tiles seamlessly across a large flap.
  const at = (x: number, y: number) => {
    const px = ((x % size) + size) % size;
    const py = ((y % size) + size) % size;
    return height[(py * size + px) * 4] / 255;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      out.data[i] = ((-dx / len) * 0.5 + 0.5) * 255;
      out.data[i + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      out.data[i + 2] = (1 / len) * 0.5 * 255 + 127.5;
      out.data[i + 3] = 255;
    }
  }

  ctx.putImageData(out, 0, 0);
  return canvas;
}

/** The embossed paper relief, as a normal map ready for a material. */
export function createEmbossNormalMap(size = 512): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(size);
  const rand = seeded(20261114);

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);

  // Blur the height field slightly so the relief is rounded, not cut.
  ctx.filter = "blur(1.5px)";

  // A bloom in each quarter, with sprigs fanning out between them.
  const anchors = [
    [size * 0.28, size * 0.3],
    [size * 0.74, size * 0.24],
    [size * 0.22, size * 0.76],
    [size * 0.78, size * 0.72],
  ];

  for (const [ax, ay] of anchors) {
    for (let i = 0; i < 5; i++) {
      drawSprig(
        ctx,
        ax + (rand() - 0.5) * size * 0.12,
        ay + (rand() - 0.5) * size * 0.12,
        size * (0.16 + rand() * 0.1),
        rand() * Math.PI * 2,
        rand,
      );
    }
    drawBloom(ctx, ax, ay, size * (0.075 + rand() * 0.03), 8, rand);
  }

  // Scattered small buds to break up the grid.
  for (let i = 0; i < 14; i++) {
    drawBloom(ctx, rand() * size, rand() * size, size * 0.022, 6, rand);
  }

  ctx.filter = "none";

  const texture = new THREE.CanvasTexture(heightToNormal(canvas, 2.6));
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Fine paper tooth, so the ivory never looks like plastic. */
export function createPaperRoughness(size = 256): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(size);
  const rand = seeded(7734);
  const image = ctx.createImageData(size, size);

  for (let i = 0; i < image.data.length; i += 4) {
    // Tight band around mid-grey: paper is uniformly matte with a little tooth.
    const v = 150 + (rand() - 0.5) * 46;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

/**
 * The face of the wax seal, as a normal map.
 *
 * The monogram is drawn as a height field and converted to surface normals, so
 * the letters are genuinely pressed into the wax and catch the light along
 * their edges the way a real seal press does — rather than being a flat decal
 * laid on top, which never survives being looked at closely.
 */
export function createSealReliefMap(monogram: string, size = 512): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(size);
  const c = size / 2;

  // Mid-grey is the resting surface of the wax; darker is pressed in.
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(c, c);

  // Soften every edge, so the wax looks poured and pressed rather than cut.
  ctx.filter = "blur(2.5px)";

  // The raised lip just inside the scalloped rim.
  ctx.strokeStyle = "#c8c8c8";
  ctx.lineWidth = size * 0.028;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.375, 0, Math.PI * 2);
  ctx.stroke();

  // The recessed ring the monogram sits within.
  ctx.strokeStyle = "#4a4a4a";
  ctx.lineWidth = size * 0.016;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.33, 0, Math.PI * 2);
  ctx.stroke();

  // The initials, pressed in.
  ctx.fillStyle = "#2a2a2a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fitted = Math.min(size * 0.42, (size * 0.66) / Math.max(monogram.length, 1) * 1.7);
  ctx.font = `400 ${fitted}px "Italianno", "Snell Roundhand", cursive`;
  ctx.fillText(monogram, 0, size * 0.02);

  ctx.restore();

  const texture = new THREE.CanvasTexture(heightToNormal(canvas, 3.4));
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** A soft petal silhouette for the drifting particles. */
export function createPetalTexture(size = 128): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(size);
  const r = size / 2;

  ctx.translate(r, r);
  const grad = ctx.createRadialGradient(0, -r * 0.15, 0, 0, 0, r);
  grad.addColorStop(0, "rgba(255,252,246,1)");
  grad.addColorStop(0.55, "rgba(245,231,208,0.92)");
  grad.addColorStop(1, "rgba(232,209,170,0)");
  ctx.fillStyle = grad;

  // A single petal: wide at the base, drawn to a soft point.
  ctx.beginPath();
  ctx.moveTo(0, r * 0.92);
  ctx.bezierCurveTo(-r * 0.95, r * 0.2, -r * 0.6, -r * 0.85, 0, -r * 0.92);
  ctx.bezierCurveTo(r * 0.6, -r * 0.85, r * 0.95, r * 0.2, 0, r * 0.92);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
