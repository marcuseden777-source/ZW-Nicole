"use client";

import { useGLTF } from "@react-three/drei";
import { useThree, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

import { applyWaxScattering } from "@/lib/waxSeal";

/* ═══════════════════════════════════════════════════════════════════════════
 *
 *   B L O S S O M
 *
 *   Two branches, one down each edge of the page, that grow as it is read.
 *
 *   They replace two wax seals: one that sat at the foot of the page and one
 *   that drifted down the right-hand side and spent the middle of the
 *   document on top of the photographs. Both read as moulded plastic buttons
 *   no matter how they were built, and a seal said three times is a seal said
 *   twice too often.
 *
 *   Real geometry, not a sprite and not an SVG: a tapered stem along a spline,
 *   twigs off it, and five-petal flowers whose petals are cupped surfaces.
 *   Petals are translucent — light goes into one and comes back out the far
 *   side, which is why a blossom against the light glows at its edges — so
 *   they borrow the scattering written for the wax, which is the same physics
 *   with a different colour.
 *
 *   The growth is done in the vertex shader from one uniform. Every flower
 *   carries the moment it should open and every ring of the stem the moment
 *   it should thicken, so the whole branch unfurling down the page costs one
 *   number per frame and one draw call, not an object per flower.
 *
 * ═══════════════════════════════════════════════════════════════════════════ */

type Piece = {
  positions: number[];
  normals: number[];
  grow: number[];
  centre: number[];
  thin: number[];
  /** Wood is brown and petals are not. One mesh, two colours. */
  color: number[];
  index: number[];
};

const empty = (): Piece => ({ positions: [], normals: [], grow: [], centre: [], thin: [], color: [], index: [] });

function pushVertex(
  p: Piece,
  v: THREE.Vector3,
  n: THREE.Vector3,
  grow: number,
  c: THREE.Vector3,
  thin: number,
  col: readonly [number, number, number],
) {
  p.positions.push(v.x, v.y, v.z);
  p.normals.push(n.x, n.y, n.z);
  p.grow.push(grow);
  p.centre.push(c.x, c.y, c.z);
  p.thin.push(thin);
  p.color.push(col[0], col[1], col[2]);
  return p.grow.length - 1;
}

/** Multiplied over the material's base colour, so these are near-white. */
const PETAL = [1, 0.975, 0.972] as const;
const THROAT = [1, 0.88, 0.72] as const;
const WOOD = [0.42, 0.33, 0.27] as const;

/** A deterministic wobble, so every visit draws the same branch. */
function rnd(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/* ── One petal ──────────────────────────────────────────────────────────── */

/**
 * A cupped surface rather than a flat card.
 *
 * Narrow where it joins the flower, widest around two-thirds along, round at
 * the tip, and curled along both axes — a petal that is flat catches light in
 * one flat sheet and gives the whole flower away as paper.
 */
function addPetal(
  p: Piece,
  matrix: THREE.Matrix4,
  grow: number,
  centre: THREE.Vector3,
  length: number,
  width: number,
  curl: number,
  col: readonly [number, number, number] = PETAL,
) {
  const U = 10;
  const V = 8;
  const base = p.grow.length;
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (let i = 0; i <= U; i++) {
    const u = i / U;
    // Widest at about 0.62 along, tapering to a rounded tip.
    // Narrow where it joins the flower, plump through the middle, and
      // ROUND at the tip. A plain sine is zero at both ends, which makes a
      // pointed lens — five of those around a centre is a star, and a star is
      // what the last three attempts kept looking like. The outer root fattens
      // the curve so the petal still has 40% of its width a tenth from the top.
      const w = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.62)), 0.55) * width;
    for (let j = 0; j <= V; j++) {
      const t = (j / V) * 2 - 1;
      v.set(t * w, u * length, 0);
      // Cupped across, and tipped back along its length.
      v.z = -(t * t) * curl * w * 1.1 - Math.pow(u, 2.3) * curl * length * 0.34;
      v.applyMatrix4(matrix);
      // Left at zero: computeVertexNormals() derives them from the finished
      // surface at the end, which is the only way a cupped petal gets the
      // gradient across it that makes it read as curved rather than folded.
      n.set(0, 0, 0);
      // Thin at the rim, thicker toward the throat: that is where the light
      // gets through and it is the whole reason a blossom glows.
      pushVertex(p, v, n, grow, centre, 1 - Math.min(1, Math.abs(t) * 0.85 + (1 - u) * 0.3), col);
    }
  }

  for (let i = 0; i < U; i++) {
    for (let j = 0; j < V; j++) {
      const a = base + i * (V + 1) + j;
      const b = a + 1;
      const c = base + (i + 1) * (V + 1) + j;
      const d = c + 1;
      // One winding only. These used to be emitted twice, wound both ways,
      // on a DoubleSide material — so every petal was drawn over itself with
      // the second copy lit by a normal pointing into the surface, which is
      // where the dark maroon patches came from. DoubleSide alone does it:
      // three flips the normal for back faces by itself.
      p.index.push(a, c, b, b, c, d);
    }
  }
}

