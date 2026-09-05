'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { MeshPhysicalMaterial, DoubleSide } from 'three';

interface ProceduralLampProps {
  position: [number, number, number];
  id?: string;
  userName?: string;
  lightEnabled?: boolean;
  onDedicate?: (id: string) => void;
  message?: string;
  dedications?: number;
}

const ProceduralLamp: React.FC<ProceduralLampProps> = ({
  position,
  id = 'lamp',
  userName = '',
  lightEnabled = true,
  onDedicate,
  message = '',
  dedications = 0,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const materialRef = useRef<MeshPhysicalMaterial>(null);

  const [pulse, setPulse] = useState(0);
  const pulseRef = useRef(0);
  const animationStart = useRef(0);

  // 六角锥灯身：琉璃透光材质
  const material = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: '#FFF8E7',
        transmission: 0.9,
        opacity: 1,
        roughness: 0.4,
        thickness: 0.5,
        side: DoubleSide,
        transparent: false,
        envMapIntensity: 0.4,
        clearcoat: 0.1,
        clearcoatRoughness: 0.2,
        emissive: '#FBBF24',
        emissiveIntensity: 0.4,
      }),
    []
  );

  // 金色莲托
  const trayMaterial = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: '#FFD580',
        emissive: '#FFA500',
        emissiveIntensity: 0.5,
        roughness: 0.4,
        metalness: 0.4,
      }),
    []
  );

  // 火苗
  const flameMaterial = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: '#FFFDE7',
        emissive: '#FBBF24',
        emissiveIntensity: 3,
        roughness: 0.1,
        transmission: 0.3,
        transparent: true,
        opacity: 0.9,
      }),
    []
  );

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity = lightEnabled ? 0.6 : 0.2;
    }
  }, [lightEnabled]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (onDedicate) onDedicate(id);
    setPulse((p) => p + 1);
  };

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const group = groupRef.current;
    const light = lightRef.current;
    if (!group) return;

    // 浮动（每盏灯独立相位）
    const baseY = position[1] ?? 0;
    group.position.y = baseY + Math.sin(t * 1.5 + position[0]) * 0.08;
    group.rotation.y = Math.sin(t * 0.5 + position[2]) * 0.1;

    // 火苗闪烁
    const flame = group.getObjectByName('flame') as THREE.Mesh | undefined;
    if (flame) {
      const f = 0.88 + Math.sin(t * 8.3 + position[0]) * 0.12 + Math.random() * 0.04;
      flame.scale.set(f, f + Math.sin(t * 13) * 0.1, f);
    }

    // 光源呼吸
    if (light) {
      light.intensity = 2.5 + Math.sin(t * 7.1 + position[2]) * 0.5;
    }

    // 回向脉冲动画
    if (pulseRef.current !== pulse) {
      pulseRef.current = pulse;
      animationStart.current = t;
    }
    const animTime = t - animationStart.current;
    const dur = 0.8;
    if (animTime < dur) {
      const p = animTime / dur;
      const s = 1 + Math.sin(p * Math.PI) * 0.35 * Math.exp(-p * 3);
      group.scale.setScalar(s);
      if (light) light.intensity = 3 + Math.sin(p * Math.PI) * 5;
    } else {
      group.scale.setScalar(1);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* 六角锥灯身 */}
      <mesh castShadow receiveShadow onPointerDown={handlePointerDown}>
        <coneGeometry args={[0.5, 0.8, 6]} />
        <primitive object={material} ref={materialRef} attach="material" />
      </mesh>

      {/* 底部托盘 */}
      <mesh material={trayMaterial} position={[0, -0.42, 0]} receiveShadow>
        <cylinderGeometry args={[0.55, 0.45, 0.08, 12]} />
      </mesh>

      {/* 莲座 6 瓣 */}
      {Array.from({ length: 6 }).map((_, i) => {
        const ang = (i / 6) * Math.PI * 2;
        return (
          <mesh
            key={i}
            material={trayMaterial}
            position={[Math.cos(ang) * 0.48, -0.46, Math.sin(ang) * 0.48]}
            rotation={[Math.PI / 2, ang, 0]}
          >
            <circleGeometry args={[0.16, 6]} />
          </mesh>
        );
      })}

      {/* 火苗 */}
      <mesh name="flame" material={flameMaterial} position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
      </mesh>

      {/* 点光源 */}
      {lightEnabled && (
        <pointLight
          ref={lightRef}
          color="#FBBF24"
          intensity={3}
          distance={5}
          decay={2}
          position={[0, 0.2, 0]}
          castShadow
        />
      )}

      {/* 悬浮名称 Billboard */}
      {userName && (
        <Billboard position={[0, 1.2, 0]}>
          <Text
            fontSize={0.28}
            color="#FFE4A0"
            anchorX="center"
            anchorY="middle"
            depthTest={false}
            outlineWidth={0.02}
            outlineColor="#000000"
            fillOpacity={0.9}
          >
            {userName}
          </Text>
          {dedications > 0 && (
            <Text
              fontSize={0.18}
              color="#FFA500"
              anchorX="center"
              anchorY="middle"
              depthTest={false}
              outlineWidth={0.01}
              outlineColor="#000000"
              fillOpacity={0.8}
              position={[0, -0.38, 0]}
            >
              {`🙏 ${dedications}`}
            </Text>
          )}
        </Billboard>
      )}
    </group>
  );
};

export default ProceduralLamp;
