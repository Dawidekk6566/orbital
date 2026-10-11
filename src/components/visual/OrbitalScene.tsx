"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useThemeColors } from "./useThemeColors";

/* ============================================================
   OrbitalScene — sygnaturowa, monochromatyczna scena 3D marki.
   Rdzeń (zniekształcona ikosahedra + siatka wireframe) z satelitami
   krążącymi po orbitach — metafora audytu „na orbicie". Reaguje na
   ruch kursora (parallax). Kolory z tokenów motywu (ink/muted), więc
   flipuje z light/dark. Renderowana tylko przez OrbitalBackdrop
   (next/dynamic, ssr:false) i pauzowana poza ekranem / przy
   prefers-reduced-motion (prop `active` steruje frameloop).
   ============================================================ */

const SATELLITES = [
  { r: 2.3, size: 0.08, speed: 0.25, tilt: [0.5, 0, 0.15] as const, phase: 0 },
  { r: 2.3, size: 0.055, speed: 0.25, tilt: [0.5, 0, 0.15] as const, phase: 2.3 },
  { r: 2.9, size: 0.07, speed: -0.17, tilt: [-0.3, 0.4, 0] as const, phase: 1.1 },
  { r: 2.9, size: 0.05, speed: -0.17, tilt: [-0.3, 0.4, 0] as const, phase: 4.0 },
  { r: 3.4, size: 0.06, speed: 0.12, tilt: [0.2, -0.5, 0.3] as const, phase: 2.0 },
];

function Satellite({
  r,
  size,
  speed,
  tilt,
  phase,
  color,
}: (typeof SATELLITES)[number] & { color: string }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * speed;
  });
  return (
    <group ref={group} rotation={tilt as unknown as [number, number, number]}>
      {/* ślad orbity */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[r, 0.004, 8, 180]} />
        <meshBasicMaterial color={color} transparent opacity={0.14} />
      </mesh>
      {/* satelita */}
      <mesh position={[Math.cos(phase) * r, 0, Math.sin(phase) * r]}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
      </mesh>
    </group>
  );
}

function Core({ ink }: { ink: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.08;
  });
  return (
    <Float speed={1.1} rotationIntensity={0.3} floatIntensity={0.35}>
      {/* miękki, zniekształcony rdzeń */}
      <mesh>
        <icosahedronGeometry args={[1.15, 6]} />
        <MeshDistortMaterial
          color={ink}
          speed={1.3}
          distort={0.26}
          transparent
          opacity={0.12}
          roughness={0.6}
          metalness={0.15}
        />
      </mesh>
      {/* siatka wireframe */}
      <mesh ref={ref}>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshBasicMaterial color={ink} wireframe transparent opacity={0.2} />
      </mesh>
    </Float>
  );
}

function System() {
  const { ink, muted } = useThemeColors();
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!group.current) return;
    // delikatny parallax w stronę kursora
    group.current.rotation.y = THREE.MathUtils.lerp(
      group.current.rotation.y,
      state.pointer.x * 0.4,
      0.04,
    );
    group.current.rotation.x = THREE.MathUtils.lerp(
      group.current.rotation.x,
      -state.pointer.y * 0.25,
      0.04,
    );
  });
  return (
    <group ref={group}>
      <Core ink={ink} />
      {SATELLITES.map((s, i) => (
        <Satellite key={i} {...s} color={muted} />
      ))}
    </group>
  );
}

export default function OrbitalScene({ active }: { active: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0.3, 6], fov: 42 }}
      dpr={[1, 1.6]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      frameloop={active ? "always" : "never"}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <directionalLight position={[-4, -2, -3]} intensity={0.4} />
      <System />
    </Canvas>
  );
}