/* ── One flower ─────────────────────────────────────────────────────────── */

function addFlower(
  p: Piece,
  at: THREE.Vector3,
  facing: THREE.Quaternion,
  scale: number,
  grow: number,
  random: () => number,
) {
  const petals = 5;
  for (let i = 0; i < petals; i++) {
    const spin = (i / petals) * Math.PI * 2 + random() * 0.25;
    const open = 0.62 + random() * 0.3; // how far back each petal is folded
    const m = new THREE.Matrix4()
      .makeRotationZ(spin)
      .multiply(new THREE.Matrix4().makeRotationX(open))
      .premultiply(new THREE.Matrix4().makeRotationFromQuaternion(facing))
      .setPosition(at);
    addPetal(p, m, grow, at, scale * (0.9 + random() * 0.2), scale * 0.56, 0.26);
  }

  // The throat: a few stamens as a tiny tuft, which is what the eye reads as
  // "flower" from any distance at which the petals are just shapes.
  const tuft = 6;
  for (let i = 0; i < tuft; i++) {
    const spin = (i / tuft) * Math.PI * 2;
    const m = new THREE.Matrix4()
      .makeRotationZ(spin)
      .multiply(new THREE.Matrix4().makeRotationX(0.3 + random() * 0.2))
      .premultiply(new THREE.Matrix4().makeRotationFromQuaternion(facing))
      .setPosition(at);
    addPetal(p, m, grow, at, scale * 0.34, scale * 0.05, 0.1, THROAT);
  }
}

/* ── The stem ───────────────────────────────────────────────────────────── */

function addStem(
  p: Piece,
  curve: THREE.CatmullRomCurve3,
  radius: number,
  growFrom: number,
  growTo: number,
  rings: number,
) {
  const RADIAL = 6;
  const base = p.grow.length;
  const frames = curve.computeFrenetFrames(rings, false);
  const point = new THREE.Vector3();
  const v = new THREE.Vector3();
  const n = new THREE.Vector3();

  for (let i = 0; i <= rings; i++) {
    const u = i / rings;
    curve.getPointAt(u, point);
    // Tapering, and never quite to zero — a twig that ends in a point looks
    // like a needle.
    const r = radius * (1 - u * 0.82);
    const grow = growFrom + (growTo - growFrom) * u;
    for (let j = 0; j <= RADIAL; j++) {
      const a = (j / RADIAL) * Math.PI * 2;
      n.copy(frames.normals[i]).multiplyScalar(Math.cos(a))
        .addScaledVector(frames.binormals[i], Math.sin(a));
      v.copy(point).addScaledVector(n, r);
      // The spine is the centre it shrinks back to, so an ungrown length of
      // stem collapses onto its own line rather than being cut off in mid-air.
      pushVertex(p, v, n, grow, point, 0.92, WOOD);
    }
  }

  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < RADIAL; j++) {
      const a = base + i * (RADIAL + 1) + j;
      const b = a + 1;
      const c = base + (i + 1) * (RADIAL + 1) + j;
      const d = c + 1;
      p.index.push(a, c, b, b, c, d);
    }
  }
}

