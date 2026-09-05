'use client';

import React, {
  useRef, useMemo, useState, useCallback, Suspense, forwardRef
} from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, Sparkles, Stars } from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  ToneMapping,
  HueSaturation,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { BlendFunction } from 'postprocessing';
import {
  MeshPhysicalMaterial,
  PlaneGeometry,
  DoubleSide,
  Vector3,
  AdditiveBlending,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Vector2,
} from 'three';
import * as THREE from 'three';
import ProceduralLamp from './ProceduralLamp';
import Ripple from './Ripple';

// ==================== LampData ====================
export interface LampData {
  id: string;
  userId: string;
  userName: string;
  position: [number, number, number];
  message: string;
  dedications: number;
}

// ==================== 用户身份 Mock ====================
const currentUserId = 'user-me';
const currentUserRole: 'presidency' | 'committee' | 'member' = 'member'; // 可切换测试

// 权限配置
const ROLE_RULES = {
  presidency: { minRadius: 0, maxRadius: 5, message: '主席团请在第一圈放灯' },
  committee: { minRadius: 5, maxRadius: 12, message: '此为核心区域，请在第二圈放灯' },
  member: { minRadius: 12, maxRadius: 25, message: '学员请在外围灯海放灯' },
};

// ==================== 放置爆发环 ====================
const PlacementBurst: React.FC<{ position: [number, number, number]; onComplete: () => void }> = ({
  position, onComplete,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<MeshBasicMaterial>(null);
  const t0 = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (t0.current === null) t0.current = clock.elapsedTime;
    const p = (clock.elapsedTime - t0.current) / 1.0;
    if (p >= 1) { onComplete(); return; }
    if (meshRef.current) meshRef.current.scale.set(p * 4, p * 4, 1);
    if (matRef.current) matRef.current.opacity = (1 - p) * 0.9;
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.5, 1, 48]} />
      <meshBasicMaterial
        ref={matRef}
        color="#FBBF24"
        transparent
        opacity={0.9}
        side={DoubleSide}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
};

// ==================== 墨镜水面 ====================
const InkWater: React.FC<{
  size?: number;
  segments?: number;
  onWaterClick?: (point: THREE.Vector3) => void;
  onWaterMove?: (point: THREE.Vector3 | null) => void;
}> = ({ size = 60, segments = 160, onWaterClick, onWaterMove }) => {
  const geoRef = useRef<PlaneGeometry>(null);

  const mat = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: '#020208',
        roughness: 0.04,
        metalness: 0.97,
        side: DoubleSide,
        envMapIntensity: 2.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
        reflectivity: 1,
        emissive: '#080814',
        emissiveIntensity: 0.6,
      }),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const geo = geoRef.current;
    if (!geo) return;
    const pos = geo.attributes.position;
    const arr = pos.array as Float32Array;
    if (!geo.userData.orig) geo.userData.orig = new Float32Array(arr);
    const orig = geo.userData.orig as Float32Array;
    for (let i = 0; i < pos.count; i++) {
      const x = orig[i * 3] * 0.18;
      const y = orig[i * 3 + 1] * 0.18;
      arr[i * 3 + 2] =
        Math.sin(x + t * 0.35) * 0.18 +
        Math.sin(y * 1.4 + t * 0.28) * 0.12 +
        Math.sin((x + y) * 0.65 + t * 0.18) * 0.08 +
        Math.sin((x - y) * 1.1 + t * 0.42) * 0.04;
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      material={mat}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        if (onWaterClick) onWaterClick(e.point);
      }}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        if (onWaterMove) onWaterMove(e.point);
      }}
      onPointerOut={() => {
        if (onWaterMove) onWaterMove(null);
      }}
      receiveShadow
    >
      <planeGeometry ref={geoRef} args={[size, size, segments, segments]} />
    </mesh>
  );
};

// ==================== 墨海月影 ====================
const InkMoon: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.x = Math.sin(clock.elapsedTime * 0.05) * 1.5;
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 18, -20]}>
      <sphereGeometry args={[1.8, 32, 32]} />
      <meshStandardMaterial color="#E8D5A3" emissive="#D4B896" emissiveIntensity={4} roughness={0.3} metalness={0} />
    </mesh>
  );
};

