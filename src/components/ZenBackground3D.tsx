"use client";

import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  金色菩提光尘 (Golden Bodhi Dust)
 *  漫天缓慢漂浮的金色萤火粒子，带远近景深差异
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const PARTICLE_COUNT = 180;

function BodhiDust() {
  const meshRef = useRef<THREE.Points>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  // Track mouse position normalized to [-1, 1]
  const handlePointerMove = useCallback((e: THREE.Event & { clientX?: number; clientY?: number }) => {
    // We use onPointerMove at the Canvas level instead
  }, []);

  // Generate particle positions and attributes
  const { positions, sizes, opacities, speeds, phases } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const opacities = new Float32Array(PARTICLE_COUNT);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Distribute particles in a wide 3D space
      positions[i * 3] = (Math.random() - 0.5) * 16;     // x: -8 to 8
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12; // y: -6 to 6
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;  // z: -5 to 5

      // Vary sizes for depth illusion (closer = bigger)
      const depth = (positions[i * 3 + 2] + 5) / 10; // 0 to 1 (front to back)
      sizes[i] = 0.03 + Math.random() * 0.07 + depth * 0.04;

      // Opacity also varies with depth
      opacities[i] = 0.3 + Math.random() * 0.7;

      // Random rise speeds
      speeds[i] = 0.1 + Math.random() * 0.3;

      // Phase offset for organic movement
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions, sizes, opacities, speeds, phases };
  }, []);

  // Custom shader material for golden glow
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMouseX: { value: 0 },
        uMouseY: { value: 0 },
        uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1 },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aOpacity;
        attribute float aSpeed;
        attribute float aPhase;
        
        uniform float uTime;
        uniform float uMouseX;
        uniform float uMouseY;
        uniform float uPixelRatio;
        
        varying float vOpacity;
        varying float vDistFromCenter;
        
        void main() {
          vec3 pos = position;
          
          // Gentle vertical drift (rising like incense smoke)
          pos.y += mod(pos.y + uTime * aSpeed * 0.15 + 10.0, 12.0) - 6.0 - pos.y;
          
          // Organic horizontal sway
          pos.x += sin(uTime * 0.3 + aPhase) * 0.4;
          pos.z += cos(uTime * 0.2 + aPhase * 1.3) * 0.3;
          
          // Mouse interaction: subtle parallax push
          float depthFactor = (pos.z + 5.0) / 10.0;
          pos.x += uMouseX * 0.8 * depthFactor;
          pos.y += uMouseY * 0.5 * depthFactor;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Size attenuation with distance
          gl_PointSize = aSize * uPixelRatio * 280.0 / -mvPosition.z;
          
          // Pulse opacity
          float pulse = sin(uTime * 0.8 + aPhase) * 0.3 + 0.7;
          vOpacity = aOpacity * pulse;
          
          // Distance from center for color gradient
          vDistFromCenter = length(pos.xy) / 8.0;
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        varying float vDistFromCenter;
        
        void main() {
          // Soft circular particle shape
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          
          // Soft glow falloff
          float alpha = smoothstep(0.5, 0.0, d) * vOpacity;
          
          // Color: warm gold (#FFB300) to warm white, shifted by distance
          vec3 goldDeep = vec3(1.0, 0.7, 0.0);    // Deep gold
          vec3 goldLight = vec3(1.0, 0.92, 0.75);   // Warm white
          vec3 color = mix(goldDeep, goldLight, vDistFromCenter * 0.6 + d * 0.4);
          
          // Glow core
          float core = smoothstep(0.15, 0.0, d);
          color += vec3(0.3, 0.2, 0.05) * core;
          
          gl_FragColor = vec4(color, alpha * 0.6);
        }
      `,
    });
  }, []);

  // Animation loop
  useFrame(({ clock, pointer }) => {
    if (!meshRef.current) return;

    const time = clock.getElapsedTime();
    shaderMaterial.uniforms.uTime.value = time;

    // Smooth mouse tracking
    mousePos.current.x += (pointer.x * 0.5 - mousePos.current.x) * 0.02;
    mousePos.current.y += (pointer.y * 0.5 - mousePos.current.y) * 0.02;
    shaderMaterial.uniforms.uMouseX.value = mousePos.current.x;
    shaderMaterial.uniforms.uMouseY.value = mousePos.current.y;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={PARTICLE_COUNT}
          array={sizes}
          itemSize={1}
          args={[sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-aOpacity"
          count={PARTICLE_COUNT}
          array={opacities}
          itemSize={1}
          args={[opacities, 1]}
        />
        <bufferAttribute
          attach="attributes-aSpeed"
          count={PARTICLE_COUNT}
          array={speeds}
          itemSize={1}
          args={[speeds, 1]}
        />
        <bufferAttribute
          attach="attributes-aPhase"
          count={PARTICLE_COUNT}
          array={phases}
          itemSize={1}
          args={[phases, 1]}
        />
      </bufferGeometry>
      <primitive object={shaderMaterial} attach="material" />
    </points>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  大型环形光晕 (Ambient Halo Rings)
 *  缓慢旋转的金色光环，增添禅意空间的纵深感
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function HaloRings() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.z = t * 0.03;
    groupRef.current.rotation.x = Math.sin(t * 0.05) * 0.1;
  });

  const ringMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#c9a227"),
        transparent: true,
        opacity: 0.04,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  return (
    <group ref={groupRef}>
      {[3.5, 5, 6.8].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2 + i * 0.2, 0, 0]} material={ringMaterial}>
          <ringGeometry args={[radius - 0.02, radius + 0.02, 128]} />
        </mesh>
      ))}
    </group>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  主背景组件
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function ZenBackground3D() {
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      {/* 底层深色渐变 */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 30%, rgba(201, 162, 39, 0.12) 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 80%, rgba(45, 106, 79, 0.06) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 20% 70%, rgba(184, 134, 11, 0.08) 0%, transparent 60%)
          `,
        }}
      />

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "low-power",
        }}
        style={{ position: "absolute", inset: 0 }}
      >
        <BodhiDust />
        <HaloRings />
      </Canvas>
    </div>
  );
}
