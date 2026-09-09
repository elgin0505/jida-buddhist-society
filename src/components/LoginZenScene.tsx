// LoginZenScene.tsx
'use client';

import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Sparkles,
  BakeShadows,
  Line,
  useGLTF,
  MeshReflectorMaterial,
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  Vignette,
} from '@react-three/postprocessing';
import * as THREE from 'three';
import { MathUtils } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import SacredTrees from './SacredTrees';
import SacredFlowers from './SacredFlowers';

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
      } catch {
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
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  const targets = useMemo(() => {
    const map = {
      day: {
        ambientColor: new THREE.Color('#ffffff'),
        ambientIntensity: 1.25, // 充盈阳光
        dirColor: new THREE.Color('#fff9eb'),
        dirIntensity: 2.8, // 充足日光
      },
      dusk: {
        ambientColor: new THREE.Color('#fff0e0'),
        ambientIntensity: 1.1, // 暖金霞光，明亮通透
        dirColor: new THREE.Color('#ffa85c'),
        dirIntensity: 2.5, // 灿烂落日
      },
      night: {
        ambientColor: new THREE.Color('#1a2a3a'),
        ambientIntensity: 0.45,
        dirColor: new THREE.Color('#8899bb'),
        dirIntensity: 0.8,
      },
    };
    return map[timeOfDay];
  }, [timeOfDay]);

  const current = useRef({
    ambientColor: new THREE.Color('#ffffff'),
    ambientIntensity: 0.5,
    dirColor: new THREE.Color('#ffffff'),
    dirIntensity: 1.0,
  });

  useFrame((_, delta) => {
    const t = Math.min(delta * 2, 1);
    current.current.ambientColor.lerp(targets.ambientColor, t);
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

    if (ambientRef.current) {
      ambientRef.current.color.copy(current.current.ambientColor);
      ambientRef.current.intensity = current.current.ambientIntensity;
    }
    if (dirLightRef.current) {
      dirLightRef.current.color.copy(current.current.dirColor);
      dirLightRef.current.intensity = current.current.dirIntensity;
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} />
      <directionalLight
        ref={dirLightRef}
        position={[20, 30, 10]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.0005}
      />
    </>
  );
};

// ==================== 动态环境雾组件 ====================
const DynamicFog: React.FC<{ timeOfDay: TimeOfDay }> = ({ timeOfDay }) => {
  const { scene } = useThree();

  // 各时段雾参数：颜色与近远端（推至远方，保持主体与天空超高通透感）
  const targets = useMemo(() => {
    const map = {
      day: { color: new THREE.Color('#cceeff'), near: 150, far: 450 }, // 极远清亮天蓝
      dusk: { color: new THREE.Color('#fed7aa'), near: 140, far: 400 }, // 极远暖金晚霞
      night: { color: new THREE.Color('#0f172a'), near: 100, far: 260 }, // 深蓝夜雾
    };
    return map[timeOfDay];
  }, [timeOfDay]);

  // 当前值（平滑过渡用）
  const current = useRef({
    color: new THREE.Color('#cceeff'),
    near: 150,
    far: 450,
  });

  useFrame((_, delta) => {
    const t = Math.min(delta * 1.5, 1);
    current.current.color.lerp(targets.color, t);
    current.current.near = MathUtils.lerp(current.current.near, targets.near, t);
    current.current.far = MathUtils.lerp(current.current.far, targets.far, t);

    if (scene.fog) {
      const fog = scene.fog as THREE.Fog;
      fog.color.copy(current.current.color);
      fog.near = current.current.near;
      fog.far = current.current.far;
    }
  });

  useEffect(() => {
    if (!scene.fog) {
      scene.fog = new THREE.Fog('#cceeff', 150, 450);
    }
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  return null;
};

// ==================== 昼夜粒子特效（Sparkles） ====================
const AtmosphereParticles: React.FC<{ timeOfDay: TimeOfDay }> = ({ timeOfDay }) => {
  const isNight = timeOfDay === 'night';
  const isDusk = timeOfDay === 'dusk';

  return (
    <Sparkles
      count={isNight ? 90 : isDusk ? 60 : 45}
      scale={isNight ? 22 : 30}
      size={isNight ? 1.8 : 2.2}
      speed={isNight ? 0.35 : 0.5}
      color={isNight ? '#FFD700' : isDusk ? '#FFA07A' : '#B8D4A0'}
      opacity={isNight ? 0.75 : 0.45}
      position={isNight ? [5, 1.5, -12] : [8, 5, -15]}
    />
  );
};



// ==================== 真实水面组件（镜像反射） ====================
const WaterSurface: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    // 轻微晃动模拟水波
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.2) * 0.01;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[140, 140]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={40}
        roughness={0.1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#0077b6"      // 清澈湖蓝
        metalness={0.5}
        mirror={0.5}         // 反射强度
      />
    </mesh>
  );
};

// ==================== 360° 环形群山 ====================
const DistantMountains: React.FC<{ timeOfDay: TimeOfDay }> = ({ timeOfDay }) => {
  // 明丽清透山峦色彩：白天鲜亮翡翠绿，黄昏落霞暖金，夜晚静谧黛青
  const color = useMemo(() => {
    const map: Record<TimeOfDay, string> = {
      day: '#38a169', // 鲜亮翡翠绿
      dusk: '#c05621', // 温暖晚霞金赭
      night: '#1e293b', // 静谧黛青
    };
    return map[timeOfDay];
  }, [timeOfDay]);

  const mountains = useMemo(() => {
    const count = 36;
    const baseRadius = 130;
    const arr: { position: [number, number, number]; scale: [number, number, number]; rotationY: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = baseRadius + (Math.random() - 0.5) * 25;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = 15 + Math.random() * 35;
      const width = 8 + Math.random() * 15;
      const rotationY = Math.random() * Math.PI * 2;
      arr.push({
        position: [x, height / 2 - 5, z],
        scale: [width, height, width],
        rotationY,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {mountains.map((m, i) => (
        <mesh key={i} position={m.position} rotation={[0, m.rotationY, 0]} scale={m.scale} castShadow receiveShadow>
          <coneGeometry args={[1, 1, 5]} />
          <meshStandardMaterial
            color={color}
            roughness={0.9} // 磨砂质感
            metalness={0.05} // 轻微金属，避免塑料感
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
};

// ==================== 有机曲线苔藓半岛 ====================
const MossyPeninsula: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-15, 0);
    shape.bezierCurveTo(-10, 8, 0, 15, 10, 12);
    shape.bezierCurveTo(15, 10, 18, 5, 15, -2);
    shape.bezierCurveTo(12, -8, 5, -12, -5, -10);
    shape.bezierCurveTo(-12, -8, -15, -4, -15, 0);

    const extrudeSettings = {
      depth: 0.6,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.3,
      bevelThickness: 0.3,
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(-Math.PI / 2);
    geom.computeVertexNormals();
    return geom;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2b471c',
        roughness: 0.55,
        metalness: 0.05,
      }),
    []
  );

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[5, -0.5, -15]}
      rotation={[0, -Math.PI / 3, 0]}
      receiveShadow
      castShadow
    />
  );
};

// ==================== 檐角挂灯 ====================
interface LanternProps {
  position: [number, number, number];
  timeOfDay: TimeOfDay;
}

const Lantern: React.FC<LanternProps> = ({ position, timeOfDay }) => {
  const emissiveIntensity = timeOfDay === 'night' ? 2.6 : timeOfDay === 'dusk' ? 1.5 : 0.3;

  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial
          color="#d9381e"
          roughness={0.4}
          emissive="#ff5500"
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.15, 8]} />
        <meshStandardMaterial color="#6a3511" />
      </mesh>
      <mesh position={[0, -0.35, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.15, 8]} />
        <meshStandardMaterial color="#6a3511" />
      </mesh>
      {timeOfDay === 'night' && (
        <pointLight color="#ffaa33" intensity={2.2} distance={14} decay={2} position={[0, 0, 0.4]} />
      )}
    </group>
  );
};