// ==================== 三重同心圆环 ====================
const ConcentricRings: React.FC = () => {
  const ringData = [
    { inner: 0, outer: 5, color: '#FBBF24', opacity: 0.15 },
    { inner: 5, outer: 12, color: '#F59E0B', opacity: 0.1 },
    { inner: 12, outer: 25, color: '#EF4444', opacity: 0.05 },
  ];

  return (
    <group position={[0, -0.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {ringData.map((ring, i) => (
        <mesh key={i}>
          <ringGeometry args={[ring.inner, ring.outer, 128]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={ring.opacity}
            side={DoubleSide}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

// ==================== 悬浮预览光圈 ====================
interface CursorPreviewProps {
  position: [number, number, number] | null;
  allowed: boolean;
}

const CursorPreview: React.FC<CursorPreviewProps> = ({ position, allowed }) => {
  if (!position) return null;
  const color = allowed ? '#FBBF24' : '#EF4444';
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.3, 0.45, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.8}
        side={DoubleSide}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
};

// ==================== 主场景 ====================
const LampScene: React.FC<{
  currentUserName?: string;
  maxLampsPerUser?: number;
  onPlaceLamp?: (pos: [number, number, number]) => void;
  onDedicate?: (lampId: string) => void;
  onLimitReached?: (msg: string) => void;
}> = ({ currentUserName = '我', maxLampsPerUser = 3, onPlaceLamp, onDedicate, onLimitReached }) => {
  const { camera } = useThree();
  const [lamps, setLamps] = useState<LampData[]>([]); // 移除了占位用户

  const [ripples, setRipples] = useState<{ id: string; position: [number, number, number]; color: string }[]>([]);
  const [bursts, setBursts] = useState<{ id: string; position: [number, number, number] }[]>([]);
  
  const [cursorPos, setCursorPos] = useState<[number, number, number] | null>(null);
  const [cursorAllowed, setCursorAllowed] = useState(true);

  const [nearIds, setNearIds] = useState<Set<string>>(new Set());
  const lastUpdateRef = useRef(0);

  // 光源优化
  useFrame(({ clock }) => {
    const now = clock.elapsedTime;
    if (now - lastUpdateRef.current < 0.5) return;
    lastUpdateRef.current = now;
    const sorted = [...lamps]
      .map((l) => ({ id: l.id, d: new Vector3(...l.position).distanceTo(camera.position) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 10).map((x) => x.id);
    setNearIds((prev) => {
      const next = new Set(sorted);
      if (prev.size !== next.size || sorted.some((id) => !prev.has(id))) return next;
      return prev;
    });
  });

  const checkPlacementAllowed = useCallback((distance: number) => {
    const rule = ROLE_RULES[currentUserRole];
    if (distance < rule.minRadius) return { allowed: false, message: rule.message };
    if (distance > rule.maxRadius) return { allowed: false, message: `请勿超过第${currentUserRole === 'member' ? '三' : '二'}圈范围` };
    return { allowed: true };
  }, []);

  const handleWaterClick = useCallback(
    (point: THREE.Vector3) => {
      const distance = Math.hypot(point.x, point.z);
      const { allowed, message } = checkPlacementAllowed(distance);
      if (!allowed) {
        if (onLimitReached) onLimitReached(message || '当前位置不可放灯');
        return;
      }

      if (lamps.filter((l) => l.userId === currentUserId).length >= maxLampsPerUser) {
        if (onLimitReached) onLimitReached('您的三盏祈福心灯已满，请将位置留予同修 🙏');
        return;
      }

      const pos: [number, number, number] = [point.x, 0, point.z];
      const ts = Date.now();
      setLamps((prev) => [...prev, {
        id: `lamp-${ts}`, userId: currentUserId, userName: currentUserName,
        position: pos, message: '新祈愿', dedications: 0,
      }]);
      setBursts((prev) => [...prev, { id: `burst-${ts}`, position: [point.x, 0.1, point.z] }]);
      setRipples((prev) => [
        ...prev,
        { id: `r1-${ts}`, position: [point.x, -0.4, point.z], color: '#F59E0B' },
        { id: `r2-${ts}`, position: [point.x, -0.4, point.z], color: '#FFF8DC' },
      ]);
      if (onPlaceLamp) onPlaceLamp(pos);
      setCursorPos(null); // Click后临时隐藏光圈
    },
    [lamps, currentUserName, maxLampsPerUser, onPlaceLamp, onLimitReached, checkPlacementAllowed]
  );

  const handleWaterMove = useCallback((point: THREE.Vector3 | null) => {
    if (!point) {
      setCursorPos(null);
      return;
    }
    const distance = Math.hypot(point.x, point.z);
    const { allowed } = checkPlacementAllowed(distance);
    setCursorPos([point.x, -0.48, point.z]); // 贴近水面
    setCursorAllowed(allowed);
  }, [checkPlacementAllowed]);

  const handleDedicate = useCallback(
    (lampId: string) => {
      setLamps((prev) =>
        prev.map((l) => (l.id === lampId ? { ...l, dedications: l.dedications + 1 } : l))
      );
      const lamp = lamps.find((l) => l.id === lampId);
      if (lamp) {
        setRipples((prev) => [
          ...prev,
          { id: `rd-${Date.now()}`, position: [lamp.position[0], -0.4, lamp.position[2]], color: '#FFFFFF' },
        ]);
      }
      if (onDedicate) onDedicate(lampId);
    },
    [lamps, onDedicate]
  );

  return (
    <>
      <color attach="background" args={['#020208']} />
      <fogExp2 attach="fog" args={['#04040f', 0.05]} />
      <ambientLight intensity={0.04} color="#1a1040" />
      <hemisphereLight args={['#0d0828', '#000000', 0.2]} />

      <Stars radius={80} depth={50} count={2000} factor={2} saturation={0} fade speed={0.3} />
      
      {/* 光阴小点 */}
      <Sparkles count={300} scale={40} size={2} speed={0.2} color="#FBBF24" opacity={0.6} position={[0, 2, 0]} />

      <Environment preset="night" background={false} environmentIntensity={0.3} />
      <InkMoon />
      <directionalLight position={[0, 20, -18]} intensity={0.6} color="#D4B896" castShadow />

      {/* 三重同心圆环 */}
      <ConcentricRings />

      <InkWater size={60} segments={160} onWaterClick={handleWaterClick} onWaterMove={handleWaterMove} />

      {/* 悬浮预览光圈 */}
      <CursorPreview position={cursorPos} allowed={cursorAllowed} />

      {lamps.map((lamp) => (
        <ProceduralLamp
          key={lamp.id}
          id={lamp.id}
          position={lamp.position}
          userName={lamp.userName}
          lightEnabled={nearIds.has(lamp.id)}
          onDedicate={handleDedicate}
          message={lamp.message}
          dedications={lamp.dedications}
        />
      ))}

      {bursts.map((b) => (
        <PlacementBurst key={b.id} position={b.position} onComplete={() => setBursts((prev) => prev.filter((x) => x.id !== b.id))} />
      ))}
      {ripples.map((r) => (
        <Ripple key={r.id} position={r.position} color={r.color} onComplete={() => setRipples((prev) => prev.filter((x) => x.id !== r.id))} />
      ))}

      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        maxPolarAngle={Math.PI / 2 - 0.04}
        minDistance={1.5}
        maxDistance={25}
        target={[0, 0.2, 0]}
        zoomSpeed={0.6}
        rotateSpeed={0.5}
        zoomToCursor={true}
      />
    </>
  );
};

// ==================== Canvas 封装 ====================
const LotusSeaCanvas: React.FC<{
  currentUserName?: string;
  maxLampsPerUser?: number;
  onPlaceLamp?: (pos: [number, number, number]) => void;
  onDedicate?: (lampId: string) => void;
  onLimitReached?: (msg: string) => void;
}> = (props) => {
  return (
    <Canvas
      shadows
      camera={{ position: [3, 2.5, 4], fov: 50, near: 0.1, far: 200 }}
      dpr={[1, 2]}
      gl={{
        toneMapping: THREE.NoToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
        alpha: false,
        antialias: false,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <LampScene {...props} />

        <EffectComposer disableNormalPass multisampling={0}>
          <ToneMapping
            mode={ToneMappingMode.ACES_FILMIC}
            resolution={256}
            whitePoint={4.0}
            middleGrey={0.6}
            minLuminance={0.01}
            averageLuminance={1.0}
            adaptationRate={1.0}
          />
          <Bloom luminanceThreshold={0.7} luminanceSmoothing={0.3} mipmapBlur intensity={2.0} radius={0.9} levels={9} />
          <HueSaturation hue={0.02} saturation={0.25} blendFunction={BlendFunction.NORMAL} />
          <ChromaticAberration offset={new Vector2(0.0008, 0.0008)} blendFunction={BlendFunction.NORMAL} radialModulation={true} modulationOffset={0.15} />
          <Vignette eskil={false} offset={0.08} darkness={1.3} />
          <Noise opacity={0.025} premultiplied blendFunction={BlendFunction.ADD} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
};

export default LotusSeaCanvas;
