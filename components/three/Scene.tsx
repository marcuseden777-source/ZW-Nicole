"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
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
 * The three-dimensional layer.
 *
 * Lit entirely by hand. The specular environment the wax reflects is built
 * from geometry inside the scene rather than a downloaded HDRI, so nothing is
 * fetched at runtime — the invitation opens the same on a plane, on hotel
 * wifi, or on nothing but a phone signal at the venue.
 */

/**
 * The paper, cut to the screen.
 *
 * The envelope used to be a fixed 1 x 1.45 card floating in the middle of a
 * cream field, which is a picture OF an envelope on a website. The screen is
 * the letter: the paper takes the shape of whatever it is being read on, so a
 * phone gets a portrait envelope and a laptop a landscape one — which is what
 * a real envelope does anyway, since you turn it to suit your hand.
 *
 * The bleed is there so a rounded corner, the slight tilt each flap sits at,
 * or a sub-pixel rounding error can never leave a hairline of page colour
 * down an edge. 2% was not enough — the corner radius alone ate it.
 */
function FittedEnvelope({
  progress,
  monogram,
}: {
  progress: RefObject<number>;
  monogram: string;
}) {
  // Viewport in world units at z = 0, which is the plane the paper sits on.
  const { viewport } = useThree();
  return (
    <Envelope
      openness={progress}
      monogram={monogram}
      width={viewport.width * 1.14}
      height={viewport.height * 1.14}
    />
  );
}
export function Scene({ progress, monogram, petalCount, lowPower }: Props) {
  return (
    <Canvas
      // Real shadows are what separate a rendered object from a flat shape:
      // the seal sitting on the paper, one flap over another, the whole
      // envelope against the page behind it.
      shadows={lowPower ? false : "soft"}
      dpr={lowPower ? [1, 1.4] : [1, 2]}
      gl={{
        antialias: !lowPower,
        alpha: true,
        powerPreference: "high-performance",
      }}
      camera={{ position: [0, 0, 3.45], fov: 34 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.15;
      }}
      // The canvas is decoration; the words beneath it are the invitation.
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        {/* Kept deliberately low: a high ambient washes out both the relief
            and the shadows, which are doing most of the work here. */}
        <ambientLight intensity={0.52} color="#fff5e6" />

        {/* The key. Rakes in from the upper left and casts every shadow. */}
        <directionalLight
          position={[-2.6, 3, 2.4]}
          intensity={2.9}
          color="#fff0d6"
          castShadow={!lowPower}
          shadow-mapSize={lowPower ? [512, 512] : [2048, 2048]}
          // Framed tightly around the envelope: a shadow camera any wider
          // spends its resolution on empty space and the seal's shadow
          // arrives as a staircase.
          // Wide enough for a letter that now fills a laptop screen. Framed
          // tighter than this and the seal's own shadow walks off the edge of
          // the shadow map on a wide display.
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
          shadow-camera-near={0.5}
          shadow-camera-far={12}
          shadow-bias={-0.0002}
          shadow-normalBias={0.002}
        />

        {/* A warm fill from the right, so the shadow interiors stay cream
            rather than going grey. */}
        <directionalLight position={[2.8, -1.2, 1.6]} intensity={0.62} color="#fdf3e4" />
        {/* Lantern glow, just off frame */}
        <pointLight position={[1.5, 0.5, 1.2]} intensity={1.1} color="#f3bf7c" distance={7} />

        {/* The world the wax reflects. Sealing wax is glossy — without
            something to mirror it reads as matte plastic. */}
        {!lowPower && (
          <Environment resolution={128} frames={1}>
            <Lightformer
              intensity={2.6}
              color="#fffaf0"
              position={[-2, 2.5, 2]}
              scale={[5, 5, 1]}
            />
            <Lightformer
              intensity={1.1}
              color="#ffe2bd"
              position={[3, 0, 1.5]}
              scale={[3, 6, 1]}
            />
            <Lightformer
              intensity={0.5}
              color="#dfe8ff"
              position={[0, -3, 1]}
              scale={[6, 3, 1]}
            />
          </Environment>
        )}

        {/* The shadow-catching plane and the contact shadow that used to sit
            here were both shadows cast onto a surface behind the envelope.
            There is no behind any more — the paper fills the frame — so they
            were darkening nothing and costing a render pass to do it. What is
            left is the envelope's shadows on ITSELF: one flap over the next,
            and the wax onto the paper, which is all that was ever doing the
            work. */}

        <FittedEnvelope progress={progress} monogram={monogram} />
        {petalCount > 0 && <Petals count={petalCount} openness={progress} />}
      </Suspense>
    </Canvas>
  );
}