// ==================== 八角双层重檐亭 ====================
interface PavilionWithLanternsProps {
  timeOfDay: TimeOfDay;
}

const PavilionWithLanterns: React.FC<PavilionWithLanternsProps> = ({ timeOfDay }) => {
  const model = useSafeGLTF('/models/pavilion.glb');
  const [lightIntensity, setLightIntensity] = useState(0.8);

  useFrame(({ clock }) => {
    setLightIntensity(0.7 + Math.sin(clock.elapsedTime * 0.5) * 0.3);
  });

  // 灯笼位置（保持不变）
  const lanternPositions = useMemo(() => {
    const arr: [number, number, number][] = [];
    const count = 8;
    const radius = 2.2;
    const y = 3.6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      arr.push([Math.cos(angle) * radius, y, Math.sin(angle) * radius]);
    }
    return arr;
  }, []);

  // 如果是 GLTF 模型，遍历并覆盖材质
  useEffect(() => {
    if (model) {
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          // 根据名称判断屋顶（包含 roof / 瓦 / 顶 等关键词）
          const name = mesh.name.toLowerCase();
          const isRoof = name.includes('roof') || name.includes('瓦') || name.includes('顶');
          const material = new THREE.MeshStandardMaterial({
            color: isRoof ? '#2F4F4F' : '#FFD700', // 屋顶深瓦灰，主体鎏金
            metalness: isRoof ? 0.1 : 0.6,
            roughness: isRoof ? 0.8 : 0.3,
          });
          mesh.material = material;
        }
      });
    }
  }, [model]);

  // 程序化回退亭子的材质参数（直接修改）
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FFD700',
        metalness: 0.6,
        roughness: 0.3,
      }),
    []
  );

  const roofMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2F4F4F',
        metalness: 0.1,
        roughness: 0.8,
      }),
    []
  );

  if (model) {
    return (
      <group position={[12, 0.2, -35]} scale={2.2} rotation={[0, Math.PI / 4, 0]}>
        <primitive object={model} castShadow receiveShadow />
        <pointLight position={[0, 2, 0]} intensity={lightIntensity} color="#FFD28A" distance={10} decay={2} castShadow />
        {lanternPositions.map((pos, i) => (
          <Lantern key={i} position={pos} timeOfDay={timeOfDay} />
        ))}
      </group>
    );
  }

  // 程序化回退：八角双层重檐亭（仅材质更新，形状位置不变）
  return (
    <group position={[12, 0.2, -35]} scale={2.2} rotation={[0, Math.PI / 8, 0]}>
      {/* 基座：八角形，主体金色 */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.4, 2.8, 0.4, 8]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      {/* 八根立柱：金色 */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 1.9;
        const z = Math.sin(angle) * 1.9;
        return (
          <mesh key={i} position={[x, 1.5, z]} castShadow receiveShadow>
            <cylinderGeometry args={[0.12, 0.18, 3, 8]} />
            <primitive object={bodyMaterial} attach="material" />
          </mesh>
        );
      })}

      {/* 第一层屋檐（下层）：深瓦灰 */}
      <mesh position={[0, 3.0, 0]} castShadow receiveShadow>
        <coneGeometry args={[2.8, 0.8, 8]} />
        <primitive object={roofMaterial} attach="material" />
      </mesh>

      {/* 第二层屋檐（上层）：深瓦灰 */}
      <mesh position={[0, 4.0, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.8, 1.0, 8]} />
        <primitive object={roofMaterial} attach="material" />
      </mesh>

      {/* 宝顶：金色 */}
      <mesh position={[0, 4.8, 0]} castShadow>
        <coneGeometry args={[0.4, 0.8, 8]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>

      {/* 内部常明灯（保持不变） */}
      <pointLight position={[0, 2.2, 0]} intensity={lightIntensity} color="#FFD28A" distance={10} decay={2} castShadow />

      {/* 灯笼（保持不变） */}
      {lanternPositions.map((pos, i) => (
        <Lantern key={i} position={pos} timeOfDay={timeOfDay} />
      ))}
    </group>
  );
};

