"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

import { createPetalTexture } from "@/lib/textures";

type Props = {
  count: number;
  /** The door's openness, 0→1, read every frame. */
  openness: RefObject<number>;
};

/**
 * Petals — drifting while the letter is sealed, then bursting out of it.
 *
 * Two behaviours blended by one number. Before the wax gives, a few petals
 * fall quietly through the frame. When it breaks, every petal is thrown from
 * the seal outward and past the camera, so the door does not merely dissolve:
 * it blooms, and the film is what is behind the bloom.
 *
 * One instanced draw call for all of them, so two hundred petals cost the
 * phone roughly what one would.
 */
export function Petals({ count, openness }: Props) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const texture = useMemo(() => createPetalTexture(128), []);

  // Each petal's own drift, its own direction out of the seal, its own spin.
  const seeds = useMemo(() => {
    // Deterministic: the same bloom every visit, so it can be art-directed.
    let s = 20261011;
    const rand = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0x100000000;
    };

    return Array.from({ length: count }, () => {
      // A direction on a hemisphere facing the viewer, so the burst comes
      // toward the guest rather than spraying evenly into the background.
      const theta = rand() * Math.PI * 2;
      const lift = 0.25 + rand() * 0.75;
      return {
        driftX: (rand() - 0.5) * 7,
        driftY: rand() * 9 - 4.5,
        driftZ: (rand() - 0.5) * 3.5 - 0.6,
        dirX: Math.cos(theta) * lift,
        dirY: Math.sin(theta) * lift * 0.8 + 0.12,
        dirZ: 0.35 + rand() * 1.15,
        reach: 2.6 + rand() * 5.2,
        delay: rand() * 0.26,
        scale: 0.03 + rand() * 0.075,
        speed: 0.13 + rand() * 0.22,
        sway: 0.3 + rand() * 0.8,
        phase: rand() * Math.PI * 2,
        spin: (rand() - 0.5) * 0.7,
        tumble: (rand() - 0.5) * 5,
        tilt: rand() * Math.PI,
      };
    });
  }, [count]);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame((state) => {
    const instanced = mesh.current;
    if (!instanced) return;

    const t = state.clock.elapsedTime;
    const open = THREE.MathUtils.clamp(openness.current, 0, 1);

    for (let i = 0; i < seeds.length; i++) {
      const p = seeds[i];

      // How far into its own burst this petal is. The stagger is what makes
      // it read as a bloom opening rather than a single puff.
      const burst = THREE.MathUtils.clamp((open - 0.12 - p.delay) / 0.5, 0, 1);
      // Fast out of the seal, then coasting.
      const flung = Math.pow(burst, 0.62);

      // The quiet fall, while the letter is still sealed.
      const fallen = (p.driftY - t * p.speed) % 9;
      const driftY = fallen < -4.5 ? fallen + 9 : fallen;
      const calm = 1 - burst;

      dummy.position.set(
        (p.driftX + Math.sin(t * 0.4 + p.phase) * p.sway) * calm + p.dirX * p.reach * flung,
        driftY * calm + p.dirY * p.reach * flung,
        (p.driftZ + Math.cos(t * 0.3 + p.phase) * 0.3) * calm + p.dirZ * p.reach * flung,
      );

      dummy.rotation.set(
        p.tilt + t * p.spin * 0.3 + p.tumble * flung,
        t * p.spin + p.tumble * flung * 0.7,
        t * p.spin * 0.6 + p.tumble * flung * 0.5,
      );

      // Grows as it is thrown, then gone. Petals that keep their size while
      // flying past the camera read as confetti, not blossom.
      const fade = burst < 0.82 ? 1 : 1 - (burst - 0.82) / 0.18;
      dummy.scale.setScalar(p.scale * (calm * 0.75 + flung * 2.1) * fade);

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
        opacity={0.72}
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
