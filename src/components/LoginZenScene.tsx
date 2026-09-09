// LoginZenScene.tsx
'use client';

import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Sparkles } from '@react-three/drei';
import { MeshStandardMaterial, PlaneGeometry, DoubleSide } from 'three';
import * as THREE from 'three';

// ==================== 安全的 GLTF 加载 Hook ====================
/**
 * 尝试加载 GLB 模型，若失败返回 null，用于显示回退几何体。
 */
function useSafeGLTF(url: string): THREE.Group | null {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const gltf = (await (useGLTF as any).preload?.(url)) || (await (useGLTF as any)(url));
        if (!cancelled && gltf?.scene) {
          const clonedScene = gltf.scene.clone(true);
          setScene(clonedScene);
        }
      } catch (e) {
        console.warn(`Failed to load ${url}, using fallback.`, e);
        if (!cancelled) setError(true);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) return null;
  return scene;
}

// ==================== 水面组件 ====================
interface WaterSurfaceProps {
  timeMode?: 'day' | 'dusk' | 'night';
}

const WaterSurface: React.FC<WaterSurfaceProps> = ({ timeMode = 'night' }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const normalMap = useMemo(() => {
    // 程序化生成简易水波法线贴图
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255},${Math.random() * 255},255,0.1)`;
      ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
  }, []);

  const waterColor = useMemo(() => {
    switch (timeMode) {
      case 'day':
        return '#0284c7';
      case 'dusk':
        return '#9a3412';
      case 'night':
      default:
        return '#0a1e2f';
    }
  }, [timeMode]);

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: waterColor,
        metalness: 0.4,
        roughness: 0.25,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(0.4, 0.4),
        side: DoubleSide,
        transparent: true,
        opacity: 0.78,
      }),
    [normalMap, waterColor]
  );

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // 轻微位移模拟水波（可忽略，法线已够）
      const t = clock.elapsedTime;
      meshRef.current.rotation.z = Math.sin(t * 0.2) * 0.01;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} material={material}>
      <planeGeometry args={[100, 100, 100, 100]} />
    </mesh>
  );
};

// ==================== 河岸地形组件 ====================
interface RiverBankProps {
  timeMode?: 'day' | 'dusk' | 'night';
}

const RiverBank: React.FC<RiverBankProps> = ({ timeMode = 'night' }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const geo = new PlaneGeometry(30, 20, 50, 30);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // 右侧（x正）抬高，形成河岸
      let height = 0;
      if (x > 0) {
        height = Math.sin(x * 0.5) * 0.8 + Math.cos(y * 0.7) * 0.5;
        height = Math.max(0, height);
      }
      pos.setZ(i, height);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const bankColor = useMemo(() => {
    switch (timeMode) {
      case 'day':
        return '#3f6212';
      case 'dusk':
        return '#78350f';
      case 'night':
      default:
        return '#2d3748';
    }
  }, [timeMode]);

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: bankColor,
        roughness: 0.85,
        metalness: 0.1,
      }),
    [bankColor]
  );

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[12, 0, 0]} // 位于右侧
      geometry={geometry}
      material={material}
      receiveShadow
    />
  );
};

// ==================== 亭子组件（容错回退） ====================
const Pavilion: React.FC = () => {
  const model = useSafeGLTF('/models/pavilion.glb');
  const [lightIntensity, setLightIntensity] = useState(0.8);

  // 使用 useFrame 让内部灯光微微呼吸
  useFrame(({ clock }) => {
    setLightIntensity(0.7 + Math.sin(clock.elapsedTime * 0.5) * 0.3);
  });

  if (model) {
    return (
      <group position={[10, 0.2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <primitive object={model} />
        <pointLight position={[0, 1, 0]} intensity={lightIntensity} color="#FFD28A" distance={8} decay={2} />
      </group>
    );
  }

  // 回退：简易六角亭
  return (
    <group position={[10, 0.2, 0]} rotation={[0, Math.PI / 6, 0]}>
      {/* 基座 */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2, 2.5, 0.3, 6]} />
        <meshStandardMaterial color="#5c4033" roughness={0.8} />
      </mesh>
      {/* 柱子 */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * 1.8;
        const z = Math.sin(angle) * 1.8;
        return (
          <mesh key={i} position={[x, 1.5, z]} castShadow>
            <cylinderGeometry args={[0.15, 0.2, 3, 6]} />
            <meshStandardMaterial color="#7a5a3a" roughness={0.7} />
          </mesh>
        );
      })}
      {/* 屋顶（两层飞檐） */}
      {[1.5, 2.0].map((y, idx) => (
        <mesh key={idx} position={[0, 2.8 + idx * 0.8, 0]} castShadow>
          <coneGeometry args={[2.5 - idx * 0.4, 1.2, 6]} />
          <meshStandardMaterial color={idx === 0 ? '#6b4423' : '#8b5a2b'} roughness={0.6} />
        </mesh>
      ))}
      {/* 顶塔 */}
      <mesh position={[0, 3.8, 0]} castShadow>
        <coneGeometry args={[0.3, 0.6, 8]} />
        <meshStandardMaterial color="#b87333" roughness={0.4} />
      </mesh>
      {/* 内部点光源 */}
      <pointLight position={[0, 1.8, 0]} intensity={lightIntensity} color="#FFD28A" distance={8} decay={2} />
    </group>
  );
};

// ==================== 天鹅模型组件（容错回退） ====================
const SwanModel: React.FC<{ position?: [number, number, number]; scale?: number; flying?: boolean }> = ({
  position = [0, 0, 0],
  scale = 1,
  flying = false,
}) => {
  const model = useSafeGLTF('/models/swan.glb');

  if (model) {
    return (
      <group position={position} scale={scale}>
        <primitive object={model} />
      </group>
    );
  }

  // 回退：简单天鹅（身体+脖子+头）
  return (
    <group position={position} scale={scale} rotation={[0, 0, flying ? 0.3 : 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.5, -0.3]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 1.2, 6]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.9, -0.5]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.4} />
      </mesh>
      {flying && (
        <mesh position={[0, 0.2, 0.8]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.8, 0.05, 0.4]} />
          <meshStandardMaterial color="#e0e0e0" />
        </mesh>
      )}
    </group>
  );
};

// ==================== 莲花模型组件（容错回退） ====================
const LotusModel: React.FC<{ position?: [number, number, number]; scale?: number }> = ({
  position = [0, 0, 0],
  scale = 1,
}) => {
  const model = useSafeGLTF('/models/lotus.glb');

  if (model) {
    return (
      <group position={position} scale={scale}>
        <primitive object={model} />
      </group>
    );
  }

  // 回退：多层圆锥花瓣
  return (
    <group position={position} scale={scale}>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.15, 0.1, Math.sin(angle) * 0.15]} rotation={[0, angle, 0.2]}>
            <coneGeometry args={[0.1, 0.3, 6]} />
            <meshStandardMaterial color="#f5c6a0" roughness={0.4} side={DoubleSide} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshStandardMaterial color="#f0d9b5" roughness={0.3} />
      </mesh>
    </group>
  );
};

// ==================== 休息的天鹅 ====================
const RestingSwan: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.elapsedTime;
      // 水波浮动
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0] * 0.5) * 0.1;
      // 轻微摇摆
      groupRef.current.rotation.z = Math.sin(t * 0.8 + position[2] * 0.3) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <SwanModel />
    </group>
  );
};

// ==================== 飞翔的天鹅 ====================
const FlyingSwan: React.FC<{ center: [number, number, number]; radius: [number, number]; speed: number; offset: number }> = ({
  center,
  radius,
  speed,
  offset,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.elapsedTime * speed + offset;
    // 椭圆轨迹：x = center[0] + radius[0] * cos(t)，z = center[2] + radius[1] * sin(t)
    const x = center[0] + radius[0] * Math.cos(t);
    const z = center[2] + radius[1] * Math.sin(t);
    // 高度在 Y 轴上轻微变化，模拟翱翔
    const y = center[1] + Math.sin(t * 2) * 1.5;
    groupRef.current.position.set(x, y, z);
    // 天鹅朝向运动方向（切线方向）
    const dx = -radius[0] * Math.sin(t);
    const dz = radius[1] * Math.cos(t);
    groupRef.current.rotation.y = Math.atan2(dx, dz);
  });

  return (
    <group ref={groupRef}>
      <SwanModel flying scale={1.2} />
    </group>
  );
};

// ==================== 漂浮莲花 ====================
const FloatingLotus: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.elapsedTime;
      groupRef.current.position.y = position[1] + Math.sin(t * 1.2 + position[0] * 0.7) * 0.08;
      groupRef.current.rotation.z = Math.sin(t * 0.6 + position[2] * 0.5) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <LotusModel scale={0.6} />
    </group>
  );
};

// ==================== 全局场景 ====================
interface ZenSceneProps {
  timeMode?: 'day' | 'dusk' | 'night';
}

const ZenScene: React.FC<ZenSceneProps> = ({ timeMode = 'night' }) => {
  const isDay = timeMode === 'day';
  const isDusk = timeMode === 'dusk';

  const ambientColor = isDay ? '#fffbeb' : isDusk ? '#fed7aa' : '#b0c4de';
  const ambientIntensity = isDay ? 0.85 : isDusk ? 0.7 : 0.45;

  const dirColor = isDay ? '#fef3c7' : isDusk ? '#f97316' : '#e0e8ff';
  const dirIntensity = isDay ? 1.4 : isDusk ? 1.2 : 0.85;

  return (
    <>
      {/* 动态光照 */}
      <ambientLight intensity={ambientIntensity} color={ambientColor} />
      <directionalLight
        position={[20, 30, 10]}
        intensity={dirIntensity}
        color={dirColor}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />

      {/* 3D 水面（与 2D 天空水流融为一体） */}
      <WaterSurface timeMode={timeMode} />

      {/* 3D 河岸 */}
      <RiverBank timeMode={timeMode} />

      {/* 3D 亭子 */}
      <Pavilion />

      {/* 休息的天鹅（3只） */}
      <RestingSwan position={[-8, -0.2, 3]} />
      <RestingSwan position={[-12, -0.2, -2]} />
      <RestingSwan position={[-10, -0.2, -5]} />

      {/* 飞翔的天鹅（2只，椭圆轨迹围绕亭子与天空翱翔） */}
      <FlyingSwan center={[5, 6, 0]} radius={[20, 15]} speed={0.3} offset={0} />
      <FlyingSwan center={[5, 8, 0]} radius={[25, 18]} speed={0.25} offset={Math.PI / 2} />

      {/* 漂浮莲花（散布靠近亭子的水域） */}
      <FloatingLotus position={[6, -0.2, 2]} />
      <FloatingLotus position={[7, -0.2, -1]} />
      <FloatingLotus position={[5.5, -0.2, -3]} />
      <FloatingLotus position={[8, -0.2, 1.5]} />
      <FloatingLotus position={[9, -0.2, -2]} />
      <FloatingLotus position={[6.8, -0.2, 0]} />

      {/* 灵性微光粒子 */}
      <Sparkles count={50} scale={20} size={1.5} speed={0.2} color="#f5e6c8" opacity={0.6} />
    </>
  );
};

// ==================== 默认导出组件 ====================
export interface LoginZenSceneProps {
  timeMode?: 'day' | 'dusk' | 'night';
}

const LoginZenScene: React.FC<LoginZenSceneProps> = ({ timeMode = 'night' }) => {
  return (
    <Canvas
      shadows
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 8, 25], fov: 45, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <ZenScene timeMode={timeMode} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 3.5}
          minAzimuthAngle={-Math.PI / 5}
          maxAzimuthAngle={Math.PI / 5}
          target={[0, 1, 0]}
        />
      </Suspense>
    </Canvas>
  );
};

export default LoginZenScene;
