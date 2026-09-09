// SacredTrees.tsx
'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';

// ---------- 五种神圣树木的 Low-Poly 子组件 ----------

// 1. 菩提树：主干粗壮，心形/伞状深绿树冠
const BodhiTree: React.FC = () => {
  return (
    <group>
      {/* 主干 */}
      <mesh castShadow receiveShadow position={[0, 1, 0]}>
        <cylinderGeometry args={[0.4, 0.6, 2, 8]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.8} />
      </mesh>
      {/* 伞状树冠（多个球体组合） */}
      <mesh castShadow receiveShadow position={[0, 2.8, 0]} scale={[2.5, 1.8, 2.5]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.7} flatShading />
      </mesh>
      <mesh castShadow receiveShadow position={[1.2, 2.5, 0.5]} scale={[1.5, 1.2, 1.5]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.7} flatShading />
      </mesh>
      <mesh castShadow receiveShadow position={[-1.2, 2.5, -0.5]} scale={[1.5, 1.2, 1.5]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.7} flatShading />
      </mesh>
    </group>
  );
};

// 2. 高榕：宽大树冠 + 气生根
const BanyanTree: React.FC = () => {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.5, 0.7, 2.4, 8]} />
        <meshStandardMaterial color="#6b4c2a" roughness={0.8} />
      </mesh>
      {/* 主树冠 */}
      <mesh castShadow receiveShadow position={[0, 3.2, 0]} scale={[3.5, 2, 3.5]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#3a6b2d" roughness={0.7} flatShading />
      </mesh>
      {/* 气生根（细长圆柱） */}
      {[[1.5, 2.5, 0.8], [-1.8, 2.5, -0.6], [0.5, 2.8, -1.5], [-0.5, 2.8, 1.4]].map((pos, i) => (
        <mesh key={i} castShadow receiveShadow position={[pos[0], pos[1], pos[2]]}>
          <cylinderGeometry args={[0.05, 0.08, 1.5, 4]} />
          <meshStandardMaterial color="#8a6a4a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

// 3. 贝叶棕：笔直主干 + 顶部扇形叶片
const TalipotPalm: React.FC = () => {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 2, 0]}>
        <cylinderGeometry args={[0.25, 0.35, 4, 8]} />
        <meshStandardMaterial color="#7a5c3a" roughness={0.8} />
      </mesh>
      {/* 扇形叶片（多个扁平面片） */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            castShadow
            receiveShadow
            position={[Math.cos(angle) * 0.8, 4.2, Math.sin(angle) * 0.8]}
            rotation={[0, angle, 0.4]}
          >
            <planeGeometry args={[1.5, 0.4]} />
            <meshStandardMaterial color="#4a7a3a" side={THREE.DoubleSide} roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
};

// 4. 槟榔树：细长高耸，树冠小
const ArecaPalm: React.FC = () => {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 3, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 6, 6]} />
        <meshStandardMaterial color="#9a7a4a" roughness={0.8} />
      </mesh>
      {/* 小树冠（几片叶子） */}
      {Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * Math.PI * 2;
        return (
          <mesh key={i} castShadow receiveShadow position={[Math.cos(angle) * 0.3, 6.2, Math.sin(angle) * 0.3]} rotation={[0.5, angle, 0]}>
            <coneGeometry args={[0.15, 0.6, 4]} />
            <meshStandardMaterial color="#5a8a3a" roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
};

// 5. 糖棕：树干粗壮带纹理，圆球刺状树冠
const SugarPalm: React.FC = () => {
  return (
    <group>
      {/* 分段树干模拟纹理 */}
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.5, 0.7, 1, 8]} />
        <meshStandardMaterial color="#6a4c2a" roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.4, 0.5, 1, 8]} />
        <meshStandardMaterial color="#6a4c2a" roughness={0.9} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 1, 8]} />
        <meshStandardMaterial color="#6a4c2a" roughness={0.9} />
      </mesh>
      {/* 刺状放射树冠 */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        return (
          <mesh
            key={i}
            castShadow
            receiveShadow
            position={[Math.cos(angle) * 0.2, 3.5, Math.sin(angle) * 0.2]}
            rotation={[Math.PI / 2, angle, 0]}
          >
            <coneGeometry args={[0.1, 1, 4]} />
            <meshStandardMaterial color="#4a7a3a" roughness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
};

// ---------- 五树环绕主组件 ----------
const SacredTrees: React.FC = () => {
  // 使用贝塞尔曲线生成半岛上的分布点
  const treeData = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-15, 0);
    shape.bezierCurveTo(-10, 8, 0, 15, 10, 12);
    shape.bezierCurveTo(15, 10, 18, 5, 15, -2);
    shape.bezierCurveTo(12, -8, 5, -12, -5, -10);
    shape.bezierCurveTo(-12, -8, -15, -4, -15, 0);

    const points = shape.getSpacedPoints(40);
    const trees: { type: number; position: [number, number, number]; rotationY: number }[] = [];
    const treeTypes = [BodhiTree, BanyanTree, TalipotPalm, ArecaPalm, SugarPalm];
    let typeIndex = 0;
    for (let i = 0; i < points.length; i++) {
      if (i % 3 === 0 && trees.length < 12) {
        const p = points[i];
        const offsetX = (Math.random() - 0.5) * 1.5;
        const offsetZ = (Math.random() - 0.5) * 1.5;
        // 映射到半岛 3D 局部坐标 (x, 0, -y)
        trees.push({
          type: typeIndex % treeTypes.length,
          position: [p.x + offsetX, 0.1, -p.y + offsetZ],
          rotationY: Math.random() * Math.PI * 2,
        });
        typeIndex++;
      }
    }
    return trees;
  }, []);

  const TreeComponents = [BodhiTree, BanyanTree, TalipotPalm, ArecaPalm, SugarPalm];

  return (
    <group position={[5, -0.3, -15]} rotation={[0, -Math.PI / 3, 0]}>
      {treeData.map((tree, idx) => {
        const Tree = TreeComponents[tree.type];
        return (
          <group key={idx} position={tree.position} rotation={[0, tree.rotationY, 0]} scale={0.8 + Math.random() * 0.4}>
            <Tree />
          </group>
        );
      })}
    </group>
  );
};

export default SacredTrees;
