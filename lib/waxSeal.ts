"use client";

import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════════════════
 *
 *   W A X
 *
 *   The previous seal was a solid of revolution with a normal map on it, and
 *   it read as a moulded plastic button no matter how the material was tuned.
 *   Three things were wrong, and none of them were fixable by changing a
 *   roughness value:
 *
 *   1.  The outline was a sum of five sine waves. That is a regular shape —
 *       the eye reads the repeat in it instantly, the way it reads a doily.
 *       Wax that has been dripped and pressed is irregular: it ran further on
 *       one side, there is a thin tongue where it escaped under the die, and
 *       no two lobes are the same. Here the outline is a seeded random walk
 *       smoothed until it is continuous — irregular, but with no corners,
 *       because a liquid cannot have one.
 *
 *   2.  The monogram was a normal map. A normal map tilts the light and moves
 *       nothing, so at the silhouette and under a raking light it gives
 *       itself away: the letters have no edges and the rim stays a perfect
 *       curve. Here the whole surface is real displaced geometry — the die is
 *       pressed into actual vertices, the wax squeezes up around it, and the
 *       edge of the seal genuinely undulates against the background.
 *
 *   3.  Wax is TRANSLUCENT, and nothing in the old material said so. Light
 *       goes into sealing wax, bounces around inside and comes back out, so
 *       the thin parts — the rim, the shoulders around the letters — glow
 *       from within and warm up. An opaque red material with a clearcoat on
 *       it is, precisely, a plastic button. That is most of what "too fake"
 *       was. The thickness of the wax is measured while the geometry is
 *       built, handed to the shader per vertex, and used to scatter light
 *       through the thin parts.
 *
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ── Noise ──────────────────────────────────────────────────────────────── */

function hash2(ix: number, iy: number, seed: number): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(seed, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function valueNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
}

/** Several octaves of it, so the surface has both slow swells and fine tooth. */
function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(x * freq, y * freq, seed + o * 131) * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return sum / norm;
}

/* ── The outline ────────────────────────────────────────────────────────── */

/**
 * How far the wax ran, at every angle.
 *
 * Built as a ring of random radii that is then smoothed several times. The
 * smoothing is the whole point: raw randomness gives a spiky star, and a sum
 * of sine waves gives a flower. Repeated averaging of random values gives
 * what molten wax actually does — a few broad lobes at no particular
 * spacing, some shallow and one or two deep, joined by curves.
 *
 * Returns a lookup of `steps` radii. Sampling between them is the caller's
 * job, and is done with a cubic so the surface has no creases.
 */
function waxOutline(steps: number, seed: number): Float32Array {
  const CONTROL = 52;
  let ring = new Float32Array(CONTROL);
  for (let i = 0; i < CONTROL; i++) ring[i] = hash2(i, 0, seed);

  // Circular smoothing. Six passes takes white noise down to something with
  // roughly four or five broad features in it, which is what a dripped seal
  // this size has.
  for (let pass = 0; pass < 6; pass++) {
    const next = new Float32Array(CONTROL);
    for (let i = 0; i < CONTROL; i++) {
      const a = ring[(i - 1 + CONTROL) % CONTROL];
      const b = ring[i];
      const c = ring[(i + 1) % CONTROL];
      next[i] = (a + b * 2 + c) / 4;
    }
    ring = next;
  }

  // Re-spread to the full range: smoothing collapses everything toward the
  // mean, and an outline that varies by two percent is a circle.
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of ring) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  const span = hi - lo || 1;
  for (let i = 0; i < CONTROL; i++) ring[i] = (ring[i] - lo) / span;

  const out = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * CONTROL;
    const i0 = Math.floor(t);
    const f = t - i0;
    // Catmull-Rom through the control ring: continuous in value AND slope,
    // so there is no faint crease every seven degrees.
    const p0 = ring[(i0 - 1 + CONTROL) % CONTROL];
    const p1 = ring[i0 % CONTROL];
    const p2 = ring[(i0 + 1) % CONTROL];
    const p3 = ring[(i0 + 2) % CONTROL];
    const v =
      0.5 *
      (2 * p1 +
        (-p0 + p2) * f +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f +
        (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);

    const angle = (i / steps) * Math.PI * 2;
    // One deliberate run: real wax nearly always has a side where more of it
    // went, because the stick was held at an angle. Broad and shallow, added
    // rather than multiplied so it never pinches the outline.
    const lean = Math.cos(angle - 2.1);
    const run = Math.max(0, lean) ** 2 * 0.09;

    out[i] = 0.885 + v * 0.115 + run;
  }
  return out;
}

