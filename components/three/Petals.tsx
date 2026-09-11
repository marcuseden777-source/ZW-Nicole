"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { createPetalTexture } from "@/lib/textures";

type Props = { count: number };

/**
 * Petals drifting through the frame. One instanced draw call for all of them,
 * so ninety petals cost the phone roughly what one would.
 */
export function Petals({ count }: Props) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const texture = useMemo(() => createPetalTexture(128), []);

  // Each petal gets its own drift, spin and depth, fixed for the visit.
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 7,
        y: Math.random() * 9 - 4.5,
        z: (Math.random() - 0.5) * 3.5 - 0.6,
        scale: 0.022 + Math.random() * 0.045,
        speed: 0.13 + Math.random() * 0.22,
        sway: 0.3 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.7,
        tilt: Math.random() * Math.PI,
      })),
    [count],
  );

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((state) => {
    const instanced = mesh.current;
    if (!instanced) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < seeds.length; i++) {
      const p = seeds[i];
      // Fall, wrapping back to the top — an endless, unhurried drift.
      const fallen = (p.y - t * p.speed) % 9;
      const y = fallen < -4.5 ? fallen + 9 : fallen;

      dummy.position.set(
        p.x + Math.sin(t * 0.4 + p.phase) * p.sway,
        y,
        p.z + Math.cos(t * 0.3 + p.phase) * 0.3,
      );
      dummy.rotation.set(p.tilt + t * p.spin * 0.3, t * p.spin, t * p.spin * 0.6);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }

    instanced.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, count]}
      frustumCulled={false}
      renderOrder={2}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.5}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
