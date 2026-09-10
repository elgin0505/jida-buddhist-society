// src/components/CylindricalGallery.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  MotionValue,
} from 'framer-motion';
import GrowingSacredVine from './GrowingSacredVine';

// ---------- 类型定义 ----------
export interface GalleryPhoto {
  id: number;
  src: string;
  alt: string;
}

export interface ActivityGalleryConfig {
  key: string;
  sectionTitle: string;
  badge: string;
  description: string;
  centerTitle: string;
  centerEn: string;
  photos: GalleryPhoto[];
  direction: 1 | -1;          // 旋转方向：1 正向，-1 反向
  radius: number;             // PC 端圆环半径（px）
  sizeW: number;              // PC 端照片宽
  sizeH: number;              // PC 端照片高
  radiusMobile: number;       // 移动端圆环半径
  sizeMobileW: number;        // 移动端照片宽
  sizeMobileH: number;        // 移动端照片高
  rotateYRange: [number, number]; // 滚动映射角度范围
  initialOffset: number;      // 初始角度偏移
}

// ---------- 三大活动专属照片与配置 ----------

// 1. 佛学班例常
export const BUDDHISM_CONFIG: ActivityGalleryConfig = {
  key: 'buddhism',
  sectionTitle: '佛学班例常回顾',
  badge: '佛学精进 · 般若法光',
  description: '深入经藏，以法相会 · 拨动时光轮盘，重温法喜充满的学修时刻',
  centerTitle: '佛学班例常',
  centerEn: 'DHARMA CLASS',
  direction: 1,
  radius: 460,
  sizeW: 210,
  sizeH: 280,
  radiusMobile: 240,
  sizeMobileW: 130,
  sizeMobileH: 175,
  rotateYRange: [0, -200],
  initialOffset: 0,
  photos: [
    {
      id: 1,
      src: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop',
      alt: '静坐禅修 · 止息妄念',
    },
    {
      id: 2,
      src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop',
      alt: '经典研读 · 辨析真理',
    },
    {
      id: 3,
      src: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop',
      alt: '正念经行 · 觉察当下',
    },
    {
      id: 4,
      src: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
      alt: '梵呗清唱 · 身心清净',
    },
    {
      id: 5,
      src: 'https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?q=80&w=800&auto=format&fit=crop',
      alt: '禅茶一味 · 体验禅机',
    },
    {
      id: 6,
      src: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=800&auto=format&fit=crop',
      alt: '古刹巡礼 · 法脉长青',
    },
  ],
};

// 2. 生活课题班例常
export const LIFE_CONFIG: ActivityGalleryConfig = {
  key: 'life',
  sectionTitle: '生活课题班例常回顾',
  badge: '青年觉察 · 生活佛法',
  description: '将佛陀智慧融入大学生活与人际相处 · 每一张笑靥都是青春同行的见证',
  centerTitle: '生活课题班例常',
  centerEn: 'LIFE TOPICS',
  direction: -1,
  radius: 460,
  sizeW: 210,
  sizeH: 280,
  radiusMobile: 240,
  sizeMobileW: 130,
  sizeMobileH: 175,
  rotateYRange: [0, 200],
  initialOffset: 45,
  photos: [
    {
      id: 7,
      src: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=800&auto=format&fit=crop',
      alt: '青年相聚 · 欢喜同行',
    },
    {
      id: 8,
      src: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=800&auto=format&fit=crop',
      alt: '团队探索 · 破除隔阂',
    },
    {
      id: 9,
      src: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=800&auto=format&fit=crop',
      alt: '心声倾听 · 情绪觉察',
    },
    {
      id: 10,
      src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=800&auto=format&fit=crop',
      alt: '智慧研讨 · 共同精进',
    },
    {
      id: 11,
      src: 'https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?q=80&w=800&auto=format&fit=crop',
      alt: '感恩交流 · 彼此赋能',
    },
    {
      id: 12,
      src: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800&auto=format&fit=crop',
      alt: '巧思手工 · 专注当下',
    },
  ],
};