/** The outline is a table around the whole circle; read it at any angle. */
function outlineAt(table: Float32Array, angle: number): number {
  const n = table.length;
  const t = (((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * n;
  const i0 = Math.floor(t) % n;
  const i1 = (i0 + 1) % n;
  const f = t - Math.floor(t);
  return table[i0] * (1 - f) + table[i1] * f;
}

/* ── The die ────────────────────────────────────────────────────────────── */

/**
 * What the brass stamp pressed into the wax, as a height field.
 *
 * 0.5 is the untouched surface, below that is pressed in, above is wax that
 * was pushed up. Drawn on a canvas because text is the one shape that is far
 * easier to rasterise than to describe, then read back once as numbers.
 */
function dieField(monogram: string, size: number): Float32Array {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return new Float32Array(size * size).fill(0.5);

  const c = size / 2;

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.translate(c, c);
  // The die was not set down perfectly square. Nothing ever is.
  ctx.rotate(-0.035);
  ctx.translate(size * 0.006, -size * 0.004);

  // Every edge softened: brass has a radius on it and wax flows, so there is
  // no sharp corner anywhere on a real seal.
  ctx.filter = `blur(${(size / 512) * 2.2}px)`;

  // The ring the die's outer wall pressed in.
  ctx.strokeStyle = "#3c3c3c";
  ctx.lineWidth = size * 0.018;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.335, 0, Math.PI * 2);
  ctx.stroke();

  // …and the bead of wax squeezed up just outside it.
  ctx.strokeStyle = "#b4b4b4";
  ctx.lineWidth = size * 0.026;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.372, 0, Math.PI * 2);
  ctx.stroke();

  // The initials.
  ctx.fillStyle = "#242424";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const fitted = Math.min(size * 0.4, ((size * 0.62) / Math.max(monogram.length, 1)) * 1.7);
  ctx.font = `400 ${fitted}px "Italianno", "Snell Roundhand", cursive`;
  ctx.fillText(monogram, 0, size * 0.02);
  ctx.restore();

  const data = ctx.getImageData(0, 0, size, size).data;
  const field = new Float32Array(size * size);
  for (let i = 0; i < field.length; i++) field[i] = data[i * 4] / 255;
  return field;
}

/* ── The seal ───────────────────────────────────────────────────────────── */

export type WaxOptions = {
  monogram: string;
  /** Fewer rings and sectors for a modest phone. Everything else is identical. */
  detail?: "full" | "lean";
  /** World size of the finished seal. Heights scale with it, so it stays wax. */
  radius?: number;
  /**
   * Only part of the circle — for the seal on the envelope, which has to
   * break in two when the door opens. Both halves read the SAME outline
   * table, so the edge runs continuously across the join and the two pieces
   * fit back together exactly.
   */
  arc?: [number, number];
};

export type WaxSeal = {
  geometry: THREE.BufferGeometry;
  /** Widest point, so the camera can be framed against the real object. */
  radius: number;
};

export function buildWaxGeometry({
  monogram,
  detail = "full",
  radius: scale = 1,
  arc,
}: WaxOptions): WaxSeal {
  const [a0, a1] = arc ?? [0, Math.PI * 2];
  const sweep = a1 - a0;
  const whole = Math.abs(sweep - Math.PI * 2) < 1e-6;

  const around = detail === "full" ? 288 : 168;
  const SECTORS = Math.max(12, Math.round((around * Math.abs(sweep)) / (Math.PI * 2)));
  const RINGS = detail === "full" ? 104 : 64;
  const DIE = detail === "full" ? 512 : 320;

  const outline = waxOutline(720, 0x5ea1);
  const die = dieField(monogram, DIE);

  const sampleDie = (x: number, y: number): number => {
    // x and y are in seal space, roughly -1.1…1.1. The die covers the middle.
    const u = (x / 2.2 + 0.5) * DIE;
    const v = (0.5 - y / 2.2) * DIE;
    const ix = Math.min(DIE - 1, Math.max(0, Math.round(u)));
    const iy = Math.min(DIE - 1, Math.max(0, Math.round(v)));
    return die[iy * DIE + ix];
  };

  const width = SECTORS + 1; // seam duplicated, so the UVs do not wrap round
  const count = (RINGS + 1) * width;

  const positions = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const colors = new Float32Array(count * 3);
  const thin = new Float32Array(count);

  // A few bubbles that surfaced and burst. Sparse and shallow — one is
  // charming, a dozen looks like a golf ball.
  const bubbles = [
    { x: 0.31, y: 0.44, r: 0.075, d: 0.055 },
    { x: -0.52, y: -0.18, r: 0.055, d: 0.04 },
    { x: 0.08, y: -0.61, r: 0.042, d: 0.03 },
    { x: -0.24, y: 0.63, r: 0.036, d: 0.026 },
  ];

  let maxRadius = 0;
  let p = 0;
  let q = 0;

  for (let ring = 0; ring <= RINGS; ring++) {
    // Packed toward the rim: that is where the curvature is, and where a
    // sparse ring shows up as a faceted edge against the background.
    const t = Math.pow(ring / RINGS, 0.78);

    for (let s = 0; s <= SECTORS; s++) {
      const angle = a0 + (s / SECTORS) * sweep;
      const edge = outlineAt(outline, angle);
      const r = t * edge;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (r > maxRadius) maxRadius = r;

      // The body: a plateau across the middle that turns over into a fillet
      // at the rim, rather than a dome. Wax pressed under a flat die is flat
      // in the middle; it is only the escaping wax at the edge that curves.
      const body = Math.pow(Math.max(0, 1 - Math.pow(t, 5.4)), 0.34);

      // The die only reached the middle. Outside that, the wax spread free
      // and nothing was pressed into it.
      const reach = 1 - smoothstep(0.62, 0.9, t);
      const pressed = (sampleDie(x, y) - 0.5) * reach;

      // Slow undulation from cooling, plus the fine tooth wax always has.
      const swell = (fbm(x * 1.7 + 11, y * 1.7 - 4, 0x2b1, 3) - 0.5) * 0.052;
      const tooth = (fbm(x * 21, y * 21, 0x77c, 2) - 0.5) * 0.009;

      let dimple = 0;
      for (const b of bubbles) {
        const d = Math.hypot(x - b.x, y - b.y) / b.r;
        if (d < 1) dimple -= Math.cos((d * Math.PI) / 2) * b.d;
      }

      // 0.012 rather than 0 at the rim: wax that has run out to nothing would
      // z-fight with its own underside, and there is always a lip.
      const h = 0.012 + body * 0.235 + pressed * 0.185 + swell * body + tooth + dimple * reach;

      positions[p] = x * scale;
      positions[p + 1] = y * scale;
      positions[p + 2] = h * scale;
      p += 3;

      uvs[q] = x / 2.2 + 0.5;
      uvs[q + 1] = y / 2.2 + 0.5;
      q += 2;

      // How much wax the light has to get through here, normalised. The rim
      // and the pressed letters are thin; the plateau is thick.
      const thickness = Math.min(1, Math.max(0, h / 0.26));
      thin[ring * width + s] = thickness;

      // Thin wax is lighter and warmer, because more light comes back out of
      // it. This is in the material, not the lighting, so it stays true from
      // every angle — and it is the difference between a red object and a
      // piece of wax.
      const lift = Math.pow(1 - thickness, 2.1);
      const i3 = (ring * width + s) * 3;
      colors[i3] = 1 + lift * 0.5;
      colors[i3 + 1] = 1 + lift * 0.2;
      colors[i3 + 2] = 1 + lift * 0.06;
    }
  }

  const indices: number[] = [];
  for (let ring = 0; ring < RINGS; ring++) {
    for (let s = 0; s < SECTORS; s++) {
      const a = ring * width + s;
      const b = a + 1;
      const c = (ring + 1) * width + s;
      const d = c + 1;
      if (ring === 0) {
        // Every vertex of the innermost ring is the same point, so the
        // "quad" here is a triangle. Emitting both halves of it anyway gives
        // one zero-area triangle per sector, whose normal is a division by
        // zero — and computeVertexNormals averages that straight into the
        // centre of the seal, which is why there was a bright speck in the
        // middle of the wax.
        indices.push(a, c, d);
      } else {
        indices.push(a, c, b, b, c, d);
      }
    }
  }

  // Everything below the top surface is added as its own vertices rather
  // than reusing the grid, because a hard edge needs its own normals: shared
  // vertices would average the top of the wax into the side of it and round
  // off the one edge that should be sharp.
  const extraPos: number[] = [];
  const extraThin: number[] = [];

  const push = (x: number, y: number, z: number, thinness: number) => {
    extraPos.push(x, y, z);
    extraThin.push(thinness);
    return count + extraThin.length - 1;
  };

  // The underside. Never really seen, but the seal turns far enough that an
  // open shell would show a hollow at the rim.
  const rim: number[] = [];
  for (let s = 0; s <= SECTORS; s++) {
    const angle = a0 + (s / SECTORS) * sweep;
    const edge = outlineAt(outline, angle);
    rim.push(push(Math.cos(angle) * edge * scale, Math.sin(angle) * edge * scale, 0, 1));
  }
  const centre = push(0, 0, 0, 1);
  for (let s = 0; s < SECTORS; s++) {
    indices.push(rim[s], centre, rim[s + 1]);
  }

  // Where the wax was snapped in two. Without these faces a half seal is an
  // open shell, and the door shows straight through it as it breaks.
  if (!whole) {
    for (const [sector, outward] of [
      [0, -1],
      [SECTORS, 1],
    ] as const) {
      const angle = a0 + (sector / SECTORS) * sweep;
      const edge = outlineAt(outline, angle);
      const bottom: number[] = [];
      for (let ring = 0; ring <= RINGS; ring++) {
        const t = Math.pow(ring / RINGS, 0.78);
        const r = t * edge;
        // Broken wax is not sanded flat: the break wanders a little in and
        // out along its length. Identical on both halves — it is one break —
        // so the two pieces still meet exactly while the seal is whole.
        const wander = (fbm(t * 9, 3.3, 0x4b7, 2) - 0.5) * 0.05;
        const nx = -Math.sin(angle) * wander;
        const ny = Math.cos(angle) * wander;
        bottom.push(
          push((Math.cos(angle) * r + nx) * scale, (Math.sin(angle) * r + ny) * scale, 0, 0.25),
        );
      }
      for (let ring = 0; ring < RINGS; ring++) {
        const t0 = ring * width + sector;
        const t1 = (ring + 1) * width + sector;
        const b0 = bottom[ring];
        const b1 = bottom[ring + 1];
        if (outward > 0) indices.push(t0, t1, b0, t1, b1, b0);
        else indices.push(t0, b0, t1, t1, b0, b1);
      }
    }
  }

  const extraCount = extraThin.length;
  const allPositions = new Float32Array(positions.length + extraPos.length);
  allPositions.set(positions, 0);
  allPositions.set(extraPos, positions.length);

  // The sides take the middle of the texture and a neutral tint: they are in
  // shadow nearly all the time, and the albedo is a top-down map.
  const allUvs = new Float32Array(uvs.length + extraCount * 2).fill(0.5);
  allUvs.set(uvs, 0);
  const allColors = new Float32Array(colors.length + extraCount * 3).fill(1);
  allColors.set(colors, 0);
  const allThin = new Float32Array(thin.length + extraCount);
  allThin.set(thin, 0);
  allThin.set(extraThin, thin.length);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(allPositions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(allUvs, 2));
  geometry.setAttribute("color", new THREE.BufferAttribute(allColors, 3));
  geometry.setAttribute("aWaxThin", new THREE.BufferAttribute(allThin, 1));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return { geometry, radius: maxRadius * scale };
}

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/* ── Light going into the wax and coming back out ───────────────────────── */

/**
 * Subsurface scattering, patched into the standard physical material.
 *
 * three has no translucency on MeshPhysicalMaterial short of `transmission`,
 * which renders the whole scene to a buffer to refract it — far too much
 * machinery for a small opaque-looking object, and it needs a backdrop, which
 * a transparent canvas does not have.
 *
 * What wax actually needs is much simpler: light arriving from BEHIND the
 * surface should leak through where the wax is thin. That is one extra term
 * per light, and it is what makes the rim of a real seal glow when it is held
 * up. `aWaxThin` carries the thickness measured while the geometry was built,
 * so the glow appears at the rim and around the pressed letters and nowhere
 * else.
 *
 * Every edit here is a string replacement against a three.js shader chunk. If
 * a future version renames the chunk the replacement simply does not happen
 * and the seal renders without the scattering — dimmer, but never broken.
 */
export function applyWaxScattering(
  material: THREE.MeshPhysicalMaterial,
  options: { color: THREE.ColorRepresentation; strength?: number } = { color: "#e8663f" },
) {
  const scatterColor = new THREE.Color(options.color);
  const strength = options.strength ?? 1;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.waxScatterColor = { value: scatterColor };
    shader.uniforms.waxScatterStrength = { value: strength };

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         attribute float aWaxThin;
         varying float vWaxThin;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         vWaxThin = aWaxThin;`,
      );

    shader.fragmentShader = shader.fragmentShader.replace(
      "void main() {",
      `varying float vWaxThin;
       uniform vec3 waxScatterColor;
       uniform float waxScatterStrength;

       void RE_Wax_Scatter(
         const in IncidentLight directLight,
         const in vec3 normal,
         const in vec3 viewDir,
         inout ReflectedLight reflectedLight
       ) {
         // Bend the light direction into the surface: the deeper it goes the
         // more the exit point spreads away from where it entered.
         vec3 scatterDir = normalize(directLight.direction + normal * 0.28);
         // Looking toward a light that is behind the wax is when it glows.
         float towards = pow(saturate(dot(viewDir, -scatterDir)), 3.2);
         // Thin wax passes light; thick wax does not. This is the whole point.
         float pass = pow(1.0 - saturate(vWaxThin), 2.4);
         reflectedLight.directDiffuse +=
           (towards * 1.7 + 0.16) * pass * waxScatterStrength
           * waxScatterColor * directLight.color;
       }

       void main() {`,
    );

    const begin = THREE.ShaderChunk.lights_fragment_begin;
    const call =
      "RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );";
    if (begin.includes(call)) {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <lights_fragment_begin>",
        begin.split(call).join(
          `${call}
           RE_Wax_Scatter( directLight, geometryNormal, geometryViewDir, reflectedLight );`,
        ),
      );
    }
  };

  // Without this, three reuses a cached program from an unpatched material
  // with the same defines and the scattering silently never appears.
  material.customProgramCacheKey = () => "wax-scatter-1";
}