/* ── The branch ─────────────────────────────────────────────────────────── */

function buildBranch(seed: number, length: number, lean: number, lean2: number, detail: boolean) {
  const random = rnd(seed);
  const p = empty();

  // The main stem: in from the edge of the screen and down, with a slack
  // curve to it. Nothing straight — a branch is a record of how it grew.
  const spine = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(lean * 0.26, -length * 0.3, 0.1),
    new THREE.Vector3(lean * 0.5, -length * 0.62, -0.05),
    new THREE.Vector3(lean * 0.62 + lean2, -length, 0.08),
  ]);
  addStem(p, spine, 0.0115, 0, 0.88, detail ? 34 : 20);

  const twigs = detail ? 7 : 4;
  const at = new THREE.Vector3();
  const facing = new THREE.Quaternion();

  for (let i = 0; i < twigs; i++) {
    const u = 0.16 + (i / twigs) * 0.72 + random() * 0.05;
    spine.getPointAt(Math.min(0.99, u), at);
    const dir = (i % 2 === 0 ? 1 : -1) * (0.55 + random() * 0.5);
    const twigLen = length * (0.14 + random() * 0.12);
    const twig = new THREE.CatmullRomCurve3([
      at.clone(),
      at.clone().add(new THREE.Vector3(dir * twigLen * 0.5, -twigLen * 0.28, random() * 0.12)),
      at.clone().add(new THREE.Vector3(dir * twigLen, -twigLen * 0.62, random() * 0.2 - 0.1)),
    ]);
    const from = u * 0.88;
    addStem(p, twig, 0.0055, from, from + 0.1, detail ? 12 : 7);

    // Flowers along the twig, and one at its tip.
    const count = detail ? 4 : 2;
    for (let f = 0; f <= count; f++) {
      const tf = 0.35 + (f / count) * 0.65;
      twig.getPointAt(Math.min(0.999, tf), at);
      facing.setFromEuler(
        new THREE.Euler(
          (random() - 0.5) * 1.5,
          (random() - 0.5) * 1.5,
          random() * Math.PI * 2,
        ),
      );
      addFlower(p, at.clone(), facing.clone(), 0.2 + random() * 0.09, from + 0.06 + tf * 0.08, random);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(p.positions, 3));
  geometry.setAttribute("aGrow", new THREE.Float32BufferAttribute(p.grow, 1));
  geometry.setAttribute("aCentre", new THREE.Float32BufferAttribute(p.centre, 3));
  geometry.setAttribute("aWaxThin", new THREE.Float32BufferAttribute(p.thin, 1));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(p.color, 3));
  geometry.setIndex(p.index);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/* ── Component ──────────────────────────────────────────────────────────── */

/**
 * The same branch, from a real modelled asset.
 *
 * Used the moment a GLB appears at /public/models/blossom.glb. It cannot
 * bloom flower by flower — nothing here knows which triangles are a flower —
 * so it grows the way a branch reaching into frame grows: up from nothing and
 * in from off-screen, on the same scroll position.
 */
function ModelledBranch({
  url,
  mirror,
  progress,
  viewportWidth,
  viewportHeight,
}: {
  url: string;
  mirror: number;
  progress: RefObject<number>;
  viewportWidth: number;
  viewportHeight: number;
}) {
  const { scene } = useGLTF(url);
  const group = useRef<THREE.Group>(null);
  const grown = useRef(0);

  // Cloned per side, because the same object cannot sit in a scene graph
  // twice — and the right-hand branch is the left one turned over.
  const model = useMemo(() => {
    const copy = scene.clone(true);
    const size = new THREE.Vector3();
    new THREE.Box3().setFromObject(copy).getSize(size);
    // Fitted to the screen rather than trusting whatever scale the exporter
    // happened to choose.
    copy.scale.setScalar((viewportHeight * 0.85) / Math.max(size.y, 0.0001));
    return copy;
  }, [scene, viewportHeight]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const want = Math.min(1, Math.max(0, progress.current * 1.25));
    grown.current = THREE.MathUtils.damp(grown.current, want, 3.2, delta);
    const t = grown.current;
    g.scale.setScalar(0.3 + t * 0.7);
    g.position.x = mirror * (viewportWidth / 2 + 0.5 - t * 0.6);
    g.rotation.z =
      mirror * (0.4 - t * 0.2) + Math.sin(performance.now() * 0.00016) * 0.02 * mirror;
  });

  return (
    <group ref={group} position={[mirror * (viewportWidth / 2), viewportHeight * 0.1, -0.8]}>
      <primitive object={model} rotation={[0, mirror > 0 ? 0 : Math.PI, 0]} />
    </group>
  );
}

