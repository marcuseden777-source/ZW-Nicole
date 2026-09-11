"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, type RefObject } from "react";
import * as THREE from "three";

import { Envelope } from "./Envelope";
import { Petals } from "./Petals";

type Props = {
  /** Live scroll position through the hero, read every frame. */
  progress: RefObject<number>;
  monogram: string;
  petalCount: number;
  lowPower: boolean;
};

/**
 * The three-dimensional layer. Lit entirely by hand — no environment map is
 * fetched at runtime, so the invitation opens the same on a plane, on hotel
 * wifi, or with nothing but a phone signal at the venue.
 */
export function Scene({ progress, monogram, petalCount, lowPower }: Props) {
  return (
    <Canvas
      dpr={lowPower ? [1, 1.4] : [1, 2]}
      gl={{
        antialias: !lowPower,
        alpha: true,
        powerPreference: "high-performance",
      }}
      camera={{ position: [0, 0, 3.45], fov: 34 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.18;
      }}
      // The canvas is decoration; the words beneath it are the invitation.
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        {/* Kept deliberately low: a high ambient washes the emboss flat, and
            the embossing is the whole reason the paper is worth rendering. */}
        <ambientLight intensity={0.8} color="#fff5e6" />

        {/* Candlelight, raking across the relief from the upper left */}
        <directionalLight
          position={[-2.4, 2.6, 1.35]}
          intensity={3.4}
          color="#fff0d6"
        />
        {/* A cool fill from the right, so the shadows stay ivory not grey */}
        <directionalLight position={[2.8, -1.2, 1.6]} intensity={0.9} color="#fdf6ea" />
        {/* Lantern glow, just off frame */}
        <pointLight position={[1.5, 0.5, 1.2]} intensity={1.3} color="#f3bf7c" distance={7} />
        {/* A low warm bounce, as if from a table beneath */}
        <pointLight position={[0, -1.8, 1.6]} intensity={0.6} color="#e8c79a" distance={6} />

        <Envelope openness={progress} monogram={monogram} />
        {petalCount > 0 && <Petals count={petalCount} />}
      </Suspense>
    </Canvas>
  );
}
