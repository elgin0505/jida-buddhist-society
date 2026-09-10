'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ZenPreloaderProps {
  logoSrc?: string;      // Logo 图片路径
  logoAlt?: string;      // 无障碍替代文本
  duration?: number;     // 呼吸闪烁周期（秒）
}

/**
 * 🌟 技大佛学会 Logo 呼吸闪烁金色光晕 Preloader
 */
const ZenPreloader: React.FC<ZenPreloaderProps> = ({
  logoSrc = '/logo.png',
  logoAlt = '技大佛学会',
  duration = 1.8,
}) => {
  // Logo 与主光晕呼吸闪烁关键帧
  const breathingOpacity = [0.35, 1, 0.35];
  const breathingScale = [0.94, 1.06, 0.94];

  const breathingTransition = {
    duration,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(12px)' }}
      transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
    >
      {/* 中心 Logo 容器 */}
      <div className="relative flex flex-col items-center justify-center">
        {/* ── 外层宏大金色光晕（与 Logo 同步呼吸闪烁） ── */}
        <motion.div
          className="absolute h-72 w-72 rounded-full bg-yellow-500/25 blur-3xl"
          animate={{
            opacity: breathingOpacity,
            scale: breathingScale,
          }}
          transition={breathingTransition}
          aria-hidden="true"
        />

        {/* ── 次级暖琥珀光晕（错频流动增加层次感） ── */}
        <motion.div
          className="absolute h-48 w-48 rounded-full bg-amber-400/35 blur-2xl"
          animate={{
            opacity: [0.25, 0.8, 0.25],
            scale: [0.9, 1.12, 0.9],
          }}
          transition={{
            duration: duration * 1.25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          aria-hidden="true"
        />

        {/* ── 核心微光环 ── */}
        <motion.div
          className="absolute h-36 w-36 rounded-full border border-yellow-400/40"
          animate={{
            scale: [0.98, 1.15, 0.98],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: duration * 1.1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          aria-hidden="true"
        />

        {/* ── 技大佛学会 Logo 主体 ── */}
        <motion.img
          src={logoSrc}
          alt={logoAlt}
          className="relative z-10 h-28 w-28 md:h-36 md:w-36 rounded-full overflow-hidden object-cover select-none pointer-events-none shadow-[0_0_50px_rgba(234,179,8,0.4)] ring-2 ring-yellow-400/50"
          animate={{
            opacity: breathingOpacity,
            scale: breathingScale,
          }}
          transition={breathingTransition}
          draggable={false}
          onError={(e) => {
            // 图片加载失败时回退为文字 Logo
            const target = e.currentTarget;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent && !parent.querySelector('.fallback-text')) {
              const text = document.createElement('div');
              text.className = 'fallback-text relative z-10 text-3xl md:text-5xl font-bold text-amber-300 tracking-widest drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]';
              text.textContent = '技大佛学会';
              parent.appendChild(text);
            }
          }}
        />

        {/* ── 底部优雅文字 ── */}
        <motion.p
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={breathingTransition}
          className="relative z-10 mt-6 text-xs sm:text-sm font-medium tracking-[0.25em] text-amber-200/80 select-none"
        >
          技大佛学会 · 愿法喜充盈
        </motion.p>
      </div>
    </motion.div>
  );
};

export default ZenPreloader;
export { ZenPreloader };
