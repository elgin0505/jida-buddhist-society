// src/components/ExploreActivitiesSection.tsx
'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  Variants,
} from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { playSingingBowl } from '@/utils/zenAudio';

// ==================== 磁性按钮组件 ====================
export interface MagneticButtonProps {
  children: React.ReactNode;
  isMobile?: boolean;
  onClick?: () => void;
  strength?: number; // 吸附强度，默认 0.25
  className?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  isMobile = false,
  onClick,
  strength = 0.25,
  className = '',
}) => {
  const ref = useRef<HTMLButtonElement>(null);

  // 鼠标相对按钮中心的偏移
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  // 弹簧阻尼：让按钮有果冻般的回弹
  const sx = useSpring(mx, { stiffness: 150, damping: 15, mass: 0.1 });
  const sy = useSpring(my, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isMobile || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // 鼠标中心到按钮中心的距离 × 吸附强度
    mx.set((e.clientX - centerX) * strength);
    my.set((e.clientY - centerY) * strength);
  };

  const handleMouseLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playSingingBowl(432, 0.22);
    onClick?.();
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        x: isMobile ? 0 : sx,
        y: isMobile ? 0 : sy,
        willChange: isMobile ? undefined : 'transform',
      }}
      whileHover={isMobile ? {} : { scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`group relative inline-flex items-center gap-3 rounded-full
                 border border-amber-400/40 bg-black/50 px-8 py-4
                 text-base font-medium tracking-wide text-amber-100
                 backdrop-blur-md shadow-[0_4px_30px_rgba(212,175,55,0.15)]
                 transition-colors duration-300
                 hover:border-amber-300/70 hover:bg-amber-500/10
                 hover:shadow-[0_8px_50px_rgba(212,175,55,0.3)] ${className}`}
    >
      {/* 内发光光晕 */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full
                   bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.15),transparent_70%)]
                   opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />
      <Calendar className="relative z-10 h-4 w-4 text-amber-300 transition-transform group-hover:scale-110" />
      <span className="relative z-10">{children}</span>
      {/* 右箭头图标 */}
      <motion.span
        className="relative z-10 inline-block font-sans"
        initial={{ x: 0 }}
        whileHover={{ x: 4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        aria-hidden="true"
      >
        →
      </motion.span>
    </motion.button>
  );
};

// ==================== 主区块类型与预设胶囊 ====================
export interface Pill {
  id: string;
  label: string;
  speed: number;    // 视差速度系数（0.3~1.2）
  floatDur: number;  // 呼吸动画周期
  floatDelay: number; // 呼吸延迟
}

// 预设丰富活动胶囊标签（含专属错位视差系数与呼吸节律）
export const DEFAULT_PILLS: Pill[] = [
  { id: 'mid-autumn', label: '中秋供灯法会', speed: 1.2, floatDur: 3.2, floatDelay: 0 },
  { id: 'morning-zen', label: '晨间禅坐', speed: 0.6, floatDur: 4.0, floatDelay: 0.4 },
  { id: 'youth-share', label: '佛法青年分享会', speed: 1.0, floatDur: 3.6, floatDelay: 0.8 },
  { id: 'lotus-craft', label: '禅意手工莲花灯坊', speed: 0.45, floatDur: 4.4, floatDelay: 0.2 },
  { id: 'nature-walk', label: '自然步道经行', speed: 0.85, floatDur: 3.8, floatDelay: 0.6 },
  { id: 'vegan-bazaar', label: '校园慈心素食义卖', speed: 0.5, floatDur: 4.2, floatDelay: 1.0 },
  { id: 'care-talk', label: '临终关怀辅导座谈', speed: 0.95, floatDur: 3.5, floatDelay: 0.3 },
  { id: 'temple-tour', label: '古寺佛像参访研学', speed: 0.7, floatDur: 4.1, floatDelay: 0.7 },
];

