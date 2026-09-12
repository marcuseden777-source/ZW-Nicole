"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { createSealReliefMap, createWaxAlbedo, createWaxRoughness } from "@/lib/textures";
import { envelope as envelopeStyle } from "@/content/wedding";

const RADIUS = 1;

/**
 * The scalloped rim of a seal, as wax actually behaves.
 *
 * Molten wax pressed under a stamp spreads outward and stops where it cools.
 * The edge that leaves is WAVY — a few big lobes where it ran furthest, finer
 * ripples over them — and it is smooth all the way round, because a liquid
 * cannot have a sharp corner.
 *
 * This used to add per-vertex random jitter on top of the lobes, which is
 * noise rather than waviness: every point jumped independently of its
 * neighbours, so the outline became a ring of tiny flat facets and each one
 * caught the light separately. That is most of what read as moulded plastic.
 *
 * Every frequency here is a whole number, so the curve closes on itself
 * exactly. A fractional one would leave a notch at the seam.
 */
function sealShape(radius: number) {
  const shape = new THREE.Shape();
  const steps = 512;

  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r =
      radius *
      (1 +
        // The big lobes, where the wax ran furthest.
        Math.sin(a * 9 + 0.4) * 0.062 +
        // Two slower swells, so no two lobes are quite the same size.
        Math.sin(a * 3 + 1.7) * 0.036 +
        Math.sin(a * 5 - 0.8) * 0.021 +
        // Fine ripple along the edge — small, and still smooth.
        Math.sin(a * 17 + 2.3) * 0.010 +
        Math.sin(a * 26 - 0.6) * 0.005);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

function Seal({ monogram, still }: { monogram: string; still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const relief = useMemo(() => createSealReliefMap(monogram, 512), [monogram]);

  const rough = useMemo(() => createWaxRoughness(256), []);
  const albedo = useMemo(() => createWaxAlbedo(512), []);

  const material = useMemo(() => {
    const span = 1 / (RADIUS * 2);
    relief.repeat.set(span, span);
    relief.offset.set(0.5, 0.5);
    rough.repeat.set(span * 1.6, span * 1.6);
    rough.offset.set(0.5, 0.5);
    albedo.repeat.set(span, span);
    albedo.offset.set(0.5, 0.5);
    return new THREE.MeshPhysicalMaterial({
      color: envelopeStyle.waxColor,
      // Tonal variation across the wax, multiplying the colour rather than
      // replacing it — the shade stays a one-line change in the content file.
      map: albedo,
      normalMap: relief,
      // Pressed harder, so the monogram reads as an impression in a soft
      // material rather than an etching on a hard one.
      normalScale: new THREE.Vector2(2.9, 2.9),
      // Varies across the surface rather than sitting at one number, so the
      // highlight breaks up over the wax instead of sliding across it whole.
      roughnessMap: rough,
      roughness: 0.78,
      metalness: 0,
      // Sealing wax IS glossy — that was never the problem. The problem was
      // that the gloss was perfectly even and stepped from facet to facet,
      // which is what a moulded button does. Keep the shine; let the
      // roughness map break it up.
      clearcoat: 0.85,
      clearcoatRoughness: 0.16,
      reflectivity: 0.55,
      // The pink sheen read as plastic against the oxblood. Warm and much
      // fainter — this is a wax bloom, not a satin.
      sheen: 0.16,
      sheenColor: new THREE.Color("#c66a54"),
      sheenRoughness: 0.75,
    });
  }, [relief, rough, albedo]);

  const geometry = useMemo(() => {
    const extruded = new THREE.ExtrudeGeometry(sealShape(RADIUS), {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.17,
      // The bevel is the whole domed edge of the seal and it is large next to
      // the depth, so eight segments across it put visible steps in the
      // highlight running round the rim. This is the part the eye lands on.
      bevelSegments: 20,
      curveSegments: 8,
    });

    // ExtrudeGeometry gives every facet its own flat normal, which is correct
    // for a machined part and wrong for something poured. Dropping the
    // normals lets neighbouring vertices merge by position and UV; recomputing
    // them afterwards averages across the join, so the light runs smoothly
    // over the dome instead of stepping from facet to facet.
    extruded.deleteAttribute("normal");
    const merged = mergeVertices(extruded);
    merged.computeVertexNormals();
    extruded.dispose();
    return merged;
  }, []);

  useEffect(
    () => () => {
      relief.dispose();
      rough.dispose();
      albedo.dispose();
      material.dispose();
      geometry.dispose();
    },
    [relief, rough, albedo, material, geometry],
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
        <Seal monogram={monogram} still={still} />
      </Suspense>
    </Canvas>
  );
}
