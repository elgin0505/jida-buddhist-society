// src/components/LegoTypographyCollage.tsx
'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionTemplate,
  MotionValue,
} from 'framer-motion';
import { useIsMobile } from '@/hooks/useIsMobile';
import { playSingingBowl } from '@/utils/zenAudio';

// ==================== 世界坐标系常量 ====================
const WORLD_W = 1400;
const WORLD_H = 700;

// 字符布局（"技大佛学会" 5 个字）
const CHAR_W = 200;
const CHAR_GAP = 40;
const TOTAL_TEXT_W = CHAR_W * 5 + CHAR_GAP * 4;
const START_X = (WORLD_W - TOTAL_TEXT_W) / 2;
const CHAR_Y = WORLD_H / 2;

// 计算第 i 个字符的中心 X 坐标
function getCharCenterX(index: number): number {
  return START_X + index * (CHAR_W + CHAR_GAP) + CHAR_W / 2;
}

// 5 大活动映射
const EVENT_LABELS = ['迎新会', '欢乐营', '静修营', '卫塞营', '传承营'];
const BG_OVERLAY =
  'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.92) 100%)';

// ==================== 类型定义 ====================
export interface CollagePhoto {
  id: number;
  src: string;
  charIndex: number;
  indexInChar: number;
  finalX: number;
  finalY: number;
  finalW: number;
  finalH: number;
}

// ==================== 演示数据：四角无缝铺满 200x200 字体方块，绝无空白点 ====================
const DEMO_PHOTOS: CollagePhoto[] = [
  // ---- 技 (charIndex: 0) 4 块拼接无缝填满整个 200x200 ----
  { id: 1, src: 'https://picsum.photos/seed/a1/400/400', charIndex: 0, indexInChar: 0, finalX: -50, finalY: -50, finalW: 104, finalH: 104 },
  { id: 2, src: 'https://picsum.photos/seed/a2/400/400', charIndex: 0, indexInChar: 1, finalX: 50, finalY: -50, finalW: 104, finalH: 104 },
  { id: 3, src: 'https://picsum.photos/seed/a3/400/400', charIndex: 0, indexInChar: 2, finalX: -50, finalY: 50, finalW: 104, finalH: 104 },
  { id: 4, src: 'https://picsum.photos/seed/a4/400/400', charIndex: 0, indexInChar: 3, finalX: 50, finalY: 50, finalW: 104, finalH: 104 },

  // ---- 大 (charIndex: 1) 4 块拼接无缝填满 ----
  { id: 5, src: 'https://picsum.photos/seed/b1/400/400', charIndex: 1, indexInChar: 0, finalX: -50, finalY: -50, finalW: 104, finalH: 104 },
  { id: 6, src: 'https://picsum.photos/seed/b2/400/400', charIndex: 1, indexInChar: 1, finalX: 50, finalY: -50, finalW: 104, finalH: 104 },
  { id: 7, src: 'https://picsum.photos/seed/b3/400/400', charIndex: 1, indexInChar: 2, finalX: -50, finalY: 50, finalW: 104, finalH: 104 },
  { id: 8, src: 'https://picsum.photos/seed/b4/400/400', charIndex: 1, indexInChar: 3, finalX: 50, finalY: 50, finalW: 104, finalH: 104 },

  // ---- 佛 (charIndex: 2) 5 块拼接无缝填满 ----
  { id: 9, src: 'https://picsum.photos/seed/c1/400/400', charIndex: 2, indexInChar: 0, finalX: -50, finalY: -50, finalW: 104, finalH: 104 },
  { id: 10, src: 'https://picsum.photos/seed/c2/400/400', charIndex: 2, indexInChar: 1, finalX: 50, finalY: -50, finalW: 104, finalH: 104 },
  { id: 11, src: 'https://picsum.photos/seed/c3/400/400', charIndex: 2, indexInChar: 2, finalX: -50, finalY: 50, finalW: 104, finalH: 104 },
  { id: 12, src: 'https://picsum.photos/seed/c4/400/400', charIndex: 2, indexInChar: 3, finalX: 50, finalY: 50, finalW: 104, finalH: 104 },
  { id: 13, src: 'https://picsum.photos/seed/c5/400/400', charIndex: 2, indexInChar: 4, finalX: 0, finalY: 0, finalW: 84, finalH: 84 },

  // ---- 学 (charIndex: 3) 5 块拼接无缝填满 ----
  { id: 14, src: 'https://picsum.photos/seed/d1/400/400', charIndex: 3, indexInChar: 0, finalX: -50, finalY: -50, finalW: 104, finalH: 104 },
  { id: 15, src: 'https://picsum.photos/seed/d2/400/400', charIndex: 3, indexInChar: 1, finalX: 50, finalY: -50, finalW: 104, finalH: 104 },
  { id: 16, src: 'https://picsum.photos/seed/d3/400/400', charIndex: 3, indexInChar: 2, finalX: -50, finalY: 50, finalW: 104, finalH: 104 },
  { id: 17, src: 'https://picsum.photos/seed/d4/400/400', charIndex: 3, indexInChar: 3, finalX: 50, finalY: 50, finalW: 104, finalH: 104 },
  { id: 18, src: 'https://picsum.photos/seed/d5/400/400', charIndex: 3, indexInChar: 4, finalX: 0, finalY: 0, finalW: 84, finalH: 84 },

  // ---- 会 (charIndex: 4) 4 块拼接无缝填满 ----
  { id: 19, src: 'https://picsum.photos/seed/e1/400/400', charIndex: 4, indexInChar: 0, finalX: -50, finalY: -50, finalW: 104, finalH: 104 },
  { id: 20, src: 'https://picsum.photos/seed/e2/400/400', charIndex: 4, indexInChar: 1, finalX: 50, finalY: -50, finalW: 104, finalH: 104 },
  { id: 21, src: 'https://picsum.photos/seed/e3/400/400', charIndex: 4, indexInChar: 2, finalX: -50, finalY: 50, finalW: 104, finalH: 104 },
  { id: 22, src: 'https://picsum.photos/seed/e4/400/400', charIndex: 4, indexInChar: 3, finalX: 50, finalY: 50, finalW: 104, finalH: 104 },
];