// ==================== 天鹅模型 ====================
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
        <meshStandardMaterial color="#f2f2f2" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.5, -0.3]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 1.2, 6]} />
        <meshStandardMaterial color="#f2f2f2" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.9, -0.5]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#f2f2f2" roughness={0.4} />
      </mesh>
      {flying && (
        <mesh position={[0, 0.2, 0.8]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.8, 0.05, 0.4]} />
          <meshStandardMaterial color="#e5e5e5" />
        </mesh>
      )}
    </group>
  );
};

const RestingSwan: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const t = clock.elapsedTime;
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5 + position[0] * 0.5) * 0.08;
      groupRef.current.rotation.z = Math.sin(t * 0.8 + position[2] * 0.3) * 0.04;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <SwanModel />
    </group>
  );
};

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

// ==================== 锦鲤组件 ====================
const KoiFish: React.FC<{ initialPosition: [number, number, number] }> = ({ initialPosition }) => {
  const ref = useRef<THREE.Group>(null);
  const direction = useRef(Math.random() * Math.PI * 2);
  const speed = useRef(0.4 + Math.random() * 0.4);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    direction.current += Math.sin(t * 0.2 + initialPosition[0]) * 0.02;
    const x = initialPosition[0] + Math.sin(t * speed.current + direction.current) * 3;
    const z = initialPosition[2] + Math.cos(t * speed.current + direction.current) * 3;
    ref.current.position.set(x, -0.3 + Math.sin(t * 2 + x) * 0.05, z);
    ref.current.rotation.y = Math.atan2(
      Math.cos(t * speed.current + direction.current),
      Math.sin(t * speed.current + direction.current)
    );
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

// ==================== 黄昏飞鸟（人字队列） ====================
const DuskBirds: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (groupRef.current) {
      const x = 70 - ((t * 4) % 150);
      const y = 28 + Math.sin(t * 0.6) * 1.8;
      groupRef.current.position.set(x, y, -55);
      groupRef.current.rotation.z = Math.sin(t * 1.2) * 0.08;
    }
  });

  const birds = Array.from({ length: 6 }, (_, i) => ({
    offsetX: i * 2.0,
    offsetY: Math.abs(i - 2.5) * 0.9,
  }));

  return (
    <group ref={groupRef}>
      {birds.map((bird, i) => (
        <mesh key={i} position={[bird.offsetX, bird.offsetY, 0]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[1.2, 0.08, 0.35]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

// ==================== 夜间微光浮水灯 ====================
const NightWaterLanterns: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const lanterns = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 8; i++) {
      arr.push({
        position: [(Math.random() - 0.5) * 30, -0.15, (Math.random() - 0.5) * 30] as [number, number, number],
        speed: 0.15 + Math.random() * 0.25,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    groupRef.current?.children.forEach((child, index) => {
      const lantern = lanterns[index];
      if (child) {
        child.position.y = -0.15 + Math.sin(t * 1.3 + lantern.offset) * 0.05;
        child.position.z += lantern.speed * 0.015;
        if (child.position.z > 20) child.position.z = -20;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {lanterns.map((lantern, i) => (
        <group key={i} position={lantern.position}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.22, 0.3]} />
            <meshStandardMaterial color="#ffeedd" emissive="#ffaa44" emissiveIntensity={1.4} transparent opacity={0.85} />
          </mesh>
          <pointLight color="#ff8833" intensity={0.6} distance={4} decay={2} position={[0, 0.2, 0]} />
        </group>
      ))}
    </group>
  );
};

// =========================================================================
// ============= 神经元莲花灯几何体构建（参考 media_1788944003877.jpg） =============
// =========================================================================

/**
 * 根据样本图程序化构建水上盛开莲花灯：
 * 1. 外层 10 瓣：宽展深红/朱砂红（#d32f2f），向上展开弧度约 60°
 * 2. 中层 8 瓣：收拢向上的暖红/橘红（#ff5722），弧度约 40°
 * 3. 内层 6 瓣：直立护心金橙色（#ff9800），弧度约 20°
 * 4. 心核烛火：圆锥形明亮暖白/鹅黄色火苗（#fffbe6），内发光核心
 * 5. 底托基座：扁圆暗青绿荷座托底（#2e4a22）
 * 包含完整顶点颜色（vertexColors）与法线，单合并几何体提供极高 InstancedMesh 性能。
 */
function createLotusGeometry(): THREE.BufferGeometry {
  const geoms: THREE.BufferGeometry[] = [];

  function createPetal(
    length: number,
    width: number,
    cupCurve: number,
    tiltOut: number,
    yaw: number,
    colorHex: string
  ): THREE.BufferGeometry {
    const geom = new THREE.PlaneGeometry(width, length, 3, 5);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const ny = (y + length / 2) / length;
      let widthScale = Math.sin(ny * Math.PI);
      if (ny > 0.7) widthScale = ((1 - ny) / 0.3) * Math.sin(0.7 * Math.PI);
      pos.setX(i, x * Math.max(widthScale, 0.08));
      pos.setZ(i, Math.sin(ny * Math.PI) * cupCurve);
    }
    geom.translate(0, length / 2, 0);
    geom.rotateX(tiltOut);
    geom.rotateY(yaw);
    geom.computeVertexNormals();

    const colors = new Float32Array(pos.count * 3);
    const col = new THREE.Color(colorHex);
    for (let i = 0; i < pos.count; i++) {
      const ny = pos.getY(i) / length;
      const factor = 0.85 + 0.35 * Math.min(Math.max(ny, 0), 1);
      colors[i * 3] = Math.min(col.r * factor, 1);
      colors[i * 3 + 1] = Math.min(col.g * factor, 1);
      colors[i * 3 + 2] = Math.min(col.b * factor, 1);
    }
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geom;
  }

  // 第一层：外展大花瓣（10 瓣，深绯红色）
  for (let i = 0; i < 10; i++) {
    const yaw = (i / 10) * Math.PI * 2;
    geoms.push(createPetal(0.85, 0.38, 0.12, 1.05, yaw, '#d32f2f'));
  }

  // 第二层：中层捧心瓣（8 瓣，炽烈橙红色）
  for (let i = 0; i < 8; i++) {
    const yaw = (i / 8) * Math.PI * 2 + 0.314;
    geoms.push(createPetal(0.68, 0.32, 0.1, 0.7, yaw, '#ff5722'));
  }

  // 第三层：内层直立护心瓣（6 瓣，金橙暖色）
  for (let i = 0; i < 6; i++) {
    const yaw = (i / 6) * Math.PI * 2 + 0.15;
    geoms.push(createPetal(0.52, 0.25, 0.08, 0.35, yaw, '#ff9800'));
  }

  // 中心明亮烛火内核
  const flameGeom = new THREE.ConeGeometry(0.12, 0.42, 8);
  flameGeom.translate(0, 0.25, 0);
  flameGeom.computeVertexNormals();
  const flameColors = new Float32Array(flameGeom.attributes.position.count * 3);
  const flameCol = new THREE.Color('#fffbe6');
  for (let i = 0; i < flameGeom.attributes.position.count; i++) {
    flameColors[i * 3] = flameCol.r;
    flameColors[i * 3 + 1] = flameCol.g;
    flameColors[i * 3 + 2] = flameCol.b;
  }
  flameGeom.setAttribute('color', new THREE.BufferAttribute(flameColors, 3));
  geoms.push(flameGeom);

  // 莲座底托（暗青绿荷座）
  const baseGeom = new THREE.CylinderGeometry(0.3, 0.38, 0.08, 8);
  baseGeom.translate(0, 0.03, 0);
  baseGeom.computeVertexNormals();
  const baseColors = new Float32Array(baseGeom.attributes.position.count * 3);
  const baseCol = new THREE.Color('#2e4a22');
  for (let i = 0; i < baseGeom.attributes.position.count; i++) {
    baseColors[i * 3] = baseCol.r;
    baseColors[i * 3 + 1] = baseCol.g;
    baseColors[i * 3 + 2] = baseCol.b;
  }
  baseGeom.setAttribute('color', new THREE.BufferAttribute(baseColors, 3));
  geoms.push(baseGeom);

  const merged = mergeGeometries(geoms, false);
  return merged;
}

// ==================== 神经元莲花灯定义 ====================
export interface NeuronLampData {
  position: [number, number, number];
  role: 'core' | 'member';
  scale: number;
  bobSpeed: number;
  bobPhase: number;
  baseRotY: number;
}

// ==================== 神经元莲花灯群渲染系统 ====================
const NeuronLampSystem: React.FC<{
  lamps: NeuronLampData[];
  timeOfDay: TimeOfDay;
}> = ({ lamps, timeOfDay }) => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const haloMeshRef = useRef<THREE.InstancedMesh>(null);

  const lotusGeometry = useMemo(() => createLotusGeometry(), []);

  // 水面泛光光晕几何体（扁平环形）
  const haloGeometry = useMemo(() => {
    const geom = new THREE.RingGeometry(0.08, 1.35, 16);
    geom.rotateX(-Math.PI / 2);
    return geom;
  }, []);

  const emissiveIntensity = timeOfDay === 'night' ? 1.6 : timeOfDay === 'dusk' ? 1.1 : 0.45;

  const lotusMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.35,
        metalness: 0.08,
        side: THREE.DoubleSide,
        emissive: new THREE.Color('#ff4500'),
        emissiveIntensity: emissiveIntensity,
      }),
    [emissiveIntensity]
  );

  // 水面倒影光晕材质（叠加混合 AdditiveBlending，还原样本图中水面波光涟漪）
  const haloMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ff5500',
        transparent: true,
        opacity: timeOfDay === 'night' ? 0.38 : timeOfDay === 'dusk' ? 0.22 : 0.1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [timeOfDay]
  );

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 动态水波浮动：每帧基于 sine 波更新 InstancedMesh 姿态
  useFrame(({ clock }) => {
    if (!instancedMeshRef.current || !haloMeshRef.current) return;
    const t = clock.elapsedTime;

    for (let i = 0; i < lamps.length; i++) {
      const lamp = lamps[i];
      const bob = Math.sin(t * lamp.bobSpeed + lamp.bobPhase) * 0.04;
      const tilt = Math.cos(t * lamp.bobSpeed * 0.7 + lamp.bobPhase) * 0.025;

      // 更新莲花灯位姿
      dummy.position.set(lamp.position[0], lamp.position[1] + bob, lamp.position[2]);
      dummy.rotation.set(tilt, lamp.baseRotY + Math.sin(t * 0.3 + lamp.bobPhase) * 0.03, tilt * 0.5);
      dummy.scale.setScalar(lamp.scale);
      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);

      // 更新水面倒影光晕位姿（始终贴合水表）
      dummy.position.set(lamp.position[0], -0.19, lamp.position[2]);
      dummy.rotation.set(0, lamp.baseRotY, 0);
      dummy.scale.setScalar(lamp.scale * (1.0 + bob * 0.8));
      dummy.updateMatrix();
      haloMeshRef.current.setMatrixAt(i, dummy.matrix);
    }

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    haloMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  // 核心灯位附近的代表性点光源（为半岛和水面带来真实光影折射）
  const coreLights = useMemo(() => {
    return lamps.filter((l) => l.role === 'core').slice(0, 4);
  }, [lamps]);

  return (
    <group>
      {/* 莲花灯批量渲染 */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[lotusGeometry, lotusMaterial, lamps.length]}
        castShadow
        receiveShadow
      />

      {/* 水面倒影光晕批量渲染 */}
      <instancedMesh
        ref={haloMeshRef}
        args={[haloGeometry, haloMaterial, lamps.length]}
      />

      {/* 核心灯点光源 */}
      {timeOfDay !== 'day' &&
        coreLights.map((light, idx) => (
          <pointLight
            key={idx}
            position={[light.position[0], light.position[1] + 0.45, light.position[2]]}
            color="#ff7722"
            intensity={timeOfDay === 'night' ? 2.0 : 1.0}
            distance={9}
            decay={2}
          />
        ))}
    </group>
  );
};

// ==================== 神经网络连接线（因陀罗网 / 灯线串联） ====================
const NeuralConnections: React.FC<{
  lamps: NeuronLampData[];
  timeOfDay: TimeOfDay;
}> = ({ lamps, timeOfDay }) => {
  const linesGroup = useRef<THREE.Group>(null);

  // 为每盏灯寻找最近邻居节点，生成高空抛物弧线
  const lines = useMemo(() => {
    const lineList: { points: [number, number, number][] }[] = [];
    const connectedPairs = new Set<string>();

    for (let i = 0; i < lamps.length; i++) {
      const lamp = lamps[i];
      const neighbors = lamps
        .map((other, j) => ({
          index: j,
          dist: Math.hypot(other.position[0] - lamp.position[0], other.position[2] - lamp.position[2]),
        }))
        .filter((n) => n.index !== i && n.dist < 22)
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 3);

      for (const n of neighbors) {
        const pairKey = i < n.index ? (i + '-' + n.index) : (n.index + '-' + i);
        if (connectedPairs.has(pairKey)) continue;
        connectedPairs.add(pairKey);

        const p1 = lamp.position;
        const p2 = lamps[n.index].position;
        const dist = n.dist;
        const arcHeight = Math.min(dist * 0.16, 1.8);
        const midY = Math.max(p1[1], p2[1]) + 0.2 + arcHeight;

        // 使用 CatmullRomCurve3 生成平滑弧线
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(p1[0], p1[1] + 0.28, p1[2]),
          new THREE.Vector3((p1[0] + p2[0]) / 2, midY, (p1[2] + p2[2]) / 2),
          new THREE.Vector3(p2[0], p2[1] + 0.28, p2[2]),
        ]);

        const sampledPoints = curve.getPoints(16);
        lineList.push({ points: sampledPoints.map((p) => [p.x, p.y, p.z]) });
      }
    }
    return lineList;
  }, [lamps]);

  const lineColor = timeOfDay === 'night' ? '#ffa855' : timeOfDay === 'dusk' ? '#ffb875' : '#ffc895';
  const lineOpacity = timeOfDay === 'night' ? 0.68 : timeOfDay === 'dusk' ? 0.48 : 0.28;

  return (
    <group ref={linesGroup}>
      {lines.map((line, i) => (
        <Line
          key={i}
          points={line.points}
          color={lineColor}
          lineWidth={1.2}
          transparent
          opacity={lineOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      ))}
    </group>
  );
};

