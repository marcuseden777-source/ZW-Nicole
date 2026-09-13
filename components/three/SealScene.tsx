"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { applyWaxScattering, buildWaxGeometry } from "@/lib/waxSeal";
import { createWaxAlbedo, createWaxRoughness } from "@/lib/textures";
import { envelope as envelopeStyle } from "@/content/wedding";

function Seal({
  monogram,
  still,
  lean,
}: {
  monogram: string;
  still: boolean;
  lean: boolean;
}) {
  const group = useRef<THREE.Group>(null);

  const { geometry } = useMemo(
    () => buildWaxGeometry({ monogram, detail: lean ? "lean" : "full" }),
    [monogram, lean],
  );

  const rough = useMemo(() => createWaxRoughness(256), []);
  const albedo = useMemo(() => createWaxAlbedo(512), []);

  const material = useMemo(() => {
    // The geometry's UVs already map the disc into the middle of a square
    // texture, so these sit at 1:1 — no repeat, no offset.
    for (const map of [rough, albedo]) {
      map.repeat.set(1, 1);
      map.offset.set(0, 0);
      map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
    }

    const m = new THREE.MeshPhysicalMaterial({
      color: envelopeStyle.waxColor,
      map: albedo,
      // Thickness, baked into the mesh: the rim and the pressed letters carry
      // a lighter, warmer wax because that is where light gets through.
      vertexColors: true,
      roughnessMap: rough,
      roughness: 0.62,
      metalness: 0,
      // Sealing wax is glossy. What it is NOT is evenly glossy — the
      // roughness map breaks the highlight up, and the geometry now breaks it
      // up again.
      clearcoat: 0.72,
      clearcoatRoughness: 0.22,
      reflectivity: 0.42,
      sheen: 0.2,
      sheenColor: new THREE.Color("#d07a5c"),
      sheenRoughness: 0.68,
      // Wax that has cooled has a faint dusty bloom on the raised surfaces.
      // Very slight — this is the last five percent, not a look.
      iridescence: 0.06,
      iridescenceIOR: 1.2,
    });

    // The light that goes in and comes back out. Warm, because wax this
    // colour transmits orange far more readily than it transmits red.
    applyWaxScattering(m, { color: "#ef7042", strength: 0.9 });
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
    // Held exactly where it was placed for a guest who asked for less motion.
    // They still get the wax, the depth and the light on it; it simply does
    // not turn. A still object rendered in three dimensions moves no more
    // than a photograph of one.
    if (still) return;
    const t = state.clock.elapsedTime;
    // Enough of a turn to run the highlight across the wax and show that the
    // letters are cut into it, not printed on it. Past about 0.4 radians the
    // seal starts to read as a spinning logo.
    g.rotation.y = THREE.MathUtils.damp(
      g.rotation.y,
      state.pointer.x * 0.42 + Math.sin(t * 0.26) * 0.17,
      2.4,
      delta,
    );
    g.rotation.x = THREE.MathUtils.damp(
      g.rotation.x,
      -state.pointer.y * 0.26 + Math.cos(t * 0.2) * 0.09,
      2.4,
      delta,
    );
  });

  return (
    <group ref={group} rotation={[0, 0, -0.12]}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
}

/**
 * The seal, returning at the close as a real object.
 *
 * The lighting here is deliberately unbalanced. An evenly lit object is the
 * signature of a render: real light comes from somewhere, falls off, and
 * leaves a side in shadow. So there is one key from the upper left, a fill
 * far too weak to fight it, and — the one that matters for wax — a warm light
 * BEHIND the seal, which does almost nothing to the surface but drives the
 * scattering through the thin rim. Take that one away and it goes back to
 * looking like a red button.
 */
export function SealScene({
  monogram,
  lowPower,
  still = false,
}: {
  monogram: string;
  lowPower: boolean;
  /** Render the seal, but never turn it. */
  still?: boolean;
}) {
  return (
    <Canvas
      dpr={lowPower ? [1, 1.5] : [1, 2]}
      gl={{ antialias: !lowPower, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 0, 3.55], fov: 32 }}
      onCreated={({ gl }) => {
        // A photographic roll-off rather than a clamp. Deep reds are exactly
        // where a naive tone map posterises into a flat shape, which is half
        // of what made the old seal look printed.
        gl.toneMapping = THREE.AgXToneMapping;
        gl.toneMappingExposure = 1.45;
      }}
      // Decoration. The words around it are the invitation.
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        {/* Low. Ambient light is the enemy of anything trying to look solid. */}
        <ambientLight intensity={0.22} color="#fff1de" />
        {/* Key — upper left, the direction almost every photograph is lit from. */}
        <directionalLight position={[-2.2, 2.6, 3.1]} intensity={2.9} color="#fff3dd" />
        {/* Fill, weak enough that the right side stays genuinely darker. */}
        <directionalLight position={[2.8, -1.4, 1.6]} intensity={0.42} color="#f6e6d2" />
        {/* Behind the wax. This is the one that makes it wax. */}
        <directionalLight position={[0.6, 1.1, -2.6]} intensity={1.5} color="#ff9a5c" />
        {!lowPower && (
          <Environment resolution={128} frames={1}>
            <Lightformer intensity={2.2} color="#fffaf0" position={[-2, 2.5, 2]} scale={[5, 5, 1]} />
            <Lightformer intensity={0.8} color="#ffe2bd" position={[3, 0, 1.5]} scale={[3, 6, 1]} />
            <Lightformer intensity={0.5} color="#8a6a4e" position={[0, -3, 1]} scale={[6, 2, 1]} />
          </Environment>
        )}
        <Seal monogram={monogram} still={still} lean={lowPower} />
      </Suspense>
    </Canvas>
  );
}
