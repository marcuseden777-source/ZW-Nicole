"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

import { createPetalTexture, createWaxAlbedo, createWaxRoughness } from "@/lib/textures";
import { applyWaxScattering, buildWaxGeometry } from "@/lib/waxSeal";
import { envelope as envelopeStyle, couple } from "@/content/wedding";

/* ═══════════════════════════════════════════════════════════════════════
 *  One world, behind the whole page.
 *
 *  Not a canvas per section. A single persistent scene the document scrolls
 *  through — petals at four depths that parallax against each other, light
 *  that turns from candle to dusk as the evening goes on, and a wax seal
 *  hanging in it that can actually be taken hold of and spun.
 *
 *  Everything here reads from refs inside the render loop. Nothing in this
 *  file re-renders React while you scroll.
 * ═══════════════════════════════════════════════════════════════════════ */

/** Petals at several depths, so the page has real parallax rather than a flat backdrop. */
function Drift({
  count,
  depth,
  progress,
}: {
  count: number;
  depth: number;
  progress: RefObject<number>;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const texture = useMemo(() => createPetalTexture(128), []);

  const seeds = useMemo(() => {
    let s = 11102026 + depth * 7919;
    const rand = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0x100000000;
    };
    return Array.from({ length: count }, () => ({
      x: (rand() - 0.5) * 16,
      y: rand() * 20 - 10,
      z: -depth * 2.4 - rand() * 1.6,
      scale: (0.05 + rand() * 0.1) * (1 + depth * 0.55),
      fall: 0.16 + rand() * 0.3,
      sway: 0.4 + rand() * 1.4,
      phase: rand() * Math.PI * 2,
      spin: (rand() - 0.5) * 0.8,
      tilt: rand() * Math.PI,
    }));
  }, [count, depth]);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    // Scrolling carries the far layers less than the near ones.
    const carried = progress.current * (14 + depth * 9);

    for (let i = 0; i < seeds.length; i++) {
      const p = seeds[i];
      const y = (((p.y - t * p.fall + carried) % 20) + 20) % 20 - 10;
      dummy.position.set(p.x + Math.sin(t * 0.3 + p.phase) * p.sway, y, p.z);
      dummy.rotation.set(p.tilt + t * p.spin * 0.25, t * p.spin * 0.5, t * p.spin * 0.35);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        // The further back, the fainter — that is what makes it read as depth
        // rather than as clutter at one distance.
        opacity={0.55 / (1 + depth * 0.85)}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/**
 * The seal, hanging in the world, and yours to spin.
 *
 * Two things were wrong with this and they were both design rather than code.
 *
 * It was a scalloped disc with a normal map on it, eight segments across the
 * bevel and a clearcoat at full strength — a red plastic button the size of a
 * dinner plate. It is real wax now: the same geometry the closing seal is
 * built from, with the impression pressed into actual vertices and light
 * scattering through the thin rim. See lib/waxSeal.ts.
 *
 * And it wandered the entire length of the document, which meant it spent the
 * middle of the page sitting on top of the photographs. Decoration that
 * covers the content is not decoration. It now belongs to the opening — the
 * invitation itself — and has left before the first photograph arrives.
 */
function FloatingSeal({ progress }: { progress: RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0);
  const momentum = useRef(0);

  // Coarser than the closing seal: it is a third of the size on screen, a
  // long way back, and usually turning.
  const { geometry } = useMemo(() => buildWaxGeometry({ monogram: couple.monogram, detail: "lean" }), []);
  const rough = useMemo(() => createWaxRoughness(256), []);
  const albedo = useMemo(() => createWaxAlbedo(512), []);

  const material = useMemo(() => {
    for (const map of [rough, albedo]) {
      map.repeat.set(1, 1);
      map.offset.set(0, 0);
      map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
    }
    const m = new THREE.MeshPhysicalMaterial({
      color: envelopeStyle.waxColor,
      map: albedo,
      vertexColors: true,
      roughnessMap: rough,
      roughness: 0.6,
      metalness: 0,
      clearcoat: 0.7,
      clearcoatRoughness: 0.24,
      reflectivity: 0.42,
      sheen: 0.18,
      sheenColor: new THREE.Color("#d07a5c"),
      sheenRoughness: 0.7,
      transparent: true,
    });
    applyWaxScattering(m, { color: "#ef7042", strength: 0.85 });
    return m;
  }, [rough, albedo]);

  useEffect(
    () => () => {
      rough.dispose();
      albedo.dispose();
      material.dispose();
      geometry.dispose();
    },
    [rough, albedo, material, geometry],
  );

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const p = progress.current;

    // Present for the opening, gone by the photographs. Faded rather than
    // switched off, so it leaves rather than disappears.
    const life = 1 - smoothstep(0.2, 0.34, p);
    material.opacity = life;
    g.visible = life > 0.01;
    if (!g.visible) return;

    // Follows the cursor across the page and keeps turning when it stops,
    // so it reads as an object being looked at rather than a sprite.
    momentum.current += (state.pointer.x * 1.6 - spin.current) * 0.02;
    momentum.current *= 0.9;
    spin.current += momentum.current;

    g.rotation.y = spin.current + Math.sin(t * 0.25) * 0.28;
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -state.pointer.y * 0.3, 3, delta);

    // Out in the right margin and well behind the page, where a guest reading
    // the invitation can see it turning but never has to read around it.
    g.position.set(4.05 + state.pointer.x * 0.28, 2.2 - p * 7, -3.1);
    g.scale.setScalar(0.5 * life);
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
}

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Light that turns from candle to dusk as the evening goes on. */
function Evening({ progress }: { progress: RefObject<number> }) {
  const key = useRef<THREE.DirectionalLight>(null);
  const ambient = useRef<THREE.AmbientLight>(null);
  const warm = useMemo(() => new THREE.Color("#fff0d6"), []);
  const dusk = useMemo(() => new THREE.Color("#e4c6d8"), []);
  const scratch = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const p = progress.current;
    if (key.current) {
      key.current.color.copy(scratch.copy(warm).lerp(dusk, p));
      key.current.position.set(-2.6 + p * 5.2, 3 - p * 1.4, 2.4);
    }
    if (ambient.current) ambient.current.intensity = 0.42 - p * 0.1;
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.42} color="#fff5e6" />
      <directionalLight ref={key} position={[-2.6, 3, 2.4]} intensity={2.4} color="#fff0d6" />
      <directionalLight position={[2.8, -1.2, 1.6]} intensity={0.45} color="#fdf3e4" />
      {/* Behind the world, for the wax to glow through. */}
      <directionalLight position={[1.4, 1.2, -4]} intensity={1.3} color="#ff9a5c" />
    </>
  );
}

export function WorldScene({
  progress,
  lowPower,
}: {
  progress: RefObject<number>;
  lowPower: boolean;
}) {
  const layers = lowPower ? [24, 16] : [30, 24, 18, 12];

  return (
    <Canvas
      dpr={lowPower ? [1, 1.3] : [1, 1.75]}
      gl={{ antialias: !lowPower, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 0, 6], fov: 42 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.14;
      }}
      // The world is decoration; only the seal opts back into pointer events.
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <Evening progress={progress} />
        {!lowPower && (
          <Environment resolution={64} frames={1}>
            <Lightformer intensity={2.2} color="#fffaf0" position={[-2, 2.5, 2]} scale={[5, 5, 1]} />
            <Lightformer intensity={1} color="#ffe2bd" position={[3, 0, 1.5]} scale={[3, 6, 1]} />
          </Environment>
        )}

        {layers.map((count, depth) => (
          <Drift key={depth} count={count} depth={depth} progress={progress} />
        ))}

        <FloatingSeal progress={progress} />
      </Suspense>
    </Canvas>
  );
}