// ==================== 灯网络管理组件（DharmaNet） ====================
const DharmaNet: React.FC<{ timeOfDay: TimeOfDay }> = ({ timeOfDay }) => {
  // 生成核心同修灯群（半岛与水阶沿线）与普通同修灯群（广阔湖面）
  const [lamps] = useState<NeuronLampData[]>(() => {
    const list: NeuronLampData[] = [];

    // 1. 核心灯群（沿苔藓半岛弧形边缘及通往双层重檐亭的水道）
    const coreAnchors: [number, number, number][] = [
      [2.5, -0.16, -10.0],
      [5.2, -0.16, -12.5],
      [7.8, -0.16, -15.2],
      [6.4, -0.16, -18.8],
      [3.8, -0.16, -21.2],
      [0.8, -0.16, -19.5],
      [-2.4, -0.16, -16.2],
      [0.0, -0.16, -12.8],
      [9.5, -0.16, -22.5],
      [11.2, -0.16, -28.5],
    ];

    coreAnchors.forEach((pos, idx) => {
      list.push({
        position: pos,
        role: 'core',
        scale: 1.35,
        bobSpeed: 0.9 + Math.random() * 0.4,
        bobPhase: idx * 0.7,
        baseRotY: (idx / coreAnchors.length) * Math.PI * 2,
      });
    });

    // 2. 广阔水面同修灯群（自然漂浮集群）
    const memberAnchors: [number, number, number][] = [
      // 前方左侧水面
      [-14, -0.18, 5],
      [-9, -0.18, 8],
      [-12, -0.18, 12],
      [-6, -0.18, 14],
      [-4, -0.18, 6],
      [-16, -0.18, -2],
      [-8, -0.18, 0],
      // 前方右侧水面
      [8, -0.18, 6],
      [14, -0.18, 4],
      [11, -0.18, 11],
      [16, -0.18, 9],
      [6, -0.18, 15],
      [18, -0.18, -3],
      // 湖心及纵深散落
      [-19, -0.18, -10],
      [-22, -0.18, 2],
      [21, -0.18, -12],
      [16, -0.18, -18],
      [-7, -0.18, -26],
      [2, -0.18, -28],
      [6, -0.18, -32],
      [-15, -0.18, -20],
      [-21, -0.18, -16],
      [22, -0.18, 2],
      [12, -0.18, 18],
      [-10, -0.18, 18],
    ];

    memberAnchors.forEach((pos, idx) => {
      list.push({
        position: pos,
        role: 'member',
        scale: 0.9 + Math.random() * 0.3,
        bobSpeed: 0.7 + Math.random() * 0.6,
        bobPhase: idx * 0.5 + Math.random(),
        baseRotY: Math.random() * Math.PI * 2,
      });
    });

    return list;
  });

  return (
    <>
      <NeuronLampSystem lamps={lamps} timeOfDay={timeOfDay} />
      <NeuralConnections lamps={lamps} timeOfDay={timeOfDay} />
    </>
  );
};

