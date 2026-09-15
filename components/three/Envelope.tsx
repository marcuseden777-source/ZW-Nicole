"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

import {
  createEmbossNormalMap,
  createPaperRoughness,
  createWaxAlbedo,
  createWaxRoughness,
} from "@/lib/textures";
import { applyWaxScattering, buildWaxGeometry } from "@/lib/waxSeal";
import { envelope as envelopeStyle } from "@/content/wedding";

/* The envelope's canonical proportions, kept only as the fallback. The real
   size arrives as props: the screen IS the letter, so the paper takes the
   shape of whatever it is being read on — portrait on a phone, landscape on
   a laptop, exactly as a real envelope would be turned to suit the hand
   holding it. */
const DEFAULT_W = 1;
const DEFAULT_H = 1.45;
const FLAP_OVERLAP_RATIO = 0.04;

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
/* ── Component ───────────────────────────────────────────────────────────── */

type Props = {
  /** Paper width in world units. The scene measures the viewport and passes it. */
  width?: number;
  /** Paper height in world units. */
  height?: number;
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

export function Envelope({
  openness,
  monogram,
  width: W = DEFAULT_W,
  height: H = DEFAULT_H,
}: Props) {
  // Everything that is a physical thickness rather than a proportion — the
  // stock of the paper, the height of the wax, the gap between one flap and
  // the next — is scaled off the short edge. Otherwise a letter filling a
  // laptop screen is made of foil and the seal is a speck on it.
  const unit = Math.min(W, H);
  const FLAP_OVERLAP = FLAP_OVERLAP_RATIO * unit;
  const SEAL_RADIUS = 0.13 * unit;
  const T = unit; // paper-thickness scale

  // Where the front face of the closed top flap actually is. The wax has to
  // sit ON that face, and this has now been wrong twice — once as a hardcoded
  // 0.051 that was six ten-thousandths BEHIND the paper, and once as a
  // hardcoded 0.061 that cleared it at one aspect ratio and not at another,
  // because the paper's thickness scales with the screen and the magic number
  // did not. Stating it as the flap's own numbers plus a margin means it
  // cannot drift again: change the stock and the wax follows it.
  //
  // The margin is 0.045 rather than a hair because the flap's apex is not
  // flat: flapShape curves it, and the bevel rolls that curve FORWARD, so the
  // frontmost point of the paper is the very tip that lands under the wax.
  const FLAP_Z = 0.039;
  const FLAP_DEPTH = 0.009;
  const FLAP_BEVEL = 0.004;
  const SEAL_Z = (FLAP_Z + FLAP_DEPTH + FLAP_BEVEL + 0.045) * T;
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
  const waxAlbedo = useMemo(() => createWaxAlbedo(512), []);
  const waxRough = useMemo(() => createWaxRoughness(256), []);

  // Canvas textures are not garbage collected by three — release them by hand.
  useEffect(
    () => () => {
      emboss?.dispose();
      roughness.dispose();
      waxAlbedo.dispose();
      waxRough.dispose();
    },
    [emboss, roughness, waxAlbedo, waxRough],
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
    for (const map of [waxAlbedo, waxRough]) {
      map.repeat.set(1, 1);
      map.offset.set(0, 0);
      map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
    }
    const m = new THREE.MeshPhysicalMaterial({
      color: envelopeStyle.waxColor,
      // Wax is never one colour: deeper where it pooled, warmer and lighter
      // at the thin edge. A single flat red is half of why moulded plastic
      // looks moulded, and no amount of gloss stands in for it.
      map: waxAlbedo,
      // The other half is that wax is translucent. The thickness measured
      // while the geometry was built rides along on the mesh, so light
      // scatters through the rim and the pressed letters and nowhere else.
      vertexColors: true,
      roughnessMap: waxRough,
      roughness: 0.62,
      metalness: 0,
      clearcoat: 0.72,
      clearcoatRoughness: 0.22,
      reflectivity: 0.42,
      sheen: 0.2,
      sheenColor: new THREE.Color("#d07a5c"),
      sheenRoughness: 0.68,
      transparent: true,
    });
    applyWaxScattering(m, { color: "#ef7042", strength: 0.9 });
    return m;
  }, [waxAlbedo, waxRough]);

  useEffect(
    () => () => {
      paper.dispose();
      wax.dispose();
    },
    [paper, wax],
  );

  const geometries = useMemo(() => {
    const back = new THREE.ExtrudeGeometry(roundedRect(W, H, 0.05 * unit), {
      depth: 0.016 * T,
      bevelEnabled: true,
      bevelThickness: 0.004 * T,
      bevelSize: 0.004 * T,
      bevelSegments: 3,
      curveSegments: 16,
    });

    const side = new THREE.ExtrudeGeometry(flapShape(H / 2, W / 2, FLAP_OVERLAP), {
      depth: 0.008 * T,
      bevelEnabled: true,
      bevelThickness: 0.0035 * T,
      bevelSize: 0.0035 * T,
      bevelSegments: 3,
      curveSegments: 20,
    });

    const bottom = new THREE.ExtrudeGeometry(flapShape(W / 2, H * 0.42, FLAP_OVERLAP), {
      depth: 0.008 * T,
      bevelEnabled: true,
      bevelThickness: 0.0035 * T,
      bevelSize: 0.0035 * T,
      bevelSegments: 3,
      curveSegments: 20,
    });

    // The top flap is hinged, so its geometry hangs from its own origin.
    const top = new THREE.ExtrudeGeometry(flapShape(W / 2, H * 0.46, FLAP_OVERLAP), {
      depth: FLAP_DEPTH * T,
      bevelEnabled: true,
      bevelThickness: FLAP_BEVEL * T,
      bevelSize: FLAP_BEVEL * T,
      bevelSegments: 2,
      curveSegments: 20,
    });

    // The two halves of one seal: the same outline table read across
    // different arcs, so the edge runs continuously over the join and the
    // break is a real broken face rather than a flat slice.
    // "lean" on purpose: this is the door, and it is built between the tap
    // and the envelope opening. The seal is a hundred-odd pixels across here,
    // where the closing one fills a third of the column.
    const sealL = buildWaxGeometry({
      monogram,
      detail: "lean",
      radius: SEAL_RADIUS,
      arc: [Math.PI / 2, (3 * Math.PI) / 2],
    }).geometry;
    const sealR = buildWaxGeometry({
      monogram,
      detail: "lean",
      radius: SEAL_RADIUS,
      arc: [-Math.PI / 2, Math.PI / 2],
    }).geometry;

    const invitationCard = new THREE.ExtrudeGeometry(
      roundedRect(W * 0.9, H * 0.82, 0.02 * unit),
      { depth: 0.006 * T, bevelEnabled: false, curveSegments: 12 },
    );

    return { back, side, bottom, top, sealL, sealR, invitationCard };
  }, [monogram, W, H, T, unit, FLAP_OVERLAP, SEAL_RADIUS, FLAP_DEPTH, FLAP_BEVEL]);

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
      <group ref={card} position={[0, 0, 0.0175 * T]}>
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
      <group position={[-W / 2, 0, 0.023 * T]} rotation={[-0.06, 0, Math.PI / 2]}>
        <mesh geometry={geometries.side} material={paper} castShadow receiveShadow />
      </group>
      <group position={[W / 2, 0, 0.023 * T]} rotation={[-0.045, 0, -Math.PI / 2]}>
        <mesh geometry={geometries.side} material={paper} castShadow receiveShadow />
      </group>

      {/* Bottom panel */}
      <group position={[0, -H / 2, 0.031 * T]} rotation={[-0.055, 0, Math.PI]}>
        <mesh geometry={geometries.bottom} material={paper} castShadow receiveShadow />
      </group>

      {/* Top panel — hinged at the fold */}
      <group ref={flap} position={[0, H / 2, FLAP_Z * T]}>
        <mesh geometry={geometries.top} material={paper} castShadow receiveShadow />
      </group>

      {/* The wax seal, in two halves waiting to be broken.

          0.056 rather than 0.051, and the number matters. The old seal was an
          extruded solid whose bevel reached back behind the paper, so where
          it sat was never visible. The real one is a thin shell poured ON the
          flap: its underside IS its underside, and at 0.051 that underside
          sat six ten-thousandths behind the top flap's front face at 0.052 —
          so the flap won the depth test across the whole thin outer half of
          the wax and drew a cream triangle over the monogram. Wax is poured
          on top of a closed envelope; this is where it goes, with enough
          clearance that the flap's own bevel cannot graze the thin rim. */}
      <group position={[0, 0, SEAL_Z]}>
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
