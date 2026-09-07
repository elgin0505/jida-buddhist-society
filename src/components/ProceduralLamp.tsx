'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Billboard, Text, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { MeshPhysicalMaterial, DoubleSide } from 'three';

export interface ProceduralLampProps {
  position: [number, number, number];
  id?: string;
  userId?: string;
  userName?: string;
  lightEnabled?: boolean;
  onDedicate?: (id: string) => void;
  onPray?: (id: string) => void;
  message?: string;
  dedications?: number;
  prayerCount?: number;
}

const ProceduralLamp: React.FC<ProceduralLampProps> = ({
  position,
  id = 'lamp',
  userName = '',
  lightEnabled = true,
  onDedicate,
  onPray,
  dedications,
  prayerCount,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const bodyMaterialRef = useRef<MeshPhysicalMaterial | null>(null);
  const trayMaterialRef = useRef<MeshPhysicalMaterial | null>(null);
  const sparklesGroupRef = useRef<THREE.Group>(null);
  const sparklesPointsRef = useRef<THREE.Points>(null);
  const plusOneRef = useRef<THREE.Group>(null);
  const plusOneTextRef = useRef<any>(null);

  // 1.5 秒点击特效控制
  const vfxStartTimeRef = useRef<number | null>(null);
  const [sparklesActive, setSparklesActive] = useState(false);
  const [floatingPlusOne, setFloatingPlusOne] = useState(false);

  // 祈祷数量（优先 prayerCount，向下兼容 dedications）
  const currentCount = prayerCount ?? dedications ?? 0;

  // 六角锥灯身材质（稳定创建，避免 lightEnabled 抖动引发 GPU 材质重建）
  const bodyMaterial = useMemo(() => {
    const mat = new MeshPhysicalMaterial({
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
      emissive: new THREE.Color('#FBBF24'),
      emissiveIntensity: lightEnabled ? 0.6 : 0.3,
    });
    bodyMaterialRef.current = mat;
    return mat;
  }, []);

  // 金色莲托材质
  const trayMaterial = useMemo(() => {
    const mat = new MeshPhysicalMaterial({
      color: '#FFD580',
      emissive: new THREE.Color('#FFA500'),
      emissiveIntensity: 0.5,
      roughness: 0.4,
      metalness: 0.4,
    });
    trayMaterialRef.current = mat;
    return mat;
  }, []);

  // 火苗材质
  const flameMaterial = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: '#FFFDE7',
        emissive: new THREE.Color('#FBBF24'),
        emissiveIntensity: 3,
        roughness: 0.1,
        transmission: 0.3,
        transparent: true,
        opacity: 0.9,
      }),
    []
  );

  // 释放 WebGL 显存
  useEffect(() => {
    return () => {
      bodyMaterial.dispose();
      trayMaterial.dispose();
      flameMaterial.dispose();
    };
  }, [bodyMaterial, trayMaterial, flameMaterial]);

  const baseEmissive = lightEnabled ? 0.6 : 0.3;

  useEffect(() => {
    if (bodyMaterialRef.current && vfxStartTimeRef.current === null) {
      bodyMaterialRef.current.emissiveIntensity = baseEmissive;
    }
  }, [baseEmissive]);

  /**
   * 模块三：精确交互绑定与点击特效
   * 必须包含 e.stopPropagation()，防止事件穿透触发水面的双击或放置逻辑
   */
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    // 记录特效起始绝对时间
    vfxStartTimeRef.current = performance.now() / 1000;
    setSparklesActive(true);
    setFloatingPlusOne(true);

    // 触发祈祷回调（带乐观更新与防抖同步）
    if (onPray) {
      onPray(id);
    } else if (onDedicate) {
      onDedicate(id);
    }
  };

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const group = groupRef.current;
    const light = lightRef.current;
    if (!group) return;

    // 水波微浪浮动（每盏灯根据坐标产生不同相位）
    const baseY = position[1] ?? 0;
    group.position.y = baseY + Math.sin(t * 1.5 + position[0]) * 0.08;
    group.rotation.y = Math.sin(t * 0.5 + position[2]) * 0.1;

    // 火苗闪烁
    const flame = group.getObjectByName('flame') as THREE.Mesh | undefined;
    if (flame) {
      const f = 0.88 + Math.sin(t * 8.3 + position[0]) * 0.12 + Math.random() * 0.04;
      flame.scale.set(f, f + Math.sin(t * 13) * 0.1, f);
    }

    // 基础光源呼吸律动
    const baseLightIntensity = 2.5 + Math.sin(t * 7.1 + position[2]) * 0.5;
    if (light && vfxStartTimeRef.current === null) {
      light.intensity = baseLightIntensity;
    }

    // 点击互动特效 (VFX)：1.5 秒内极速扩散消散并平滑恢复
    if (vfxStartTimeRef.current !== null) {
      const nowSec = performance.now() / 1000;
      const elapsed = nowSec - vfxStartTimeRef.current;
      const duration = 1.5;

      if (elapsed <= duration) {
        const progress = elapsed / duration; // 0 -> 1
        // 瞬间高亮并呈指数平滑衰减
        const decay = Math.pow(1 - progress, 2.5);
        const dynamicEmissive = baseEmissive + decay * 3.5;

        if (bodyMaterialRef.current) {
          bodyMaterialRef.current.emissiveIntensity = dynamicEmissive;
        }

        if (trayMaterialRef.current) {
          trayMaterialRef.current.emissiveIntensity = 0.5 + decay * 1.6;
        }

        if (light) {
          light.intensity = baseLightIntensity + decay * 6.0;
        }

        // 莲灯轻微跃动放大
        const scalePulse = 1 + Math.sin(progress * Math.PI) * 0.18 * (1 - progress);
        group.scale.setScalar(scalePulse);

        // 微小金光 Sparkles 环向外极速扩散
        if (sparklesGroupRef.current) {
          const ringScale = 0.6 + Math.sqrt(progress) * 3.8;
          sparklesGroupRef.current.scale.set(ringScale, 0.4, ringScale);
        }

        // 粒子透明度随扩散向外平滑消散 (Dissipation)
        if (sparklesPointsRef.current?.geometry?.attributes?.opacity) {
          const opAttr = sparklesPointsRef.current.geometry.attributes.opacity as THREE.BufferAttribute;
          const targetAlpha = Math.max(0, 1 - progress) * 0.95;
          const arr = opAttr.array as Float32Array;
          for (let i = 0; i < arr.length; i++) {
            arr[i] = targetAlpha;
          }
          opAttr.needsUpdate = true;
        }

        // 浮动 +1 功德缓缓上升并渐隐淡出
        if (plusOneRef.current) {
          plusOneRef.current.position.y = 1.4 + progress * 0.7;
        }
        if (plusOneTextRef.current) {
          const fadeAlpha = Math.max(0, 1 - progress * 1.15);
          plusOneTextRef.current.fillOpacity = fadeAlpha;
          plusOneTextRef.current.outlineOpacity = fadeAlpha;
        }
      } else {
        // 1.5 秒后自动回归初始稳态
        vfxStartTimeRef.current = null;
        if (bodyMaterialRef.current) {
          bodyMaterialRef.current.emissiveIntensity = baseEmissive;
        }
        if (trayMaterialRef.current) {
          trayMaterialRef.current.emissiveIntensity = 0.5;
        }
        if (light) {
          light.intensity = baseLightIntensity;
        }
        group.scale.setScalar(1);
        setSparklesActive(false);
        setFloatingPlusOne(false);
      }
    }
  });

  return (
    <group ref={groupRef} position={position} onPointerDown={handlePointerDown}>
      {/* 六角锥琉璃灯身 */}
      <mesh material={bodyMaterial} castShadow receiveShadow onPointerDown={handlePointerDown}>
        <coneGeometry args={[0.5, 0.8, 6]} />
      </mesh>

      {/* 底部托盘 */}
      <mesh material={trayMaterial} position={[0, -0.42, 0]} receiveShadow onPointerDown={handlePointerDown}>
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
            onPointerDown={handlePointerDown}
          >
            <circleGeometry args={[0.16, 6]} />
          </mesh>
        );
      })}

      {/* 火苗 */}
      <mesh name="flame" material={flameMaterial} position={[0, 0.45, 0]} onPointerDown={handlePointerDown}>
        <sphereGeometry args={[0.05, 8, 8]} />
      </mesh>

      {/* 核心点光源 */}
      {lightEnabled && (
        <pointLight
          ref={lightRef}
          color="#FBBF24"
          intensity={3}
          distance={6}
          decay={2}
          position={[0, 0.2, 0]}
          castShadow
        />
      )}

      {/* 点击释放的金光扩散消散粒子环 Sparkles */}
      {sparklesActive && (
        <group ref={sparklesGroupRef} position={[0, 0.05, 0]}>
          <Sparkles
            ref={sparklesPointsRef}
            count={60}
            scale={[1.6, 0.2, 1.6]}
            size={2.8}
            speed={2.2}
            noise={0.3}
            color="#FFD700"
            opacity={0.95}
          />
        </group>
      )}

      {/* 浮动祈福 +1 功德特效 */}
      {floatingPlusOne && (
        <group ref={plusOneRef} position={[0, 1.4, 0]}>
          <Billboard onPointerDown={handlePointerDown}>
            <Text
              ref={plusOneTextRef}
              fontSize={0.24}
              color="#FDE047"
              anchorX="center"
              anchorY="middle"
              material-depthTest={false}
              outlineWidth={0.02}
              outlineColor="#78350F"
              fillOpacity={1}
              outlineOpacity={1}
            >
              +1 功德
            </Text>
          </Billboard>
        </group>
      )}

      {/* 悬浮名称与祈祷计数 Billboard */}
      <Billboard position={[0, 1.15, 0]} onPointerDown={handlePointerDown}>
        {userName && (
          <Text
            fontSize={0.28}
            color="#FFE4A0"
            anchorX="center"
            anchorY="middle"
            material-depthTest={false}
            outlineWidth={0.02}
            outlineColor="#000000"
            fillOpacity={0.95}
          >
            {userName}
          </Text>
        )}
        <Text
          fontSize={0.2}
          color="#F59E0B"
          anchorX="center"
          anchorY="middle"
          material-depthTest={false}
          outlineWidth={0.015}
          outlineColor="#000000"
          fillOpacity={0.9}
          position={[0, -0.32, 0]}
        >
          {`🙏 ${currentCount}`}
        </Text>
      </Billboard>
    </group>
  );
};

export default ProceduralLamp;
