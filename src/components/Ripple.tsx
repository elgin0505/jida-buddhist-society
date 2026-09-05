'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshBasicMaterial, RingGeometry, AdditiveBlending, DoubleSide, Color } from 'three';
import * as THREE from 'three';

interface RippleProps {
  position: [number, number, number];
  onComplete: () => void;
  color?: string;
}

const Ripple: React.FC<RippleProps> = ({ position, onComplete, color = '#F59E0B' }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);
  // 使用 ref 来延迟捕获 startTime（在首个 frame 时记录）
  const startTime = useRef<number | null>(null);
  const duration = 3.0;

  const geometry = useMemo(() => new RingGeometry(0.3, 0.5, 64), []);

  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color(color),
        transparent: true,
        opacity: 1,
        side: DoubleSide,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [color]
  );

  useFrame(({ clock }) => {
    // 首帧记录开始时间，避免 Clock 实例化问题
    if (startTime.current === null) {
      startTime.current = clock.elapsedTime;
    }
    const elapsed = clock.elapsedTime - startTime.current;

    if (elapsed >= duration) {
      onComplete();
      return;
    }
    const progress = elapsed / duration;
    // 指数级扩大，模拟真实水波张力
    const scale = 1 + Math.pow(progress, 1.8) * 8;
    if (meshRef.current) {
      meshRef.current.scale.set(scale, scale, 1);
    }
    // 透明度平滑衰减
    if (materialRef.current) {
      materialRef.current.opacity = Math.pow(1 - progress, 1.5) * 0.9;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={10}
    />
  );
};

export default Ripple;
