// LoginZenScene.tsx
'use client';

import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { MathUtils } from 'three';

// ==================== 安全的 GLTF 加载 Hook ====================
function useSafeGLTF(url: string): THREE.Group | null {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const gltf = await (useGLTF as any).preload?.(url);
        if (!cancelled && gltf?.scene) {
          const clonedScene = gltf.scene.clone(true);
          setScene(clonedScene);
        } else if (!cancelled) {
          setError(true);
        }
      } catch (e) {
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

// ==================== 时间状态类型 ====================
export type TimeOfDay = 'day' | 'dusk' | 'night';

export interface LoginZenSceneProps {
  timeOfDay?: TimeOfDay;
  timeMode?: TimeOfDay;
}

// ==================== 场景光照控制器 ====================
const SceneLighting: React.FC<{ timeOfDay: TimeOfDay }> = ({ timeOfDay }) => {
  const { scene } = useThree();
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  // 各时间段的目标光照参数
  const targets = useMemo(() => {
    const map = {
      day: {
        ambientColor: new THREE.Color('#a0b8d0'),
        ambientIntensity: 0.6,
        dirColor: new THREE.Color('#fff4e6'),
        dirIntensity: 1.2,
        fogColor: new THREE.Color('#b0c4de'),
      },
      dusk: {
        ambientColor: new THREE.Color('#8a6d8a'),
        ambientIntensity: 0.4,
        dirColor: new THREE.Color('#ffb56b'),
        dirIntensity: 0.8,
        fogColor: new THREE.Color('#5a4a6a'),
      },
      night: {
        ambientColor: new THREE.Color('#1a2a3a'),
        ambientIntensity: 0.3,
        dirColor: new THREE.Color('#8899bb'),
        dirIntensity: 0.4,
        fogColor: new THREE.Color('#0a1628'),
      },
    };
    return map[timeOfDay];
  }, [timeOfDay]);

  // 当前实际值（用于平滑过渡）
  const current = useRef({
    ambientColor: new THREE.Color('#ffffff'),
    ambientIntensity: 0.5,
    dirColor: new THREE.Color('#ffffff'),
    dirIntensity: 0.8,
    fogColor: new THREE.Color('#000000'),
  });

  useFrame((_, delta) => {
    // 每帧向目标值插值（lerp），实现平滑过渡
    const t = Math.min(delta * 2, 1);

    const amb = current.current.ambientColor;
    amb.lerp(targets.ambientColor, t);
    current.current.ambientIntensity = MathUtils.lerp(
      current.current.ambientIntensity,
      targets.ambientIntensity,
      t
    );
    current.current.dirColor.lerp(targets.dirColor, t);
    current.current.dirIntensity = MathUtils.lerp(
      current.current.dirIntensity,
      targets.dirIntensity,
      t
    );
    current.current.fogColor.lerp(targets.fogColor, t);

    if (ambientRef.current) {
      ambientRef.current.color.copy(amb);
      ambientRef.current.intensity = current.current.ambientIntensity;
    }
    if (dirLightRef.current) {
      dirLightRef.current.color.copy(current.current.dirColor);
      dirLightRef.current.intensity = current.current.dirIntensity;
    }
    if (scene.fog) {
      (scene.fog as THREE.Fog).color.copy(current.current.fogColor);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} />
      <directionalLight
        ref={dirLightRef}
        position={[20, 30, 10]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
    </>
  );
};

// ==================== 水面组件 ====================
const WaterSurface: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const normalMap = useMemo(() => {
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

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0a1e2f',
        metalness: 0.3,
        roughness: 0.3,
        normalMap: normalMap,
        normalScale: new THREE.Vector2(0.3, 0.3),
        side: THREE.DoubleSide,
      }),
    [normalMap]
  );

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.2) * 0.01;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} material={material}>
      <planeGeometry args={[120, 120, 100, 100]} />
    </mesh>
  );
};

// ==================== 河岸地形组件 ====================
const RiverBank: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(40, 25, 60, 40);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      let height = 0;
      if (x > -5) {
        height = Math.sin(x * 0.5) * 0.8 + Math.cos(y * 0.7) * 0.5;
        height = Math.max(0, height);
      }
      pos.setZ(i, height);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#4a5d3a',
        roughness: 0.9,
        metalness: 0.1,
      }),
    []
  );

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[15, 0, -10]}
      geometry={geometry}
      material={material}
      receiveShadow
    />
  );
};

