"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

import {
  createEmbossNormalMap,
  createPaperRoughness,
  createSealReliefMap,
} from "@/lib/textures";
import { envelope as envelopeStyle } from "@/content/wedding";

const W = 1;
const H = 1.45;
const FLAP_OVERLAP = 0.04;
const SEAL_RADIUS = 0.13;

/* ── Shapes ──────────────────────────────────────────────────────────────── */

function roundedRect(w: number, h: number, radius: number) {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + w - radius, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + radius);
  shape.lineTo(x + w, y + h - radius);
  shape.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  shape.lineTo(x + radius, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

/** One of the four folded panels, as a triangle reaching in to the centre. */
function flapShape(halfWidth: number, depth: number, apexBleed: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth, 0);
  shape.lineTo(halfWidth, 0);
  // A whisper of curve on the fold, the way stock actually creases.
  shape.quadraticCurveTo(halfWidth * 0.34, -depth * 0.62, 0, -(depth + apexBleed));
  shape.quadraticCurveTo(-halfWidth * 0.34, -depth * 0.62, -halfWidth, 0);
  return shape;
}

/**
 * The scalloped edge of a pressed wax seal.
 *
 * Three frequencies layered: the regular lobes the die presses, a slower
 * wobble for the way molten wax spreads unevenly under the press, and a little
 * fine noise. A single clean sine reads as a cog, not as wax.
 */
function sealShape(radius: number, half: "left" | "right" | "full") {
  const shape = new THREE.Shape();
  const steps = 192;
  const rand = (i: number) => Math.sin(i * 12.9898) * 43758.5453;

  const from = half === "right" ? -Math.PI / 2 : half === "left" ? Math.PI / 2 : 0;
  const to = half === "right" ? Math.PI / 2 : half === "left" ? (3 * Math.PI) / 2 : Math.PI * 2;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = from + (to - from) * t;
    const lobes = Math.sin(a * 10 + 0.4) * 0.072;
    const spread = Math.sin(a * 3 + 1.7) * 0.038 + Math.sin(a * 5.5 - 0.8) * 0.022;
    const jitter = (rand(i) - Math.floor(rand(i)) - 0.5) * 0.022;
    const r = radius * (1 + lobes + spread + jitter);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }

  if (half !== "full") shape.closePath();
  return shape;
}

/* ── Component ───────────────────────────────────────────────────────────── */

type Props = {
  /**
   * Live scroll position through the hero: 0 is sealed and whole, 1 is the
   * seal broken and the flap fully open.
   *
   * Deliberately a ref rather than a number — the value changes on every
   * frame, and re-rendering React sixty times a second to animate an envelope
   * would cost far more than the animation itself.
   */
  openness: RefObject<number>;
  monogram: string;
};