// ==================== 主场景内容 ====================
const SceneContent: React.FC<{ timeOfDay: TimeOfDay }> = ({ timeOfDay }) => {
  return (
    <>
      {/* 昼夜光照与动态雾 */}
      <SceneLighting timeOfDay={timeOfDay} />
      <DynamicFog timeOfDay={timeOfDay} />

      {/* 涟漪水面与有机苔藓半岛 */}
      <WaterSurface />
      <MossyPeninsula />

      {/* 360° 环形群山 */}
      <DistantMountains timeOfDay={timeOfDay} />

      {/* 八角双层重檐亭与挂灯 */}
      <PavilionWithLanterns timeOfDay={timeOfDay} />

      {/* 南传神圣植物：五树六花 */}
      <SacredTrees />
      <SacredFlowers />

      {/* 天鹅与锦鲤生态 */}
      <RestingSwan position={[-8, -0.2, 3]} />
      <RestingSwan position={[-12, -0.2, -2]} />
      <RestingSwan position={[-10, -0.2, -5]} />
      <FlyingSwan center={[5, 6, 0]} radius={[20, 15]} speed={0.3} offset={0} />
      <FlyingSwan center={[5, 8, 0]} radius={[25, 18]} speed={0.25} offset={Math.PI / 2} />
      <KoiFish initialPosition={[0, -0.3, 5]} />
      <KoiFish initialPosition={[2, -0.3, 8]} />
      <KoiFish initialPosition={[-2, -0.3, 10]} />

      {/* 时间段专有飞鸟与水灯 */}
      {timeOfDay === 'dusk' && <DuskBirds />}
      {timeOfDay === 'night' && <NightWaterLanterns />}

      {/* 昼夜粒子特效 */}
      <AtmosphereParticles timeOfDay={timeOfDay} />

      {/* 大脑神经网络 / 因陀罗网灯系统（参考样本莲花灯） */}
      <DharmaNet timeOfDay={timeOfDay} />

      {/* 静态阴影烘焙优化 */}
      <BakeShadows />
    </>
  );
};