// ==================== 单个胶囊组件 ====================
export const FloatingPill: React.FC<{
  pill: Pill;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
  isMobile: boolean;
  index: number;
}> = ({ pill, progress, isMobile }) => {
  // 基于滚动进度的视差位移
  // speed 越大，向上移动越快；speed 越小，越"落后"
  const parallaxY = useTransform(
    progress,
    [0, 1],
    [0, -pill.speed * 120]
  );

  // 弹簧包裹，增加沉甸甸的物理感
  const smoothY = useSpring(parallaxY, {
    stiffness: 70,
    damping: 18,
    mass: 1.1,
  });

  // 移动端降低幅度；PC 端保留完整视差
  const finalY = isMobile ? useTransform(smoothY, (v) => v * 0.5) : smoothY;

  return (
    <motion.div
      style={{
        y: finalY,
        willChange: isMobile ? undefined : 'transform',
      }}
      className="relative"
    >
      {/* 内层包裹呼吸动画（与视差解耦，避免同一元素绑定冲突）*/}
      <motion.div
        onClick={() => playSingingBowl(528 + (index % 5) * 64, 0.18)}
        animate={
          isMobile
            ? { y: [0, 0] } // 移动端关闭呼吸，保持绝对流畅
            : { y: ['-3px', '3px', '-3px'] }
        }
        transition={{
          duration: pill.floatDur,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: pill.floatDelay,
        }}
        className="group relative inline-flex cursor-pointer items-center gap-2.5
                   rounded-full border border-white/10 bg-white/[0.04]
                   px-5 py-2.5 text-xs sm:text-sm font-medium text-white/85
                   backdrop-blur-md transition-all duration-300
                   hover:border-amber-400/50 hover:bg-amber-500/10
                   hover:text-amber-100 hover:scale-[1.03]
                   shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
      >
        {/* 金色圆点呼吸指示灯 */}
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.6)] transition-transform group-hover:scale-125" />
        {/* hover 时内发光 */}
        <span
          className="pointer-events-none absolute inset-0 rounded-full
                     bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.12),transparent_70%)]
                     opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden="true"
        />
        <span className="relative z-10">{pill.label}</span>
      </motion.div>
    </motion.div>
  );
};

// ==================== 主区块 ====================
export interface ExploreActivitiesSectionProps {
  pills?: Pill[];
}

export const ExploreActivitiesSection: React.FC<ExploreActivitiesSectionProps> = ({
  pills = DEFAULT_PILLS,
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();

  // 监听整个区块的滚动进度
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // -------- 文本流体入场动画变体 (Mask Up) --------
  const lineContainer: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  };

  const lineChild: Variants = {
    hidden: { y: '110%' },
    visible: {
      y: '0%',
      transition: {
        duration: 1.0,
        ease: [0.33, 1, 0.68, 1],
      },
    },
  };

  return (
    <section
      id="more-events"
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[#0a0a0a] py-28 md:py-36 border-t border-amber-400/10"
      style={{
        contentVisibility: 'auto',
        containIntrinsicSize: '650px',
      }}
    >
      {/* 禅意背景微弱光晕与宣纸底纹 */}
      <div
        className="pointer-events-none absolute inset-0
                   bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.07),transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        {/* ---------- 标题与描述：逐行遮罩揭示 (Fluid Mask Up) ---------- */}
        <motion.div
          variants={lineContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="mb-12 md:mb-16"
        >
          {/* 眉标 */}
          <div className="overflow-hidden mb-3">
            <motion.span
              variants={lineChild}
              className="inline-block rounded-full bg-amber-400/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-amber-300 border border-amber-400/25 shadow-sm"
            >
              法喜充盈 · 持续更新
            </motion.span>
          </div>

          {/* 主标题 */}
          <div className="overflow-hidden">
            <motion.h2
              variants={lineChild}
              className="text-3xl font-bold tracking-tight text-white md:text-5xl font-serif"
            >
              探索更多精彩活动
            </motion.h2>
          </div>

          {/* 副标题（分行平滑展开）*/}
          <div className="mt-5 max-w-2xl space-y-1.5">
            <div className="overflow-hidden">
              <motion.p
                variants={lineChild}
                className="text-sm text-white/60 md:text-base leading-relaxed"
              >
                除了常态佛学课程与年度五大盛事，佛学会全年持续开展丰富多彩的青年交流项目，
              </motion.p>
            </div>
            <div className="overflow-hidden">
              <motion.p
                variants={lineChild}
                className="text-sm text-white/60 md:text-base leading-relaxed"
              >
                从晨曦禅坐到公益助人，陪伴大家度过充实有意义的大学时光。
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* ---------- 胶囊标签：错落悬浮视差与呼吸律动 ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, delay: 0.25, ease: [0.33, 1, 0.68, 1] }}
          className="relative mb-14 flex flex-wrap gap-2.5 sm:gap-3.5"
        >
          {pills.map((pill, index) => (
            <FloatingPill
              key={pill.id}
              pill={pill}
              progress={scrollYProgress}
              isMobile={isMobile}
              index={index}
            />
          ))}
        </motion.div>

        {/* ---------- 磁性按钮 ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.9, delay: 0.45, ease: [0.33, 1, 0.68, 1] }}
        >
          <Link href="/events" className="inline-block focus:outline-none">
            <MagneticButton isMobile={isMobile} strength={0.25}>
              查看完整活动日历
            </MagneticButton>
          </Link>
        </motion.div>
      </div>

      {/* 底部水墨朝晖过渡层：深黑自然羽化洇染至暖米白 */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-44 z-10 bg-gradient-to-b from-transparent via-[#1c1813]/60 via-[#8a795f]/30 to-[#FAF7F2]"
        aria-hidden="true"
      />
    </section>
  );
};

export default ExploreActivitiesSection;