export function Envelope({ openness, monogram }: Props) {
  const group = useRef<THREE.Group>(null);
  const flap = useRef<THREE.Group>(null);
  const sealLeft = useRef<THREE.Group>(null);
  const sealRight = useRef<THREE.Group>(null);
  const card = useRef<THREE.Group>(null);

  // Built only if something is going to sample it. `envelopeStyle.emboss` is
  // off — the reference envelope is smooth stock — so this was generating a
  // 512x512 normal map on the door's critical path and throwing it away:
  // roughly six hundred filtered canvas draws, a 262,144-pixel height-to-
  // normal conversion and a megabyte of texture, between hydration and the
  // moment the envelope becomes tappable, for a map no material reads.
  const emboss = useMemo(
    () => (envelopeStyle.emboss ? createEmbossNormalMap(512) : null),
    [],
  );
  const roughness = useMemo(() => createPaperRoughness(256), []);
  const relief = useMemo(() => createSealReliefMap(monogram, 512), [monogram]);

  // Canvas textures are not garbage collected by three — release them by hand.
  useEffect(
    () => () => {
      emboss?.dispose();
      roughness.dispose();
      relief.dispose();
    },
    [emboss, roughness, relief],
  );

  const paper = useMemo(() => {
    emboss?.repeat.set(2.4, 3.2);
    return new THREE.MeshPhysicalMaterial({
      color: envelopeStyle.paperColor,
      // The reference envelope is smooth stock, so the botanical relief is off
      // unless it is asked for in the content file.
      normalMap: emboss,
      normalScale: new THREE.Vector2(1.7, 1.7),
      roughnessMap: roughness,
      roughness: 0.94,
      metalness: 0,
      sheen: 0.18,
      sheenColor: new THREE.Color("#fff6e4"),
      sheenRoughness: 0.85,
      side: THREE.DoubleSide,
      transparent: true,
    });
  }, [emboss, roughness]);

  const wax = useMemo(() => {
    // The seal's front face carries UVs equal to its own shape coordinates, so
    // mapping the relief across the disc is a matter of scaling by its radius.
    const span = 1 / (SEAL_RADIUS * 2);
    relief.repeat.set(span, span);
    relief.offset.set(0.5, 0.5);
    return new THREE.MeshPhysicalMaterial({
      color: envelopeStyle.waxColor,
      normalMap: relief,
      normalScale: new THREE.Vector2(2.2, 2.2),
      // Wax is a dielectric with a hard lacquered skin: rough underneath,
      // glossy on top, so the highlight sits on the surface rather than
      // spreading through the colour.
      roughness: 0.52,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.14,
      reflectivity: 0.6,
      sheen: 0.3,
      sheenColor: new THREE.Color("#ff9a86"),
      sheenRoughness: 0.5,
      transparent: true,
    });
  }, [relief]);

  useEffect(
    () => () => {
      paper.dispose();
      wax.dispose();
    },
    [paper, wax],
  );

  const geometries = useMemo(() => {
    const back = new THREE.ExtrudeGeometry(roundedRect(W, H, 0.05), {
      depth: 0.016,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 3,
      curveSegments: 16,
    });

    const side = new THREE.ExtrudeGeometry(flapShape(H / 2, W / 2, FLAP_OVERLAP), {
      depth: 0.008,
      bevelEnabled: true,
      bevelThickness: 0.0035,
      bevelSize: 0.0035,
      bevelSegments: 3,
      curveSegments: 20,
    });

    const bottom = new THREE.ExtrudeGeometry(flapShape(W / 2, H * 0.42, FLAP_OVERLAP), {
      depth: 0.008,
      bevelEnabled: true,
      bevelThickness: 0.0035,
      bevelSize: 0.0035,
      bevelSegments: 3,
      curveSegments: 20,
    });

    // The top flap is hinged, so its geometry hangs from its own origin.
    const top = new THREE.ExtrudeGeometry(flapShape(W / 2, H * 0.46, FLAP_OVERLAP), {
      depth: 0.009,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 2,
      curveSegments: 20,
    });

    const sealBevel = {
      depth: 0.012,
      bevelEnabled: true,
      bevelThickness: 0.026,
      bevelSize: 0.022,
      bevelSegments: 8,
      curveSegments: 4,
    } as const;

    const sealL = new THREE.ExtrudeGeometry(sealShape(SEAL_RADIUS, "left"), sealBevel);
    const sealR = new THREE.ExtrudeGeometry(sealShape(SEAL_RADIUS, "right"), sealBevel);

    const invitationCard = new THREE.ExtrudeGeometry(
      roundedRect(W * 0.9, H * 0.82, 0.02),
      { depth: 0.006, bevelEnabled: false, curveSegments: 12 },
    );

    return { back, side, bottom, top, sealL, sealR, invitationCard };
  }, []);

  useEffect(
    () => () => Object.values(geometries).forEach((g) => g.dispose()),
    [geometries],
  );

  useFrame((state, delta) => {
    const t = THREE.MathUtils.clamp(openness.current, 0, 1);

    // The seal resists, then gives: nothing happens until 12% of the pull.
    const crack = THREE.MathUtils.clamp((t - 0.12) / 0.26, 0, 1);
    const eased = crack * crack * (3 - 2 * crack);

    if (sealLeft.current && sealRight.current) {
      for (const [ref, dir] of [
        [sealLeft, -1],
        [sealRight, 1],
      ] as const) {
        const g = ref.current!;
        g.position.x = dir * eased * 0.34;
        g.position.y = -eased * eased * 0.55;
        g.position.z = eased * 0.1;
        g.rotation.z = dir * eased * 1.5;
        g.rotation.x = eased * 0.9;
      }

      wax.opacity = 1 - eased;
    }

    // Only once the wax has given way does the flap begin to swing.
    const swing = THREE.MathUtils.clamp((t - 0.3) / 0.42, 0, 1);
    const swingEased = 1 - Math.pow(1 - swing, 3);
    if (flap.current) {
      flap.current.rotation.x = -0.05 + swingEased * 2.6;
    }

    // The invitation rises out, last.
    const rise = THREE.MathUtils.clamp((t - 0.52) / 0.4, 0, 1);
    const riseEased = 1 - Math.pow(1 - rise, 3);
    if (card.current) {
      card.current.position.y = riseEased * H * 0.58;
      card.current.position.z = 0.02 + riseEased * 0.06;
      const material = (card.current.children[0] as THREE.Mesh).material as THREE.Material;
      // Fully opaque until the whole envelope withdraws for the names.
      material.opacity = 1 - THREE.MathUtils.clamp((t - 0.72) / 0.22, 0, 1);
    }

    // Once the invitation is out, the envelope itself withdraws — the names
    // should never have to be read through a sheet of paper.
    const withdraw = THREE.MathUtils.clamp((t - 0.72) / 0.22, 0, 1);
    paper.opacity = 1 - withdraw;

    // The whole envelope breathes and turns a little with the pointer, so it
    // feels like an object being held rather than a picture of one.
    if (group.current) {
      group.current.visible = withdraw < 0.999;
      group.current.scale.setScalar(0.94 - withdraw * 0.1);
      const { x, y } = state.pointer;
      const drift = Math.sin(state.clock.elapsedTime * 0.5) * 0.035;
      group.current.rotation.y = THREE.MathUtils.damp(
        group.current.rotation.y,
        x * 0.26 + drift,
        3,
        delta,
      );
      group.current.rotation.x = THREE.MathUtils.damp(
        group.current.rotation.x,
        -y * 0.14 + Math.cos(state.clock.elapsedTime * 0.4) * 0.02,
        3,
        delta,
      );
      group.current.position.y = THREE.MathUtils.damp(
        group.current.position.y,
        Math.sin(state.clock.elapsedTime * 0.6) * 0.018 - t * 0.35,
        2.5,
        delta,
      );
    }
  });

  return (
    <group ref={group} scale={0.94}>
      {/* Back panel */}
      <mesh geometry={geometries.back} material={paper} castShadow receiveShadow />

      {/* The invitation, waiting inside */}
      <group ref={card} position={[0, 0, 0.0175]}>
        <mesh geometry={geometries.invitationCard} castShadow receiveShadow>
          <meshPhysicalMaterial
            color="#fffaf1"
            roughness={0.85}
            sheen={0.4}
            sheenColor="#fff3dd"
            transparent
            opacity={1}
          />
        </mesh>
      </group>

      {/* Left and right folded panels. The rotation has to carry each apex
          *inward* to the seal — turned the other way, the panels splay out
          past the edges and the envelope stops being a rectangle. */}
      <group position={[-W / 2, 0, 0.023]} rotation={[-0.06, 0, Math.PI / 2]}>
        <mesh geometry={geometries.side} material={paper} castShadow receiveShadow />
      </group>
      <group position={[W / 2, 0, 0.023]} rotation={[-0.045, 0, -Math.PI / 2]}>
        <mesh geometry={geometries.side} material={paper} castShadow receiveShadow />
      </group>

      {/* Bottom panel */}
      <group position={[0, -H / 2, 0.031]} rotation={[-0.055, 0, Math.PI]}>
        <mesh geometry={geometries.bottom} material={paper} castShadow receiveShadow />
      </group>

      {/* Top panel — hinged at the fold */}
      <group ref={flap} position={[0, H / 2, 0.039]}>
        <mesh geometry={geometries.top} material={paper} castShadow receiveShadow />
      </group>

      {/* The wax seal, in two halves waiting to be broken */}
      <group position={[0, 0, 0.051]}>
        {(
          [
            [sealLeft, geometries.sealL, "left"] as const,
            [sealRight, geometries.sealR, "right"] as const,
          ]
        ).map(([ref, geometry, side]) => (
          <group key={side} ref={ref}>
            <mesh geometry={geometry} material={wax} castShadow receiveShadow />
          </group>
        ))}
      </group>
    </group>
  );
}