// 3. 冬至
export const WINTER_CONFIG: ActivityGalleryConfig = {
  key: 'winter',
  sectionTitle: '冬至温情相聚回顾',
  badge: '岁末同舟 · 团圆法喜',
  description: '冬至阳生，同修齐聚共搓五彩心灯汤圆 · 感念师恩佛恩，暖意长存',
  centerTitle: '冬至',
  centerEn: 'WINTER SOLSTICE',
  direction: 1,
  radius: 460,
  sizeW: 210,
  sizeH: 280,
  radiusMobile: 240,
  sizeMobileW: 130,
  sizeMobileH: 175,
  rotateYRange: [0, -200],
  initialOffset: 90,
  photos: [
    {
      id: 13,
      src: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=800&auto=format&fit=crop',
      alt: '万盏心灯 · 虔诚供佛',
    },
    {
      id: 14,
      src: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?q=80&w=800&auto=format&fit=crop',
      alt: '冬至聚首 · 温暖人心',
    },
    {
      id: 15,
      src: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?q=80&w=800&auto=format&fit=crop',
      alt: '法喜充满 · 佳节共庆',
    },
    {
      id: 16,
      src: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800&auto=format&fit=crop',
      alt: '烛光相映 · 祈愿和平',
    },
    {
      id: 17,
      src: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800&auto=format&fit=crop',
      alt: '同心手作 · 汤圆圆满',
    },
    {
      id: 18,
      src: 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?q=80&w=800&auto=format&fit=crop',
      alt: '灯火阑珊 · 岁末祈福',
    },
  ],
};

