// SacredFlowers.tsx
'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ---------- 六种神圣花朵的 Low-Poly 子组件 ----------

// 1. 荷花/莲花（粉白色层叠）
export const LotusFlower: React.FC = () => {
  return (
    <group>
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const outer = i % 2 === 0 ? 0.25 : 0.18;
        return (
          <mesh key={i} castShadow receiveShadow position={[Math.cos(angle) * outer, 0.1, Math.sin(angle) * outer]} rotation={[0.2, angle, 0.1]}>
            <coneGeometry args={[0.1, 0.35, 5]} />
            <meshStandardMaterial color={i % 3 === 0 ? '#f5c6a0' : '#f0a0a0'} roughness={0.4} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshStandardMaterial color="#f5d9a0" roughness={0.3} />
      </mesh>
    </group>
  );
};

// 2. 文殊兰（纯白细长条状散开）
export const CrinumFlower: React.FC = () => {
  return (
    <group>
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <mesh
            key={i}
            castShadow
            receiveShadow
            position={[Math.cos(angle) * 0.1, 0.1, Math.sin(angle) * 0.1]}
            rotation={[Math.PI / 2, angle, 0]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.6, 4]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
        );
      })}
      <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
    </group>
  );
};

// 3. 黄姜花（金黄色锥体向上簇拥）
export const YellowGinger: React.FC = () => {
  return (
    <group>
      {Array.from({ length: 7 }).map((_, i) => {
        const angle = (i / 7) * Math.PI * 2;
        return (
          <mesh key={i} castShadow receiveShadow position={[Math.cos(angle) * 0.08, 0.15, Math.sin(angle) * 0.08]} rotation={[0.2, angle, 0]}>
            <coneGeometry args={[0.08, 0.4, 5]} />
            <meshStandardMaterial color="#ffcc00" roughness={0.4} />
          </mesh>
        );
      })}
    </group>
  );
};

// 4. 鸡蛋花（5 瓣扁平，外白中心黄）
export const Plumeria: React.FC = () => {
  return (
    <group>
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            castShadow
            receiveShadow
            position={[Math.cos(angle) * 0.15, 0.05, Math.sin(angle) * 0.15]}
            rotation={[0, angle, 0]}
          >
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
        );
      })}
      <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshStandardMaterial color="#FFD700" roughness={0.4} />
      </mesh>
    </group>
  );
};

// 5. 缅桂花/白兰（瘦长白色水滴）
export const Michelia: React.FC = () => {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.1, 6, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.3, 0]} scale={[0.5, 0.8, 0.5]}>
        <coneGeometry args={[0.08, 0.3, 6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
    </group>
  );
};

// 6. 地涌金莲（金黄重叠宝塔）
export const Musella: React.FC = () => {
  return (
    <group>
      {[0, 1, 2].map((layer) => (
        <mesh key={layer} castShadow receiveShadow position={[0, 0.05 + layer * 0.12, 0]} scale={[1 - layer * 0.2, 0.3, 1 - layer * 0.2]}>
          <cylinderGeometry args={[0.2, 0.25, 0.1, 8]} />
          <meshStandardMaterial color="#FFB300" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
};

// 单朵花的浮动包装（内部处理 useFrame）
const FloatingFlower: React.FC<{ position: [number, number, number]; offset: number; children: React.ReactNode }> = ({
  position,
  offset,
  children,
}) => {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime;
      ref.current.position.y = position[1] + Math.sin(t * 1.3 + offset) * 0.08;
    }
  });
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
};

// ---------- 六花浮水主组件（含性能优化） ----------
const SacredFlowers: React.FC = () => {
  // 定义各种花的实例数量和位置
  const flowerPositions = useMemo(() => {
    const positions: { type: number; position: [number, number, number]; offset: number }[] = [];
    const types = [
      { component: LotusFlower, count: 8 },
      { component: CrinumFlower, count: 3 },
      { component: YellowGinger, count: 4 },
      { component: Plumeria, count: 5 },
      { component: Michelia, count: 4 },
      { component: Musella, count: 4 },
    ];
    types.forEach((type, typeIdx) => {
      for (let i = 0; i < type.count; i++) {
        const x = (Math.random() - 0.5) * 44;
        const z = (Math.random() - 0.5) * 44;
        // 避免放在半岛附近
        if (Math.hypot(x - 5, z + 15) < 11) continue;
        positions.push({
          type: typeIdx,
          position: [x, -0.2, z],
          offset: Math.random() * Math.PI * 2,
        });
      }
    });
    return positions;
  }, []);

  // 使用 InstancedMesh 对莲花（type=0）进行实例化优化
  const lotusGroupRef = useRef<THREE.Group>(null);
  const lotusInstances = useMemo(() => {
    const lotusPositions = flowerPositions.filter((f) => f.type === 0);
    const mesh = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.1, 0.35, 5),
      new THREE.MeshStandardMaterial({ color: '#f5c6a0', roughness: 0.4, side: THREE.DoubleSide }),
      Math.max(lotusPositions.length, 1)
    );
    const dummy = new THREE.Object3D();
    lotusPositions.forEach((pos, i) => {
      dummy.position.set(pos.position[0], 0.1, pos.position[2]);
      dummy.rotation.set(0.2, pos.offset, 0.1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }, [flowerPositions]);

  const otherFlowers = useMemo(() => flowerPositions.filter((f) => f.type !== 0), [flowerPositions]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (lotusGroupRef.current) {
      lotusGroupRef.current.position.y = Math.sin(t * 1.5) * 0.05;
    }
  });

  const FlowerComponents = [LotusFlower, CrinumFlower, YellowGinger, Plumeria, Michelia, Musella];

  return (
    <group>
      {/* 莲花实例组 */}
      <group ref={lotusGroupRef}>
        <primitive object={lotusInstances} />
      </group>

      {/* 其他五种神圣花朵浮水 */}
      {otherFlowers.map((flower, index) => {
        const FlowerComponent = FlowerComponents[flower.type];
        return (
          <FloatingFlower key={index} position={flower.position} offset={flower.offset}>
            <FlowerComponent />
          </FloatingFlower>
        );
      })}
    </group>
  );
};

export default SacredFlowers;
