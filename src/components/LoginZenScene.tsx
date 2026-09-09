// LoginZenScene.tsx
'use client';

import React, { useRef, useMemo, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { MathUtils } from 'three';
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
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
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
      <planeGeometry args={[180, 180, 100, 100]} />
    </mesh>
  );
};

// ==================== 1. DistantMountains（360° 环形群山） ====================
const DistantMountains: React.FC<{ timeOfDay: TimeOfDay }> = ({ timeOfDay }) => {
  // 根据时间调整山脉颜色
  const color = useMemo(() => {
    const map: Record<TimeOfDay, string> = {
      day: '#5a7a6a',
      dusk: '#6a4a5a',
      night: '#1a2a3a',
    };
    return map[timeOfDay];
  }, [timeOfDay]);

  // 360 度环形山脉数据
  const mountains = useMemo(() => {
    const count = 36;
    const baseRadius = 130;
    const arr: { position: [number, number, number]; scale: [number, number, number]; rotationY: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      // 半径随机偏移，使山脉不在完美圆上
      const radiusOffset = (Math.random() - 0.5) * 25;
      const radius = baseRadius + radiusOffset;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // 高度和宽度随机
      const height = 15 + Math.random() * 35;
      const width = 8 + Math.random() * 15;
      // 随机旋转（让圆锥的棱角错落）
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
        <mesh
          key={i}
          position={m.position}
          rotation={[0, m.rotationY, 0]}
          scale={m.scale}
          castShadow
          receiveShadow
        >
          <coneGeometry args={[1, 1, 5]} />
          <meshStandardMaterial
            color={color}
            roughness={0.8}
            metalness={0.1}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
};

// ==================== 2. 有机曲线苔藓半岛（MossyPeninsula，替代原 RiverBank） ====================
const MossyPeninsula: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  // 使用 THREE.Shape 绘制月牙形/S形曲线半岛
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    // 从岸上起点开始（左侧）
    shape.moveTo(-15, 0);
    // 平滑曲线向湖心延伸
    shape.bezierCurveTo(-10, 8, 0, 15, 10, 12);
    shape.bezierCurveTo(15, 10, 18, 5, 15, -2);
    // 回程曲线形成月牙
    shape.bezierCurveTo(12, -8, 5, -12, -5, -10);
    shape.bezierCurveTo(-12, -8, -15, -4, -15, 0);

    // 使用 ExtrudeGeometry 增加厚度
    const extrudeSettings = {
      depth: 0.6,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.3,
      bevelThickness: 0.3,
    };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // 旋转使 shape 在 XZ 平面展开（原本在 XY 平面）
    geom.rotateX(-Math.PI / 2);
    geom.translate(0, 0, 0);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // 湿润苔藓材质
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2d4c1e',
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

// ==================== 3. 灯笼组件（保持时间联动） ====================
interface LanternProps {
  position: [number, number, number];
  timeOfDay: TimeOfDay;
}

const Lantern: React.FC<LanternProps> = ({ position, timeOfDay }) => {
  const emissiveIntensity = timeOfDay === 'night' ? 2.5 : 0.2;

  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial
          color="#cc3300"
          roughness={0.5}
          emissive="#ff5500"
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.15, 8]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      <mesh position={[0, -0.35, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.15, 8]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
      {timeOfDay === 'night' && (
        <pointLight color="#ffaa00" intensity={2} distance={15} decay={2} position={[0, 0, 0.5]} />
      )}
    </group>
  );
};

// ==================== 4. PavilionWithLanterns（八角双层重檐亭） ====================
interface PavilionWithLanternsProps {
  timeOfDay: TimeOfDay;
}

const PavilionWithLanterns: React.FC<PavilionWithLanternsProps> = ({ timeOfDay }) => {
  const model = useSafeGLTF('/models/pavilion.glb');
  const [lightIntensity, setLightIntensity] = useState(0.8);

  useFrame(({ clock }) => {
    setLightIntensity(0.7 + Math.sin(clock.elapsedTime * 0.5) * 0.3);
  });

  // 八角灯笼位置（精确挂在飞檐角上）
  const lanternPositions = useMemo(() => {
    const arr: [number, number, number][] = [];
    const count = 8;
    const radius = 2.2; // 飞檐半径
    const y = 3.6; // 飞檐下方适当高度
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      arr.push([x, y, z]);
    }
    return arr;
  }, []);

  if (model) {
    return (
      <group position={[12, 0.2, -35]} scale={2.2} rotation={[0, Math.PI / 4, 0]}>
        <primitive object={model} castShadow receiveShadow />
        {/* 内部常明灯 */}
        <pointLight position={[0, 2, 0]} intensity={lightIntensity} color="#FFD28A" distance={10} decay={2} castShadow />
        {/* 灯笼（仍手动添加，因为 GLTF 可能不含灯笼点光源） */}
        {lanternPositions.map((pos, i) => (
          <Lantern key={i} position={pos} timeOfDay={timeOfDay} />
        ))}
      </group>
    );
  }

  // 回退：程序化八角双层重檐亭
  return (
    <group position={[12, 0.2, -35]} scale={2.2} rotation={[0, Math.PI / 8, 0]}>
      {/* 基座：八边形 */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.4, 2.8, 0.4, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.7} />
      </mesh>

      {/* 八根立柱 */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 1.9;
        const z = Math.sin(angle) * 1.9;
        return (
          <mesh key={i} position={[x, 1.5, z]} castShadow receiveShadow>
            <cylinderGeometry args={[0.12, 0.18, 3, 8]} />
            <meshStandardMaterial color="#7a5a3a" roughness={0.6} />
          </mesh>
        );
      })}

      {/* 第一层屋檐（下层） */}
      <mesh position={[0, 3.0, 0]} castShadow receiveShadow>
        <coneGeometry args={[2.8, 0.8, 8]} />
        <meshStandardMaterial color="#6b4423" roughness={0.5} flatShading />
      </mesh>
      {/* 第二层屋檐（上层，较小） */}
      <mesh position={[0, 4.0, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.8, 1.0, 8]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.4} flatShading />
      </mesh>
      {/* 宝顶 */}
      <mesh position={[0, 4.8, 0]} castShadow>
        <coneGeometry args={[0.4, 0.8, 8]} />
        <meshStandardMaterial color="#b87333" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* 内部常明灯 */}
      <pointLight position={[0, 2.2, 0]} intensity={lightIntensity} color="#FFD28A" distance={10} decay={2} castShadow />

      {/* 灯笼 */}
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
      {/* 雾效：配合 360° 环形山脉范围设置 */}
      <fog attach="fog" args={['#b0c4de', 20, 200]} />

      {/* 水面 */}
      <WaterSurface />

      {/* 有机曲线苔藓半岛 */}
      <MossyPeninsula />

      {/* 五树环绕（菩提树、高榕、贝叶棕、槟榔树、糖棕） */}
      <SacredTrees />

      {/* 六花浮水（莲花、文殊兰、黄姜花、鸡蛋花、缅桂花、地涌金莲） */}
      <SacredFlowers />

      {/* 360° 环形群山 */}
      <DistantMountains timeOfDay={timeOfDay} />

      {/* 八角双层重檐亭（含八角挂灯） */}
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
      camera={{ position: [0, 8, 25], fov: 45, near: 0.1, far: 300 }}
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
          maxDistance={120}
          enableZoom={false}
          target={[0, 1, 0]}
        />
      </Suspense>
    </Canvas>
  );
};

export default LoginZenScene;