// ---------- 单个独立 3D 轮盘展示段落 ----------
export const SingleActivityCylinder: React.FC<{
  config: ActivityGalleryConfig;
}> = ({ config }) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  // 移动端检测
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 监听当前独立组件视口滚动进度
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // 阻尼弹簧平滑滚动 - 调优为敏捷跟手，彻底根除粘滞感
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 26,
    mass: 0.8,
  });

  const total = config.photos.length;
  const radius = isMobile ? config.radiusMobile : config.radius;
  const sizeW = isMobile ? config.sizeMobileW : config.sizeW;
  const sizeH = isMobile ? config.sizeMobileH : config.sizeH;

  // 滚动映射旋转角度
  const targetRotate = useTransform(
    smoothProgress,
    [0, 1],
    config.rotateYRange
  );

  const rotateY = useTransform(
    targetRotate,
    (v) => v + config.initialOffset
  );

  // 关键：中央巨幅文字进行反向旋转，抵消父级旋转，使其始终面朝观众，悬浮在 3D 环心！
  const counterRotateY = useTransform(rotateY, (v) => -v);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-gradient-to-b from-[#FAF7F2] via-[#F6F1E5] to-[#F2EAE0] py-24 sm:py-32 border-b border-ocher/20"
    >
      {/* ⭐ 明显生动的工笔草木藤蔓动态背景（随滚动抽枝绽叶）*/}
      <GrowingSacredVine flip={config.direction === -1} />

      {/* 内容层：z-index: 10，确保在植物壁纸上方 */}
      <div className="relative" style={{ zIndex: 10 }}>
        {/* 顶部标题区 */}
        <div className="max-w-5xl mx-auto px-4 mb-14 text-center">
          <span className="inline-block rounded-full bg-golden-rich/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-golden-rich border border-golden-rich/25 mb-3.5 shadow-sm">
            {config.badge}
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-charcoal tracking-tight mb-3 drop-shadow-sm font-serif">
            {config.sectionTitle}
          </h2>
          <p className="text-muted text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            {config.description}
          </p>
        </div>

        {/* 3D 轮胎舞台容器 */}
        <div
          className="relative w-full max-w-7xl mx-auto flex items-center justify-center"
          style={{
            height: sizeH + 200,
            perspective: '1400px',
          }}
        >
          {/* 倾斜的 3D 旋转体系 */}
          <motion.div
            className="relative"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'rotateX(-9deg) rotateZ(-1.5deg)',
              willChange: 'transform',
            }}
          >
            {/* 旋转动力组 */}
            <motion.div
              className="relative"
              style={{
                transformStyle: 'preserve-3d',
                rotateY,
                willChange: 'transform',
              }}
            >
              {/* ───── 核心：藏在照片循环中央的放大立体标志字（金石熟金墨色质感） ───── */}
              <motion.div
                className="absolute top-1/2 left-1/2 pointer-events-none select-none text-center"
                style={{
                  transformStyle: 'preserve-3d',
                  rotateY: counterRotateY,
                  translateZ: 0,
                  x: '-50%',
                  y: '-50%',
                }}
              >
                <div className="flex flex-col items-center justify-center">
                  <span className="block text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-wider text-[#8A6D3B]/25 whitespace-nowrap drop-shadow-[0_4px_24px_rgba(138,109,59,0.1)] select-none font-serif">
                    {config.centerTitle}
                  </span>
                  <span className="block mt-2 sm:mt-3 text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.45em] uppercase text-[#8A6D3B]/45">
                    {config.centerEn}
                  </span>
                </div>
              </motion.div>

              {/* ───── 环绕在中央文字周围的 3D 照片卡片（全 360 度完整呈现，背面照片不消失） ───── */}
              {config.photos.map((photo, i) => {
                const angle = (i / total) * 360;

                return (
                  <div
                    key={photo.id}
                    className="absolute top-1/2 left-1/2"
                    style={{
                      width: sizeW,
                      height: sizeH,
                      transform: `translate3d(-50%, -50%, 0) rotateY(${angle}deg) translateZ(${radius}px)`,
                      transformStyle: 'preserve-3d',
                      // ⭐ 移除 backfaceVisibility: hidden，彻底解决轮盘背后照片消失的问题！
                    }}
                  >
                    <motion.div
                      className="w-full h-full rounded-2xl overflow-hidden shadow-lg shadow-charcoal/10 border border-ocher/30 bg-warm-white group transition-shadow duration-300 hover:shadow-2xl hover:shadow-golden-rich/20"
                      whileHover={{
                        scale: 1.06,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 22,
                      }}
                    >
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                        draggable={false}
                      />
                      {/* 悬浮文字提示 */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal/85 via-charcoal/40 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <p className="text-[11px] sm:text-xs font-medium text-warm-white truncate text-center">
                          {photo.alt}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </motion.div>
          </motion.div>
        </div>

        {/* 边缘渐变遮罩，柔化上下接缝 */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#FAF7F2] to-transparent" />
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#FAF7F2] to-transparent" />
      </div>
    </section>
  );
};

// ---------- 导出三大独立组件 ----------

// 1. 佛学班例常组件
export const BuddhismClassGallery: React.FC = () => {
  return <SingleActivityCylinder config={BUDDHISM_CONFIG} />;
};

// 2. 生活课题班例常组件
export const LifeTopicsGallery: React.FC = () => {
  return <SingleActivityCylinder config={LIFE_CONFIG} />;
};

// 3. 冬至组件
export const WinterSolsticeGallery: React.FC = () => {
  return <SingleActivityCylinder config={WINTER_CONFIG} />;
};

// ---------- 默认主组件：顺次呈现分开的三大组件 ----------
export const CylindricalGallery: React.FC = () => {
  return (
    <div className="relative w-full bg-gradient-to-b from-[#FAF7F2] via-[#F6F1E5] to-[#F2EAE0] overflow-hidden">
      {/* 禅意温润宣纸光晕底纹 */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_10%,rgba(201,162,39,0.12),transparent_70%)]" />

      {/* 模块主入口标题 */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-28 pb-4 text-center">
        <span className="inline-block rounded-full bg-golden-rich/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-golden-rich border border-golden-rich/25 mb-4 shadow-sm">
          往昔光影 · 3D 时光轮盘
        </span>
        <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-charcoal tracking-tight mb-4 font-serif">
          活动精彩回顾
        </h2>
        <p className="text-muted text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          向下滚动页面，拨动专属时光轮盘，重温同修共行的温暖印记
        </p>
      </div>

      {/* 三大独立活动轮盘 */}
      <BuddhismClassGallery />
      <LifeTopicsGallery />
      <WinterSolsticeGallery />
    </div>
  );
};

export default CylindricalGallery;