// ==================== 错峰流体窗口常数计算 ====================
function getPhotoWindow(photo: CollagePhoto) {
  const offset = (photo.charIndex / 5) * 0.5 + photo.indexInChar * 0.05;
  const windowStart = Math.min(offset, 0.4);
  const windowEnd = Math.min(windowStart + 0.55, 1.0);
  const span = windowEnd - windowStart;
  return { windowStart, windowEnd, span };
}

// ==================== 核心变换段（usePhotoTransforms Hook 重构） ====================
function usePhotoTransforms(
  progress: MotionValue<number>,
  photo: CollagePhoto,
  isMobile: boolean
) {
  // ------ 错峰流体窗口 ------
  const { windowStart, windowEnd, span } = getPhotoWindow(photo);

  // ------ 5 段关键帧输入域 ------
  const inputRange = [
    windowStart,
    windowStart + span * 0.22,
    windowStart + span * 0.5,
    windowStart + span * 0.78,
    windowEnd,
  ];

  // ------ 最终世界坐标 ------
  const finalWorldX =
    getCharCenterX(photo.charIndex) + photo.finalX - photo.finalW / 2;
  const finalWorldY = CHAR_Y + photo.finalY - photo.finalH / 2;

  // ========== ① Y 轴：屏外 → 冲过 → 回落 → 微弹 → 落位 ==========
  const y = useTransform(progress, inputRange, [
    typeof window !== 'undefined' ? window.innerHeight + 800 : 1800,
    -120,
    280,
    30,
    finalWorldY,
  ]);

  // ========== ② 极端缩放 + 果冻回弹 ==========
  // 峰值 → 4.0（移动端 2.5）；落地前先缩到 0.9 再弹回 1.0
  const maxScale = isMobile ? 2.5 : 4.0;
  const scale = useTransform(progress, inputRange, [
    0.2,             // 远处小点
    maxScale * 0.75, // 中段加速放大
    maxScale,        // 贴脸高潮（视觉张力最大化）
    0.92,            // 先收缩到略小于目标（果冻预备）
    1.0,             // 咔哒一声弹回精准尺寸
  ]);

  // ========== ③ X 轴正弦漂移 ==========
  const x = useTransform(progress, inputRange, [
    finalWorldX - 220,
    finalWorldX + 100,
    finalWorldX - 60,
    finalWorldX + 15,
    finalWorldX,
  ]);

  // ========== ④ Z 轴旋转（平面翻滚） ==========
  const rotateZ = useTransform(progress, inputRange, [
    -45,   // 起飞：向左倾斜
    15,    // 中段：右倾
    -5,    // 顶点：轻微反向
    2,     // 落地前微调
    0,     // 严格归零（拼积木感）
  ]);

  // ========== ⑤ X 轴 3D 旋转（从下往上翻） ==========
  const rotateX = useTransform(progress, inputRange, [
    60,   // 底部起飞：贴着地面，向后仰
    25,   // 中段
    10,   // 顶点：接近正面
    0,    // 落地前
    0,    // 最终严格正视
  ]);

  // ========== ⑥ Y 轴 3D 旋转（侧身翻转，可选微调） ==========
  const rotateY = useTransform(progress, inputRange, [
    -35,
    20,
    -10,
    4,
    0,
  ]);

  // ========== ⑦ 动态阴影：起飞轻影 → 贴脸金色弥散 → 落地硬影 ==========
  const boxShadow = useTransform(progress, inputRange, [
    // 底部起飞：轻盈悬浮影
    '0px 10px 20px rgba(0,0,0,0.5), inset 0 0 12px rgba(255,255,255,0.05)',
    // 中段：开始发光
    '0px 30px 60px rgba(255,215,0,0.2), inset 0 0 16px rgba(255,255,255,0.12)',
    // 贴脸高潮：极宽的金色弥散光晕 + 内发光
    '0px 60px 120px rgba(255,215,0,0.35), 0px 0px 40px rgba(255,215,0,0.25), inset 0 0 24px rgba(255,255,255,0.2)',
    // 收缩准备落地：收拢阴影
    '0px 12px 24px rgba(0,0,0,0.6), inset 0 0 14px rgba(255,255,255,0.1)',
    // 精准镶嵌：紧贴背景的硬阴影
    '0px 4px 10px rgba(0,0,0,0.85), inset 0 0 6px rgba(255,255,255,0.06)',
  ]);

  // ========== ⑧ 景深亮度：起飞压暗 → 顶点最亮 → 落地回归 ==========
  const brightness = useTransform(progress, inputRange, [
    0.55,   // 起飞：压在景深后方
    1.05,   // 中段
    1.25,   // 顶点：全亮，突出主体
    1.1,    // 收缩
    0.95,   // 镶嵌后融入字形
  ]);

  // ========== ⑨ 轻微饱和度增强（顶点时） ==========
  const saturate = useTransform(progress, inputRange, [
    0.7,
    1.1,
    1.4,
    1.15,
    1.0,
  ]);

  // ========== ⑩ 透明度 ==========
  // 起飞平滑显现 -> 全程高光展示 -> 落地精准咬合后无缝交接给内部字形裁切瓦片
  const opacity = useTransform(
    progress,
    [windowStart, windowStart + span * 0.08, windowEnd, windowEnd + 0.015],
    [0, 1, 1, 0]
  );

  // ========== ⑪ Z-Index 层级锁定 ==========
  const zIndex = useTransform(
    progress,
    [windowStart, windowStart + span * 0.5, windowEnd - 0.02, windowEnd],
    [10, 80, 80, 5]
  );

  // ========== ⑫ 边框色：起飞白 → 顶点金 → 落地白 ==========
  const borderColor = useTransform(progress, inputRange, [
    'rgba(255,255,255,0.15)',
    'rgba(255,215,0,0.6)',
    'rgba(255,235,150,0.85)',
    'rgba(255,215,0,0.5)',
    'rgba(255,255,255,0.25)',
  ]);

  return {
    x,
    y,
    scale,
    rotateX,
    rotateY,
    rotateZ,
    boxShadow,
    brightness,
    saturate,
    opacity,
    zIndex,
    borderColor,
  };
}