export function BlossomBranch({
  side,
  progress,
  lowPower = false,
  model,
}: {
  side: "left" | "right";
  /** How far down the whole document the reader is, 0 to 1. */
  progress: RefObject<number>;
  lowPower?: boolean;
  /** A real asset at /public/models/blossom.glb, used in place of the code one. */
  model?: string | null;
}) {
  const { viewport } = useThree();
  const group = useRef<THREE.Group>(null);
  const grown = useRef(0);
  const uniform = useMemo(() => ({ value: 0 }), []);

  const mirror = side === "left" ? 1 : -1;
  const geometry = useMemo(
    () =>
      buildBranch(
        side === "left" ? 0x8a17 : 0x51cd,
        viewport.height * 1.5,
        0.55 * mirror,
        0.1 * mirror,
        !lowPower,
      ),
    [side, mirror, viewport.height, lowPower],
  );

  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: "#fffaf8",
      vertexColors: true,
      roughness: 0.74,
      metalness: 0,
      // A petal's bloom is a sheen, but a faint one. At 0.5 the whole branch
      // went satin and started competing with the photographs.
      sheen: 0.28,
      sheenColor: new THREE.Color("#ffeef0"),
      sheenRoughness: 0.72,
      clearcoat: 0.06,
      side: THREE.DoubleSide,
      transparent: true,
      // Sat back, so it reads as something behind the words.
      opacity: 0.86,
    });
    // Petals are translucent. Same physics as the wax, warmer and stronger:
    // a blossom held against the light is almost entirely glow.
    applyWaxScattering(m, { color: "#ffdde0", strength: 0.3 });

    const scattering = m.onBeforeCompile;
    m.onBeforeCompile = (shader, renderer) => {
      scattering(shader, renderer);
      shader.uniforms.uGrow = uniform;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
           attribute float aGrow;
           attribute vec3 aCentre;
           uniform float uGrow;`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           // Each flower and each ring of stem carries the moment it opens.
           // Anything not yet due collapses onto its own centre, which for a
           // flower is its throat and for the stem is its spine — so the
           // branch thickens and blooms rather than being clipped in mid-air.
           float g = smoothstep(aGrow, aGrow + 0.16, uGrow);
           transformed = aCentre + (transformed - aCentre) * g;`,
        );
    };
    m.customProgramCacheKey = () => "blossom-grow-1";
    return m;
  }, [uniform]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, delta) => {
    // Eased toward the scroll rather than tracking it, so a flick of the
    // wheel opens flowers at the speed flowers open.
    const want = Math.min(1, Math.max(0, progress.current * 1.25));
    grown.current = THREE.MathUtils.damp(grown.current, want, 3.2, delta);
    uniform.value = grown.current;
    const g = group.current;
    if (g) g.rotation.z = Math.sin(performance.now() * 0.00016) * 0.018 * mirror;
  });

  // Every hook above has already run, so the early return here is safe.
  if (model) {
    return (
      <Suspense fallback={null}>
        <ModelledBranch
          url={model}
          mirror={mirror}
          progress={progress}
          viewportWidth={viewport.width}
          viewportHeight={viewport.height}
        />
      </Suspense>
    );
  }

  // Hung from the top corner of the screen, just outside it, so the branch
  // enters from off-page rather than starting at a visible stump.
  return (
    <group
      ref={group}
      position={[mirror * (viewport.width / 2 + 0.12), viewport.height * 0.62, -0.6]}
    >
      <mesh geometry={geometry} material={material} />
    </group>
  );
}
