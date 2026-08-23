"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BreathingLotusLoaderProps {
  /** 是否占满全屏显示 (默认为 true) */
  fullScreen?: boolean;
  /** 自定义提示文字 (若不传则自动交替显示吸气/呼气禅意文案) */
  customText?: string;
  /** 额外的容器类名 */
  className?: string;
}

/**
 * 🪷 呼吸莲花禅意加载组件 (Breathing Lotus Loader)
 * 采用纯 SVG 线框与 4秒吸气 / 5秒呼气的正念呼吸韵律设计
 */
export function BreathingLotusLoader({
  fullScreen = true,
  customText,
  className = "",
}: BreathingLotusLoaderProps) {
  // 呼吸状态：true 为吸气 (Inhale 4s)，false 为呼气 (Exhale 5s)
  const [isInhaling, setIsInhaling] = useState(true);

  useEffect(() => {
    // 4s 吸气 + 5s 呼气 = 9s 一个完整正念呼吸循环
    const inhaleTimer = setTimeout(() => {
      setIsInhaling(false);
    }, 4000);

    const interval = setInterval(() => {
      setIsInhaling(true);
      setTimeout(() => {
        setIsInhaling(false);
      }, 4000);
    }, 9000);

    return () => {
      clearTimeout(inhaleTimer);
      clearInterval(interval);
    };
  }, []);

  const content = (
    <div className="flex flex-col items-center justify-center select-none pointer-events-none">
      {/* ── 1. 莲花与环形呼吸光晕 ── */}
      <div className="relative flex items-center justify-center">
        {/* 背景柔和扩散光晕 (Halo Bloom) */}
        <motion.div
          animate={{
            scale: isInhaling ? 1.35 : 0.95,
            opacity: isInhaling ? 0.35 : 0.12,
          }}
          transition={{
            duration: isInhaling ? 4 : 5,
            ease: "easeInOut",
          }}
          className="absolute h-48 w-48 rounded-full bg-radial from-[#D4AF37]/40 via-[#C9A227]/15 to-transparent blur-2xl"
        />

        {/* 外圈正念呼吸涟漪 (Ripple) */}
        <motion.div
          animate={{
            scale: isInhaling ? 1.25 : 1,
            opacity: isInhaling ? 0.4 : 0.15,
          }}
          transition={{
            duration: isInhaling ? 4 : 5,
            ease: "easeInOut",
          }}
          className="absolute h-36 w-36 rounded-full border border-[#D4AF37]/30"
        />

        {/* ── 纯代码极简 SVG 线框莲花 (Lotus Wireframe) ── */}
        <motion.svg
          width="120"
          height="120"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{
            scale: isInhaling ? 1.12 : 1,
            opacity: isInhaling ? 1 : 0.65,
            filter: isInhaling
              ? "drop-shadow(0 0 16px rgba(212, 175, 55, 0.6))"
              : "drop-shadow(0 0 4px rgba(212, 175, 55, 0.2))",
          }}
          transition={{
            duration: isInhaling ? 4 : 5,
            ease: "easeInOut",
          }}
          className="relative z-10"
        >
          <defs>
            {/* 暖金色渐变线条 */}
            <linearGradient id="lotusGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2B2" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#996515" stopOpacity="0.6" />
            </linearGradient>

            {/* 半透明极简花瓣填充 */}
            <linearGradient id="petalGlowFill" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* 1. 中心核心主瓣 (Central Petal) */}
          <path
            d="M 50 18 C 42 35 44 60 50 78 C 56 60 58 35 50 18 Z"
            stroke="url(#lotusGoldGrad)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#petalGlowFill)"
          />

          {/* 2. 左内花瓣 (Inner Left Petal) */}
          <path
            d="M 50 78 C 38 65 24 50 32 30 C 42 42 46 62 50 78 Z"
            stroke="url(#lotusGoldGrad)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#petalGlowFill)"
          />

          {/* 3. 右内花瓣 (Inner Right Petal) */}
          <path
            d="M 50 78 C 62 65 76 50 68 30 C 58 42 54 62 50 78 Z"
            stroke="url(#lotusGoldGrad)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#petalGlowFill)"
          />

          {/* 4. 左外展花瓣 (Outer Left Bloom Petal) */}
          <path
            d="M 50 78 C 30 75 14 62 18 42 C 28 54 42 68 50 78 Z"
            stroke="url(#lotusGoldGrad)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#petalGlowFill)"
          />

          {/* 5. 右外展花瓣 (Outer Right Bloom Petal) */}
          <path
            d="M 50 78 C 70 75 86 62 82 42 C 72 54 58 68 50 78 Z"
            stroke="url(#lotusGoldGrad)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="url(#petalGlowFill)"
          />

          {/* 6. 底部托盘水波弧线 (Base Lotus Pedestal Arc) */}
          <path
            d="M 28 82 C 40 87 60 87 72 82"
            stroke="url(#lotusGoldGrad)"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M 36 86 C 44 89 56 89 64 86"
            stroke="url(#lotusGoldGrad)"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.45"
          />

          {/* 7. 中心微光光点 (Core Pearl) */}
          <circle cx="50" cy="52" r="1.5" fill="#FFF8DC" opacity="0.85" />
        </motion.svg>
      </div>

      {/* ── 2. 动态正念文字提示 (Mindful Breath Rhythm Text) ── */}
      <div className="mt-8 h-8 flex items-center justify-center overflow-hidden">
        {customText ? (
          <motion.p
            animate={{
              opacity: isInhaling ? 0.95 : 0.6,
            }}
            transition={{
              duration: isInhaling ? 4 : 5,
              ease: "easeInOut",
            }}
            className="text-sm font-medium tracking-[0.25em] text-[#E5C05B]/90 drop-shadow-sm font-serif"
          >
            {customText}
          </motion.p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.p
              key={isInhaling ? "inhale" : "exhale"}
              initial={{ opacity: 0, y: isInhaling ? 4 : -4 }}
              animate={{ opacity: isInhaling ? 0.95 : 0.75, y: 0 }}
              exit={{ opacity: 0, y: isInhaling ? -4 : 4 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="text-sm font-light tracking-[0.3em] text-[#E5C05B]/90 drop-shadow-[0_1px_8px_rgba(212,175,55,0.3)] font-serif"
            >
              {isInhaling ? "请深呼吸 · 吸气" : "收摄身心 · 呼气"}
            </motion.p>
          </AnimatePresence>
        )}
      </div>

      {/* ── 3. 极简底部微光标签 ── */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ delay: 0.8, duration: 1 }}
        className="mt-2 text-[11px] font-mono tracking-widest text-[#D4AF37]/50 uppercase"
      >
        技大佛学会 · 正念载入中
      </motion.span>
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div
        key="breathing-lotus-fullscreen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#070b16] backdrop-blur-3xl px-4 ${className}`}
        style={{
          background:
            "radial-gradient(ellipse at center, #0e162a 0%, #070b16 70%, #04060d 100%)",
        }}
      >
        {content}
      </motion.div>
    );
  }

  return <div className={`py-12 flex items-center justify-center ${className}`}>{content}</div>;
}

export default BreathingLotusLoader;