// ==================== FlyingPhoto 渲染组件（应用所有变换） ====================
const FlyingPhoto: React.FC<{
  photo: CollagePhoto;
  progress: MotionValue<number>;
  isMobile: boolean;
}> = ({ photo, progress, isMobile }) => {
  const {
    x,
    y,
    scale,
    rotateX,
    rotateY,
    rotateZ,
    boxShadow,
    brightness,
    saturate,
    opacity,
    zIndex,
    borderColor,
  } = usePhotoTransforms(progress, photo, isMobile);

  // 组合 filter：亮度 + 饱和度（GPU 加速，不触发重排）
  const filter = useMotionTemplate`brightness(${brightness}) saturate(${saturate})`;

  return (
    <motion.div
      className="absolute top-0 left-0 origin-center select-none pointer-events-none"
      style={{
        x,
        y,
        scale,
        rotateX,
        rotateY,
        rotateZ,
        opacity,
        zIndex,
        width: photo.finalW,
        height: photo.finalH,
        // 3D 空间保留，确保 rotateX/Y 生效
        transformStyle: 'preserve-3d',
        transformPerspective: 1200,
        willChange: isMobile ? 'auto' : 'transform, opacity, filter, box-shadow',
        pointerEvents: 'none',
        // 高级玻璃卡片质感：圆角 + 边框色 + 内发光由 boxShadow 提供
        borderRadius: '10px',
        border: '1px solid',
        borderColor,
        // backdrop-blur 仅在 PC 端启用（移动端可能开销较大）
        backdropFilter: isMobile ? 'none' : 'blur(6px)',
        WebkitBackdropFilter: isMobile ? 'none' : 'blur(6px)',
        boxShadow,
        filter,
      }}
    >
      <div className="relative w-full h-full overflow-hidden" style={{ borderRadius: '9px' }}>
        <Image
          src={photo.src}
          alt=""
          fill
          sizes="(max-width: 768px) 30vw, 15vw"
          loading="lazy"
          quality={60}
          className="h-full w-full object-cover select-none"
          draggable={false}
        />
        {/* 图片本身内阴影，模拟玻璃覆盖感 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.15)',
            borderRadius: '9px',
          }}
        />
      </div>
    </motion.div>
  );
};

// ==================== ② 内部裁切照片瓦片：严格限在字形内，绝不越界，字体绝无空白 ====================
const DockedPhotoTile: React.FC<{
  photo: CollagePhoto;
  progress: MotionValue<number>;
}> = ({ photo, progress }) => {
  const { windowEnd } = getPhotoWindow(photo);

  const finalWorldX = getCharCenterX(photo.charIndex) + photo.finalX - photo.finalW / 2;
  const finalWorldY = CHAR_Y + photo.finalY - photo.finalH / 2;

  // 飞入照片飞抵卡槽并在 windowEnd 完成果冻回弹后，无缝在字形内实心长驻
  const opacity = useTransform(
    progress,
    [0, windowEnd - 0.005, windowEnd, 1.0],
    [0, 0, 1.0, 1.0]
  );

  return (
    <motion.image
      href={photo.src}
      x={finalWorldX}
      y={finalWorldY}
      width={photo.finalW}
      height={photo.finalH}
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity }}
    />
  );
};

// ==================== 金色描边 SVG 字形与裁切瓦片层 ====================
interface GoldStrokeTextProps {
  text: string;
  photos: CollagePhoto[];
  progress: MotionValue<number>;
  isMobile?: boolean;
}

const GoldStrokeText: React.FC<GoldStrokeTextProps> = ({ text, photos, progress, isMobile = false }) => {
  const chars = text.split('');

  // 庆祝合体完成的流金扫光动效 (activeProgress >= 0.92 ~ 1.0)
  const shimmerX = useTransform(
    progress,
    [0.92, 0.985],
    [START_X - 180, START_X + TOTAL_TEXT_W + 180]
  );
  const shimmerOpacity = useTransform(
    progress,
    [0.91, 0.935, 0.98, 1.0],
    [0, 0.95, 0.95, 0.35]
  );

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={WORLD_W}
      height={WORLD_H}
      viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="goldStroke" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF5C2" />
          <stop offset="40%" stopColor="#E8C547" />
          <stop offset="60%" stopColor="#B8860B" />
          <stop offset="100%" stopColor="#5C3D0A" />
        </linearGradient>

        {/* 庆祝合体完成时的流金扫光高亮渐变 */}
        <linearGradient id="goldSweepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFF9D2" stopOpacity="0" />
          <stop offset="35%" stopColor="#FFE066" stopOpacity="0.45" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="65%" stopColor="#FFE066" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFF9D2" stopOpacity="0" />
        </linearGradient>

        {/* PC 端保留高斯发光与内阴影滤镜，移动端跳过昂贵的 SVG 滤镜以保护 GPU 算力 */}
        {!isMobile && (
          <>
            <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="goldInnerShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="0" dy="0" />
              <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" />
              <feFlood floodColor="#3A2500" floodOpacity="0.6" />
              <feComposite in2="SourceGraphic" operator="in" />
              <feMerge>
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </>
        )}

        {/* 为每个汉字定义绝对精准的裁切路径：使用该字的实际笔画作为遮罩，照片绝不溢出边界，字形绝无空白！ */}
        {chars.map((char, i) => {
          const cx = getCharCenterX(i);
          return (
            <clipPath key={`clip-${i}`} id={`char-clip-${i}`}>
              <text
                x={cx}
                y={CHAR_Y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={CHAR_W * 0.92}
                fontFamily="'Noto Serif SC', 'Songti SC', 'STSong', serif"
                fontWeight={900}
              >
                {char}
              </text>
            </clipPath>
          );
        })}
      </defs>

      {/* 字符底部微光衬底，确保在照片拼图飞入前字形轮廓优雅可见 */}
      {chars.map((char, i) => {
        const cx = getCharCenterX(i);
        return (
          <text
            key={`base-${i}`}
            x={cx}
            y={CHAR_Y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={CHAR_W * 0.92}
            fontFamily="'Noto Serif SC', 'Songti SC', 'STSong', serif"
            fontWeight={900}
            fill="rgba(212, 175, 55, 0.08)"
          >
            {char}
          </text>
        );
      })}

      {/* 内部裁切照片瓦片：按字符分组，每一组受该字的 clipPath 严格约束 */}
      {chars.map((_, i) => {
        const charPhotos = photos.filter((p) => p.charIndex === i);
        return (
          <g key={`clipped-group-${i}`} clipPath={`url(#char-clip-${i})`}>
            {charPhotos.map((photo) => (
              <DockedPhotoTile
                key={`docked-${photo.id}`}
                photo={photo}
                progress={progress}
              />
            ))}
          </g>
        );
      })}

      {/* 顶层金色雕刻描边轮廓 */}
      {chars.map((char, i) => {
        const cx = getCharCenterX(i);
        return (
          <text
            key={`stroke-${i}`}
            x={cx}
            y={CHAR_Y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={CHAR_W * 0.92}
            fontFamily="'Noto Serif SC', 'Songti SC', 'STSong', serif"
            fontWeight={900}
            fill="none"
            stroke="url(#goldStroke)"
            strokeWidth={isMobile ? 2.0 : 2.8}
            filter={isMobile ? undefined : 'url(#goldGlow)'}
          >
            {char}
          </text>
        );
      })}

      {/* 顶层流金庆典扫光层（仅在各汉字实际笔画遮罩内部横扫，呈现合体完成时的华彩流光） */}
      {chars.map((_, i) => (
        <g key={`shimmer-group-${i}`} clipPath={`url(#char-clip-${i})`}>
          <motion.rect
            y={CHAR_Y - CHAR_W * 0.65}
            width={200}
            height={CHAR_W * 1.3}
            fill="url(#goldSweepGradient)"
            style={{
              x: shimmerX,
              opacity: shimmerOpacity,
            }}
            transform="skewX(-22)"
          />
        </g>
      ))}

      {/* 字符底部活动标签微标 */}
      {EVENT_LABELS.map((label, i) => {
        const cx = getCharCenterX(i);
        return (
          <text
            key={label}
            x={cx}
            y={CHAR_Y + CHAR_W * 0.62}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={18}
            fontFamily="'Noto Serif SC', 'Songti SC', 'STSong', serif"
            fontWeight={600}
            fill="#d4af37"
            letterSpacing="0.1em"
            opacity={0.88}
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
};

// ==================== 主组件 ====================
export interface LegoTypographyCollageProps {
  photos?: CollagePhoto[];
  text?: string;
  /** 竹林山水画背景图 URL。可替换为自定义竹林山水画 */
  backgroundImage?: string;
}

export const LegoTypographyCollage: React.FC<LegoTypographyCollageProps> = ({
  photos = DEMO_PHOTOS,
  text = '技大佛学会',
  backgroundImage = 'https://images.unsplash.com/photo-1503785640985-f62e3aeee448?w=1920&q=80',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [worldScale, setWorldScale] = useState(1);
  const isMobile = useIsMobile();

  // -------- 移动端精简 DOM 与内存占用：每个字只渲染 2 张最具代表性照片 --------
  const displayPhotos = useMemo(() => {
    if (!isMobile) return photos;
    const charCountMap: Record<number, number> = {};
    return photos.filter((p) => {
      charCountMap[p.charIndex] = (charCountMap[p.charIndex] || 0) + 1;
      return charCountMap[p.charIndex] <= 2; // 5字共10张，减少超50% DOM与材质
    });
  }, [photos, isMobile]);

  // -------- 全局滚动进度 (当粘性区域固定在视口顶端时完整演绎) --------
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // -------- 关键弹簧阻尼：PC 端弹性跟手且微过冲，移动端直接使用原生滚动进度 --------
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,   // 更紧凑的响应，有弹性但不拖沓
    damping: 15,     // 略低阻尼，产生轻微的回弹过冲
    mass: 1,         // 标准质量
  });
  const activeProgress = isMobile ? scrollYProgress : smoothProgress;

  // -------- 响应式缩放（世界坐标 → 视口）--------
  useEffect(() => {
    const updateScale = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const s = Math.min(w / WORLD_W, h / WORLD_H) * (isMobile ? 0.98 : 0.95);
      setWorldScale(s);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isMobile]);

  // -------- 当照片完全咬合合体完成 (progress >= 0.94) 时触发一次清脆庄严的颂钵磬鸣 --------
  useEffect(() => {
    let triggered = false;
    const unsub = activeProgress.on('change', (v) => {
      if (v >= 0.94 && !triggered) {
        triggered = true;
        playSingingBowl(528, 0.28); // 528Hz 空灵高阶梵音
      } else if (v < 0.85) {
        triggered = false;
      }
    });
    return () => unsub();
  }, [activeProgress]);

  return (
    <section
      ref={containerRef}
      role="region"
      aria-label="技大佛学会五大活动与例常拼贴画"
      className="relative w-full"
      style={{
        height: isMobile ? '220vh' : '320vh',
        // 视体剔除优化：未滑入视口前，跳过子树排版与绘制计算
        contentVisibility: 'auto',
        containIntrinsicSize: '1000px',
      }}
    >
      {/* 读屏无障碍文本 (Screen Reader only) */}
      <div className="sr-only">
        技大佛学会五大活动例常：迎新会、欢乐营、静修营、卫塞营、传承营，照片拼贴聚合成汉字“技大佛学会”。
      </div>
      {/* ==================== 古典竹林山水背景层 (纯静态、无抖动、无视差拉扯) ==================== */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundColor: '#0a0806',
        }}
        aria-hidden="true"
      />
      {/* 暗色蒙版：移动端采用极简遮罩，避免复杂径向渐变开销 */}
      <div
        className="absolute inset-0"
        style={{
          background: isMobile ? 'rgba(0, 0, 0, 0.78)' : BG_OVERLAY,
        }}
        aria-hidden="true"
      />

      {/* 顶部宣纸水墨洇染过渡层：承接上方米黄宣纸，自然渐隐入沉静深黑竹林 */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-48 z-10 bg-gradient-to-b from-[#F2EAE0] via-[#8a7a63]/40 via-[#2a2216]/80 to-transparent"
        aria-hidden="true"
      />

      {/* ==================== 粘性视口层 ==================== */}
      <div
        className="sticky top-0 w-full"
        style={{
          height: '100vh',
          overflow: 'visible',
        }}
      >
        {/* 世界坐标系容器（1400×700 设计稿等比缩放）*/}
        <div
          className="absolute top-1/2 left-1/2"
          style={{
            width: WORLD_W,
            height: WORLD_H,
            transform: `translate(-50%, -50%) scale(${worldScale})`,
            transformOrigin: 'center center',
          }}
        >
          {/* -------- 金色书法字形与已卡位瓦片层 (静态沉稳，永久端正) -------- */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <GoldStrokeText
              text={text}
              photos={displayPhotos}
              progress={activeProgress}
              isMobile={isMobile}
            />
          </div>

          {/* -------- 飞入照片层：从底部升起 -> 正中央停留放大展示 -> 飞入字形 -------- */}
          {displayPhotos.map((photo) => (
            <FlyingPhoto
              key={photo.id}
              photo={photo}
              progress={activeProgress}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LegoTypographyCollage;
