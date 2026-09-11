"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

import { createPaperRoughness, createSheetAlpha } from "@/lib/textures";

const WIDTH = 4.2;
const FULL = 7.2;

/**
 * A scroll of paper unrolling as the story is read.
 *
 * The words themselves are real HTML sitting in front of this — a canvas
 * cannot be selected, searched, translated or read aloud, and a couple's
 * story is the last thing on the page that should be a picture of text. This
 * is the paper it is written on, and nothing else.
 */
function Parchment({ progress }: { progress: RefObject<number> }) {
  const sheet = useRef<THREE.Mesh>(null);
  const topRoll = useRef<THREE.Group>(null);
  const bottomRoll = useRef<THREE.Group>(null);

  const roughness = useMemo(() => createPaperRoughness(256), []);
  const edge = useMemo(() => createSheetAlpha(256), []);

  const paper = useMemo(() => {
    roughness.repeat.set(3, 5);
    return new THREE.MeshPhysicalMaterial({
      color: "#fdf8ee",
      roughnessMap: roughness,
      roughness: 0.95,
      metalness: 0,
      sheen: 0.24,
      sheenColor: new THREE.Color("#fff4e0"),
      sheenRoughness: 0.85,
      side: THREE.DoubleSide,
      // No hard rectangle: the sheet dissolves at its sides and foot.
      alphaMap: edge,
      transparent: true,
    });
  }, [roughness, edge]);

  const rolled = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#f2e9d6",
        roughnessMap: roughness,
        roughness: 0.9,
        metalness: 0,
        sheen: 0.3,
        sheenColor: new THREE.Color("#fff4e0"),
      }),
    [roughness],
  );

  const geometry = useMemo(
    // Segmented down its length so the sheet can bow: flat paper held at two
    // ends is the one thing that never happens to real paper.
    () => new THREE.PlaneGeometry(WIDTH, 1, 1, 48),
    [],
  );

  useEffect(
    () => () => {
      roughness.dispose();
      edge.dispose();
      paper.dispose();
      rolled.dispose();
      geometry.dispose();
    },
    [roughness, edge, paper, rolled, geometry],
  );

  useFrame((state) => {
    const t = THREE.MathUtils.clamp(progress.current, 0, 1);
    // Unrolls early and finishes well before the section ends, so the last
    // paragraphs are read on open paper rather than on something still moving.
    const open = Math.min(1, t / 0.72);
    const eased = 1 - Math.pow(1 - open, 2.4);
    const length = 0.5 + eased * FULL;

    if (sheet.current) {
      sheet.current.scale.y = length;
      // Hangs from the roll: the top edge stays put, the bottom travels.
      sheet.current.position.y = -length / 2;

      // A slow bow across the open sheet, strongest in the middle.
      const g = sheet.current.geometry as THREE.PlaneGeometry;
      const pos = g.attributes.position;
      const time = state.clock.elapsedTime;
      for (let i = 0; i < pos.count; i++) {
        const v = pos.getY(i);
        const across = pos.getX(i) / WIDTH;
        pos.setZ(
          i,
          Math.sin(v * 3.1 + time * 0.25) * 0.035 * eased +
            Math.cos(across * 2.4 + time * 0.2) * 0.02,
        );
      }
      pos.needsUpdate = true;
      g.computeVertexNormals();
    }

    if (topRoll.current) {
      topRoll.current.position.y = 0;
      // The top roll thins as its paper is paid out.
      topRoll.current.scale.setScalar(1 - eased * 0.42);
    }

    if (bottomRoll.current) {
      bottomRoll.current.position.y = -length;
      bottomRoll.current.rotation.x = -eased * 7;
      bottomRoll.current.scale.setScalar(0.58 + (1 - eased) * 0.42);
    }
  });

  return (
    <group position={[0, 2.35, 0]}>
      <mesh ref={sheet} geometry={geometry} material={paper} castShadow receiveShadow />

      {(
        [
          [topRoll, "top"],
          [bottomRoll, "bottom"],
        ] as const
      ).map(([ref, key]) => (
        <group key={key} ref={ref}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={rolled} castShadow>
            <cylinderGeometry args={[0.15, 0.15, WIDTH + 0.12, 28]} />
          </mesh>
          {/* The paper's cut edge, showing it is wound rather than solid. */}
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[(side * (WIDTH + 0.12)) / 2, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
            >
              <circleGeometry args={[0.15, 28]} />
              <meshBasicMaterial color="#e6dac1" side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function ParchmentScroll({
  progress,
  lowPower,
}: {
  progress: RefObject<number>;
  lowPower: boolean;
}) {
  return (
    <Canvas
      dpr={lowPower ? [1, 1.3] : [1, 1.8]}
      gl={{ antialias: !lowPower, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 0, 6.4], fov: 44 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.16;
      }}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={2.1} color="#fffaf0" />
        <directionalLight position={[-2.2, 3, 2.4]} intensity={1.4} color="#fff4e2" />
        <directionalLight position={[2.6, -1.4, 1.8]} intensity={0.4} color="#fdf3e4" />
        <Parchment progress={progress} />
      </Suspense>
    </Canvas>
  );
}