// ==================== 电影级后期处理 ====================
const PostProcessingEffects: React.FC<{ timeOfDay: TimeOfDay }> = ({ timeOfDay }) => {
  const isNight = timeOfDay === 'night';
  const isDusk = timeOfDay === 'dusk';

  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      {/* 辉光效果：仅针对高亮发光体（莲花烛火、神经网络光线、亭阁挂灯）产生空灵温润光晕 */}
      <Bloom
        luminanceThreshold={isNight ? 0.35 : isDusk ? 0.6 : 0.85}
        intensity={isNight ? 1.6 : isDusk ? 1.2 : 0.8}
        mipmapBlur
      />
      {/* 白天与黄昏彻底禁用暗角与噪点，保证全画面百分之百通透明亮；夜晚施加轻度柔和暗角 */}
      {isNight && <Vignette eskil={false} offset={0.15} darkness={0.35} />}
    </EffectComposer>
  );
};

// ==================== 默认导出根组件 ====================
const LoginZenScene: React.FC<LoginZenSceneProps> = ({ timeOfDay, timeMode }) => {
  const effectiveTime: TimeOfDay = timeOfDay || timeMode || 'day';

  return (
    <Canvas
      shadows
      camera={{ position: [0, 8, 25], fov: 45, near: 0.1, far: 300 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <SceneContent timeOfDay={effectiveTime} />
        <PostProcessingEffects timeOfDay={effectiveTime} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          enableRotate={true}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={26.25}
          maxDistance={26.25}
          target={[0, 1, 0]}
        />
      </Suspense>
    </Canvas>
  );
};

export default LoginZenScene;
