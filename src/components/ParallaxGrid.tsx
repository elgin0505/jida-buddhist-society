// ParallaxGrid.tsx
'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  MotionValue,
} from 'framer-motion';
import { useIsMobile } from '@/hooks/useIsMobile';

// ---------- 类型定义 ----------
export interface Photo {
  id: number;
  src: string;
  alt: string;
  col: 1 | 2 | 3; // 指定所属列
  category?: string;
}

export type GalleryPhoto = Photo;

interface ColumnConfig {
  col: number;
  speed: number;       // 滚动速度系数（0~1）
  offset: number;      // 起始偏移（px）
  stiffness: number;   // 弹簧刚度
  damping: number;     // 弹簧阻尼
  mass: number;        // 弹簧质量
  layer: 'background' | 'middle' | 'foreground';
}

// ---------- 常量配置 ----------
const COLUMN_CONFIGS: ColumnConfig[] = [
  {
    col: 1,
    speed: 0.35,
    offset: 0,
    stiffness: 70,
    damping: 20,
    mass: 1.3,
    layer: 'background',
  },
  {
    col: 2,
    speed: 0.65,
    offset: -120,
    stiffness: 80,
    damping: 22,
    mass: 1.2,
    layer: 'middle',
  },
  {
    col: 3,
    speed: 1.0,
    offset: -240,
    stiffness: 90,
    damping: 24,
    mass: 1.1,
    layer: 'foreground',
  },
];

export const DEFAULT_PHOTOS: Photo[] = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1000&auto=format&fit=crop',
    alt: '禅修静坐 · 身心止息',
    category: '禅修实践',
    col: 1,
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=1000&auto=format&fit=crop',
    alt: '中秋供灯 · 心灯长明',
    category: '年度法会',
    col: 2,
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1000&auto=format&fit=crop',
    alt: '经典研读 · 慧光普照',
    category: '佛学课程',
    col: 3,
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop',
    alt: '晨间经行 · 步步安详',
    category: '常态共修',
    col: 1,
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?q=80&w=1000&auto=format&fit=crop',
    alt: '禅茶一味 · 静心品茗',
    category: '文化工坊',
    col: 2,
  },
  {
    id: 6,
    src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1000&auto=format&fit=crop',
    alt: '青年静修营 · 欢喜相聚',
    category: '年度大活动',
    col: 3,
  },
  {
    id: 7,
    src: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1000&auto=format&fit=crop',
    alt: '社区服务 · 慈悲回馈',
    category: '爱心公益',
    col: 1,
  },
  {
    id: 8,
    src: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1000&auto=format&fit=crop',
    alt: '手作莲花灯 · 巧心祈愿',
    category: '特色手作',
    col: 2,
  },
  {
    id: 9,
    src: 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?q=80&w=1000&auto=format&fit=crop',
    alt: '感恩晚宴 · 岁末祈福',
    category: '年度盛会',
    col: 3,
  },
  {
    id: 10,
    src: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=1000&auto=format&fit=crop',
    alt: '古刹巡礼 · 正信溯源',
    category: '参学交流',
    col: 1,
  },
  {
    id: 11,
    src: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
    alt: '清心梵唱 · 和乐吉祥',
    category: '梵呗清唱',
    col: 2,
  },
  {
    id: 12,
    src: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?q=80&w=1000&auto=format&fit=crop',
    alt: '浴佛大典 · 同沾法喜',
    category: '卫塞节庆',
    col: 3,
  },
];

