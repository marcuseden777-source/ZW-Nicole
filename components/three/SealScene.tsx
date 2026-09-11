"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { createSealReliefMap } from "@/lib/textures";
import { envelope as envelopeStyle } from "@/content/wedding";

const RADIUS = 1;

/** The same scalloped rim the envelope's seal has, at presentation scale. */
function sealShape(radius: number) {
  const shape = new THREE.Shape();
  const steps = 224;
  const rand = (i: number) => Math.sin(i * 12.9898) * 43758.5453;

  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const lobes = Math.sin(a * 10 + 0.4) * 0.072;
    const spread = Math.sin(a * 3 + 1.7) * 0.038 + Math.sin(a * 5.5 - 0.8) * 0.022;
    const jitter = (rand(i) - Math.floor(rand(i)) - 0.5) * 0.022;
    const r = radius * (1 + lobes + spread + jitter);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function Seal({ monogram }: { monogram: string }) {
  const group = useRef<THREE.Group>(null);
  const relief = useMemo(() => createSealReliefMap(monogram, 512), [monogram]);

  const material = useMemo(() => {
    const span = 1 / (RADIUS * 2);
    relief.repeat.set(span, span);
    relief.offset.set(0.5, 0.5);
    return new THREE.MeshPhysicalMaterial({
      color: envelopeStyle.waxColor,
      normalMap: relief,
      normalScale: new THREE.Vector2(2.2, 2.2),
      roughness: 0.52,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.14,
      reflectivity: 0.6,
      sheen: 0.3,
      sheenColor: new THREE.Color("#ff9a86"),
      sheenRoughness: 0.5,
    });
  }, [relief]);

  const geometry = useMemo(
    () =>
      new THREE.ExtrudeGeometry(sealShape(RADIUS), {
        depth: 0.09,
        bevelEnabled: true,
        bevelThickness: 0.2,
        bevelSize: 0.17,
        bevelSegments: 8,
        curveSegments: 4,
      }),
    [],
  );

  useEffect(
    () => () => {
      relief.dispose();
      material.dispose();
      geometry.dispose();
    },
    [relief, material, geometry],
  );

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    // A slow, shallow turn — enough to move the highlight across the wax and
    // prove the thing is solid, not so much that it reads as a spinning logo.
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, state.pointer.x * 0.5 + Math.sin(t * 0.28) * 0.22, 2.5, delta);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -state.pointer.y * 0.3 + Math.cos(t * 0.22) * 0.1, 2.5, delta);
    g.position.y = Math.sin(t * 0.5) * 0.05;
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
}

/**
 * The seal, returning at the close as a real object.
 *
 * The envelope is gone by now — this brings the motif back in three
 * dimensions so the piece is bookended rather than quietly becoming a flat
 * page after the door. Small, lazily loaded, and gated by the same capability
 * check as everything else.
 */
export function SealScene({ monogram, lowPower }: { monogram: string; lowPower: boolean }) {
  return (
    <Canvas
      dpr={lowPower ? [1, 1.4] : [1, 2]}
      gl={{ antialias: !lowPower, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 0, 4.2], fov: 32 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.12;
      }}
      // Decoration. The words around it are the invitation.
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.7} color="#fff5e6" />
        <directionalLight position={[-2.4, 2.8, 2.6]} intensity={2.6} color="#fff0d6" />
        <directionalLight position={[2.6, -1, 1.8]} intensity={0.6} color="#fdf3e4" />
        {!lowPower && (
          <Environment resolution={64} frames={1}>
            <Lightformer intensity={2.4} color="#fffaf0" position={[-2, 2.5, 2]} scale={[5, 5, 1]} />
            <Lightformer intensity={1} color="#ffe2bd" position={[3, 0, 1.5]} scale={[3, 6, 1]} />
          </Environment>
        )}
        <Seal monogram={monogram} />
      </Suspense>
    </Canvas>
  );
}
