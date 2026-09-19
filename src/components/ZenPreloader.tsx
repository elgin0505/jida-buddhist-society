'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ZenPreloaderProps {
  logoSrc?: string;
  logoAlt?: string;
  subtitle?: string;
  onExitComplete?: () => void; // 退场动画结束回调
  onDismiss?: () => void;      // 点击直接跳过回调
}

const ZenPreloader: React.FC<ZenPreloaderProps> = ({
  logoSrc = '/logo.png',
  logoAlt = '技大佛学会',
  subtitle = '技大佛学会',
  onExitComplete,
  onDismiss,
}) => {
  // ============ 时间常量（统一管理，便于调优）============
  const BREATH_DURATION = 3;      // 呼吸周期
  const RIPPLE_DURATION = 3;      // 波纹扩散周期
  const RIPPLE_DELAY = 0.5;       // 波纹间延迟

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md cursor-pointer select-none"
      initial={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{
        opacity: 0,
        scale: 1.1,
        filter: 'blur(10px)',
      }}
      transition={{
        duration: 1.2,
        ease: [0.4, 0, 0.2, 1], // Material 式 ease，收势极缓
      }}
      onAnimationComplete={() => {
        // 只有在退场动画彻底结束后才通知父组件恢复滚动
        onExitComplete?.();
      }}
      onClick={onDismiss}
      title="轻触任意处可跳过入场"
      style={{
        willChange: 'transform, opacity, filter',
      }}
    >
      {/* ==================== 中心视觉层 ==================== */}
      <div className="relative flex flex-col items-center justify-center">

        {/* ---------- 视觉核心容器（承载光晕 + 波纹 + Logo）---------- */}
        <div className="relative flex h-72 w-72 items-center justify-center md:h-80 md:w-80">

          {/* ========== ① 核心金色光晕（最底层）========== */}
          <motion.div
            className="pointer-events-none absolute h-56 w-56 rounded-full
                       bg-[radial-gradient(circle,rgba(251,191,36,0.55),rgba(251,191,36,0.15)_50%,transparent_75%)]
                       blur-2xl md:h-64 md:w-64"
            animate={{
              scale: [0.9, 1.2, 0.9],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: BREATH_DURATION,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ willChange: 'transform, opacity' }}
            aria-hidden="true"
          />

          {/* ========== ② 次级内光晕（错峰呼吸，增加层次）========== */}
          <motion.div
            className="pointer-events-none absolute h-40 w-40 rounded-full
                       bg-[radial-gradient(circle,rgba(255,215,120,0.6),transparent_70%)]
                       blur-xl md:h-44 md:w-44"
            animate={{
              scale: [1.1, 0.85, 1.1],
              opacity: [0.5, 0.9, 0.5],
            }}
            transition={{
              duration: BREATH_DURATION * 1.15,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.4,
            }}
            style={{ willChange: 'transform, opacity' }}
            aria-hidden="true"
          />

          {/* ========== ③ 同心波纹环 · 第一圈 ========== */}
          <motion.div
            className="pointer-events-none absolute h-52 w-52 rounded-full
                       border border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.25)] md:h-60 md:w-60"
            initial={{ scale: 1, opacity: 0 }}
            animate={{
              scale: [1, 1.5],
              opacity: [0.75, 0],
            }}
            transition={{
              duration: RIPPLE_DURATION,
              repeat: Infinity,
              delay: 0,
              ease: 'easeOut',
            }}
            style={{ willChange: 'transform, opacity' }}
            aria-hidden="true"
          />

          {/* ========== ④ 同心波纹环 · 第二圈（错峰 0.5s）========== */}
          <motion.div
            className="pointer-events-none absolute h-52 w-52 rounded-full
                       border border-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.2)] md:h-60 md:w-60"
            initial={{ scale: 1, opacity: 0 }}
            animate={{
              scale: [1, 1.5],
              opacity: [0.65, 0],
            }}
            transition={{
              duration: RIPPLE_DURATION,
              repeat: Infinity,
              delay: RIPPLE_DELAY,
              ease: 'easeOut',
            }}
            style={{ willChange: 'transform, opacity' }}
            aria-hidden="true"
          />

          {/* ========== ⑤ 同心波纹环 · 第三圈（错峰 1.0s，制造连续水波涟漪）========== */}
          <motion.div
            className="pointer-events-none absolute h-52 w-52 rounded-full
                       border border-amber-400/40 shadow-[0_0_8px_rgba(251,191,36,0.15)] md:h-60 md:w-60"
            initial={{ scale: 1, opacity: 0 }}
            animate={{
              scale: [1, 1.5],
              opacity: [0.55, 0],
            }}
            transition={{
              duration: RIPPLE_DURATION,
              repeat: Infinity,
              delay: RIPPLE_DELAY * 2,
              ease: 'easeOut',
            }}
            style={{ willChange: 'transform, opacity' }}
            aria-hidden="true"
          />

          {/* ========== ⑥ 内圈静态金环（稳定视觉锚点）========== */}
          <div
            className="pointer-events-none absolute h-28 w-28 rounded-full
                       border border-yellow-500/40 md:h-32 md:w-32"
            aria-hidden="true"
          />

          {/* ========== ⑦ Logo 主体（呼吸 + 悬浮）========== */}
          <motion.img
            src={logoSrc}
            alt={logoAlt}
            className="relative z-10 h-24 w-auto select-none pointer-events-none md:h-28"
            animate={{
              opacity: [0.7, 1, 0.7],
              scale: [0.96, 1.04, 0.96],
              y: [0, -6, 0],
            }}
            transition={{
              duration: BREATH_DURATION,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            draggable={false}
            style={{ willChange: 'transform, opacity', maxHeight: 112 }}
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.fallback-text')) {
                const span = document.createElement('span');
                span.className =
                  'fallback-text relative z-10 text-3xl md:text-4xl font-bold text-amber-300 tracking-[0.3em] whitespace-nowrap';
                span.textContent = '技大佛学会';
                parent.appendChild(span);
              }
            }}
          />
        </div>

        {/* ==================== 标题（错峰浮现）==================== */}
        <motion.p
          className="mt-8 text-sm font-medium tracking-[0.4em] text-amber-300/90 md:text-base select-none"
          initial={{ opacity: 0, y: 15, letterSpacing: '0.25em' }}
          animate={{
            opacity: 1,
            y: 0,
            letterSpacing: '0.4em',
          }}
          transition={{
            delay: 0.8,
            duration: 1.5,
            ease: 'easeOut',
          }}
          style={{ willChange: 'transform, opacity' }}
        >
          {subtitle}
        </motion.p>

        {/* ==================== 3 粒微光跳动 Loading 小点 ==================== */}
        <motion.div
          className="mt-5 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1.2, ease: 'easeOut' }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.25, 0.8],
                y: [0, -3, 0],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.2,
              }}
              style={{ willChange: 'transform, opacity' }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ZenPreloader;
export { ZenPreloader };