// ---------- 主组件 ----------
export const ParallaxGrid: React.FC<{ photos?: Photo[] }> = ({ photos = DEFAULT_PHOTOS }) => {
  const { scrollY } = useScroll(); // 全局滚动 Y (像素)
  const isMobile = useIsMobile();

  // Hero 文字动画（电影字幕离场：透明度淡出、位移上浮）
  const heroOpacity = useTransform(scrollY, [0, 380], [1, 0]);
  const heroY = useTransform(scrollY, [0, 380], [0, -70]);

  // 根据列配置分组照片
  const columnsData = useMemo(() => {
    return COLUMN_CONFIGS.map((cfg) => ({
      ...cfg,
      photos: photos.filter((p) => p.col === cfg.col),
    }));
  }, [photos]);

  return (
    <div
      className="relative w-full pt-28 sm:pt-36 pb-24 sm:pb-36 bg-warm-white"
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '1000px',
      }}
    >
      {/* -------- Hero 文字（固定在视口中央上方，随滚动平滑离场）-------- */}
      <motion.div
        style={{
          opacity: heroOpacity,
          y: heroY,
        }}
        className="fixed top-[28%] sm:top-[30%] left-1/2 z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2 text-center w-full px-4 max-w-5xl"
      >
        <span className="inline-block rounded-full bg-warm-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-golden-rich shadow-sm md:backdrop-blur-md border border-ocher/20 mb-3 sm:mb-4">
          往年活动回顾 · 光影流年
        </span>
        <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-charcoal drop-shadow-sm">
          每一刻，都是修行的足迹
        </h1>
        <p className="mt-3 text-xs sm:text-sm text-charcoal/70 max-w-md mx-auto">
          向下滚动，纵览技大佛学会历年青年共修、弘法讲座与温暖同行的美好光景
        </p>
      </motion.div>

      {/* -------- 照片墙容器（带 3D 透视）-------- */}
      <div
        className="relative overflow-hidden px-3 sm:px-6 lg:px-8"
        style={{ perspective: isMobile ? undefined : '1000px' }}
      >
        <div className="max-w-7xl mx-auto" style={{ transformStyle: isMobile ? 'flat' : 'preserve-3d' }}>
          <motion.div
            className="grid grid-cols-3 gap-3 sm:gap-5 md:gap-7"
            style={{ rotateX: isMobile ? 0 : 6, transformStyle: isMobile ? 'flat' : 'preserve-3d' }}
          >
            {columnsData.map((colCfg, idx) => (
              <ParallaxColumn key={idx} colConfig={colCfg} scrollY={scrollY} isMobile={isMobile} />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// ---------- 单列组件 ----------
const ParallaxColumn: React.FC<{
  colConfig: ColumnConfig & { photos: Photo[] };
  scrollY: MotionValue<number>;
  isMobile: boolean;
}> = ({ colConfig, scrollY, isMobile }) => {
  // 根据全局滚动计算目标 Y 位移
  const targetY = useTransform(
    scrollY,
    (value) => -value * colConfig.speed + colConfig.offset
  );

  // 弹簧物理：PC 端让列拥有惯性与重量感；移动端直接采用原生位移，杜绝双重阻尼卡顿
  const springY = useSpring(targetY, {
    stiffness: colConfig.stiffness,
    damping: colConfig.damping,
    mass: colConfig.mass,
  });

  const activeY = isMobile ? targetY : springY;

  return (
    <motion.div
      className="flex flex-col gap-3 sm:gap-5 md:gap-7"
      style={{
        y: activeY,
        willChange: isMobile ? undefined : 'transform',
      }}
    >
      {colConfig.photos.map((photo, index) => (
        <ImageItem
          key={photo.id}
          photo={photo}
          columnY={activeY}
          index={index}
          layer={colConfig.layer}
          isMobile={isMobile}
        />
      ))}
    </motion.div>
  );
};

// ---------- 单个图片组件（内部视差 + hover 惯性） ----------
const ImageItem: React.FC<{
  photo: Photo;
  columnY: MotionValue<number>;
  index: number;
  layer: string;
  isMobile: boolean;
}> = ({ photo, columnY, index, layer, isMobile }) => {
  // 内部视差：移动端跳过二次变换计算，减少 GPU/主线程开销
  const innerY = useTransform(columnY, (y) => {
    if (isMobile) return 0;
    const factor = (index % 4) * 0.12; // 0, 0.12, 0.24, 0.36
    return y * factor;
  });

  // 图片微缩放：移动端锁死为 1
  const scale = useTransform(columnY, (y) => {
    if (isMobile) return 1;
    return 1 + Math.min(Math.abs(y) * 0.00008, 0.04);
  });

  // 图片微旋转：移动端锁死为 0
  const rotate = useTransform(columnY, (y) => {
    if (isMobile) return 0;
    return Math.max(-0.8, Math.min(0.8, y * 0.002));
  });

  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg bg-warm-cream/40"
      style={{
        y: innerY,
        scale,
        rotate,
        transformStyle: isMobile ? 'flat' : 'preserve-3d',
        willChange: isMobile ? undefined : 'transform',
      }}
      whileHover={
        isMobile
          ? undefined
          : {
              scale: 1.03,
              rotate: 0.6,
              boxShadow: '0 30px 60px -15px rgba(0,0,0,0.25)',
            }
      }
      transition={{ type: 'spring', stiffness: 200, damping: 20, mass: 1 }}
    >
      <div className="relative w-full aspect-[3/4] overflow-hidden">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(max-width: 768px) 33vw, (max-width: 1200px) 33vw, 33vw"
          priority={index < 2}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      {/* 悬停信息渐变浮层 */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-transparent p-3 sm:p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
        {photo.category && (
          <span className="inline-block rounded-full bg-golden-rich/90 px-2 py-0.5 text-[10px] font-semibold text-warm-white">
            {photo.category}
          </span>
        )}
        <p className="mt-1 text-xs sm:text-sm font-medium text-warm-white leading-snug">
          {photo.alt}
        </p>
      </div>
    </motion.div>
  );
};

export default ParallaxGrid;