// ==================== 远山组件 ====================
const DistantMountains: React.FC<{ timeOfDay: TimeOfDay }> = ({ timeOfDay }) => {
  const groupRef = useRef<THREE.Group>(null);

  const color = useMemo(() => {
    const map: Record<TimeOfDay, string> = {
      day: '#5a7a6a',
      dusk: '#6a4a5a',
      night: '#1a2a3a',
    };
    return map[timeOfDay];
  }, [timeOfDay]);

  const mountains = useMemo(() => {
    const arr = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      const x = (i - count / 2) * 12 + Math.random() * 5;
      const z = -80 - Math.random() * 60;
      const height = 15 + Math.random() * 25;
      const radius = 8 + Math.random() * 10;
      arr.push({ x, z, height, radius });
    }
    return arr;
  }, []);

  return (
    <group ref={groupRef}>
      {mountains.map((m, i) => (
        <mesh key={i} position={[m.x, m.height / 2 - 2, m.z]} castShadow receiveShadow>
          <coneGeometry args={[m.radius, m.height, 5]} />
          <meshStandardMaterial color={color} roughness={0.8} metalness={0.1} flatShading />
        </mesh>
      ))}
    </group>
  );
};

// ==================== 灯笼组件 ====================
const Lantern: React.FC<{ position: [number, number, number]; timeOfDay: TimeOfDay }> = ({
  position,
  timeOfDay,
}) => {
  const lightRef = useRef<THREE.PointLight>(null);
  const emissiveIntensity = timeOfDay === 'night' ? 2.5 : 0.2;

  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial
          color="#cc3300"
          roughness={0.5}
          emissive="#ff5500"
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.2, 8]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.2, 8]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      {timeOfDay === 'night' && (
        <pointLight ref={lightRef} color="#ffaa00" intensity={2} distance={15} decay={2} position={[0, 0, 0.5]} />
      )}
    </group>
  );
};

// ==================== 亭子组件（含灯笼） ====================
const PavilionWithLanterns: React.FC<{ timeOfDay: TimeOfDay }> = ({ timeOfDay }) => {
  const model = useSafeGLTF('/models/pavilion.glb');
  const [lightIntensity, setLightIntensity] = useState(0.8);

  useFrame(({ clock }) => {
    setLightIntensity(0.7 + Math.sin(clock.elapsedTime * 0.5) * 0.3);
  });

  const lanternPositions = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * 2.5;
      const z = Math.sin(angle) * 2.5;
      arr.push([x, 3.5, z]);
    }
    return arr;
  }, []);

  return (
    <group position={[12, 0.2, -35]} scale={2.2} rotation={[0, Math.PI / 4, 0]}>
      {model ? (
        <primitive object={model} />
      ) : (
        <>
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[2, 2.5, 0.3, 6]} />
            <meshStandardMaterial color="#5c4033" roughness={0.8} />
          </mesh>
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
          {[1.5, 2.0].map((y, idx) => (
            <mesh key={idx} position={[0, 2.8 + idx * 0.8, 0]} castShadow>
              <coneGeometry args={[2.5 - idx * 0.4, 1.2, 6]} />
              <meshStandardMaterial color={idx === 0 ? '#6b4423' : '#8b5a2b'} roughness={0.6} />
            </mesh>
          ))}
          <mesh position={[0, 3.8, 0]} castShadow>
            <coneGeometry args={[0.3, 0.6, 8]} />
            <meshStandardMaterial color="#b87333" roughness={0.4} />
          </mesh>
        </>
      )}
      <pointLight position={[0, 1.8, 0]} intensity={lightIntensity} color="#FFD28A" distance={8} decay={2} />
      {lanternPositions.map((pos, i) => (
        <Lantern key={i} position={pos} timeOfDay={timeOfDay} />
      ))}
    </group>
  );
};

// ==================== 天鹅模型（容错回退） ====================
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

// ==================== 休息的天鹅 ====================
const RestingSwan: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.elapsedTime;
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0] * 0.5) * 0.1;
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
    const x = center[0] + radius[0] * Math.cos(t);
    const z = center[2] + radius[1] * Math.sin(t);
    const y = center[1] + Math.sin(t * 2) * 1.5;
    groupRef.current.position.set(x, y, z);
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

// ==================== 莲花模型（容错回退） ====================
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

  return (
    <group position={position} scale={scale}>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.15, 0.1, Math.sin(angle) * 0.15]} rotation={[0, angle, 0.2]}>
            <coneGeometry args={[0.1, 0.3, 6]} />
            <meshStandardMaterial color="#f5c6a0" roughness={0.4} side={THREE.DoubleSide} />
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

// ==================== 莲花群落组件 ====================
const LotusCluster: React.FC = () => {
  const lotusPositions = useMemo(() => {
    const arr: [number, number, number][] = [];
    const used = new Set<string>();
    let attempts = 0;
    while (arr.length < 12 && attempts < 100) {
      attempts++;
      const x = Math.random() * 20 - 5;
      const z = Math.random() * 30 - 20;
      const key = `${Math.round(x * 2)},${Math.round(z * 2)}`;
      if (!used.has(key)) {
        used.add(key);
        arr.push([x, -0.2, z]);
      }
    }
    return arr;
  }, []);

  return (
    <group>
      {lotusPositions.map((pos, i) => (
        <FloatingLotus key={i} position={pos} />
      ))}
    </group>
  );
};

// ==================== 锦鲤组件（简单游动） ====================
const KoiFish: React.FC<{ initialPosition: [number, number, number] }> = ({ initialPosition }) => {
  const ref = useRef<THREE.Group>(null);
  const direction = useRef(Math.random() * Math.PI * 2);
  const speed = useRef(0.5 + Math.random() * 0.5);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    direction.current += Math.sin(t * 0.2 + initialPosition[0]) * 0.02;
    const x = initialPosition[0] + Math.sin(t * speed.current + direction.current) * 3;
    const z = initialPosition[2] + Math.cos(t * speed.current + direction.current) * 3;
    ref.current.position.set(x, -0.3 + Math.sin(t * 2 + x) * 0.05, z);
    ref.current.rotation.y = Math.atan2(Math.cos(t * speed.current + direction.current), Math.sin(t * speed.current + direction.current));
  });

  return (
    <group ref={ref}>
      <mesh castShadow>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="#ff9933" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.2, 0.4, 4]} />
        <meshStandardMaterial color="#ff9933" roughness={0.4} />
      </mesh>
    </group>
  );
};

// ==================== 场景内容 ====================
const SceneContent: React.FC<{ timeOfDay: TimeOfDay }> = ({ timeOfDay }) => {
  return (
    <>
      {/* 雾效 */}
      <fog attach="fog" args={['#b0c4de', 10, 120]} />

      {/* 水面 */}
      <WaterSurface />

      {/* 河岸 */}
      <RiverBank />

      {/* 远山 */}
      <DistantMountains timeOfDay={timeOfDay} />

      {/* 亭子（含灯笼） */}
      <PavilionWithLanterns timeOfDay={timeOfDay} />

      {/* 休息的天鹅（3只） */}
      <RestingSwan position={[-8, -0.2, 3]} />
      <RestingSwan position={[-12, -0.2, -2]} />
      <RestingSwan position={[-10, -0.2, -5]} />

      {/* 飞翔的天鹅（2只） */}
      <FlyingSwan center={[5, 6, 0]} radius={[20, 15]} speed={0.3} offset={0} />
      <FlyingSwan center={[5, 8, 0]} radius={[25, 18]} speed={0.25} offset={Math.PI / 2} />

      {/* 莲花群落 */}
      <LotusCluster />

      {/* 锦鲤 */}
      <KoiFish initialPosition={[0, -0.3, 5]} />
      <KoiFish initialPosition={[2, -0.3, 8]} />
      <KoiFish initialPosition={[-2, -0.3, 10]} />

      {/* 少量 Sparkles */}
      <Sparkles count={50} scale={20} size={1.5} speed={0.2} color="#f5e6c8" opacity={0.5} />
    </>
  );
};

// ==================== 默认导出组件 ====================
const LoginZenScene: React.FC<LoginZenSceneProps> = ({ timeOfDay, timeMode }) => {
  const effectiveTime: TimeOfDay = timeOfDay || timeMode || 'day';

  return (
    <Canvas
      shadows
      camera={{ position: [0, 8, 25], fov: 45, near: 0.1, far: 200 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <SceneContent timeOfDay={effectiveTime} />
        <SceneLighting timeOfDay={effectiveTime} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={10}
          maxDistance={80}
          enableZoom={false}
          target={[0, 1, 0]}
        />
      </Suspense>
    </Canvas>
  );
};

export default LoginZenScene;
