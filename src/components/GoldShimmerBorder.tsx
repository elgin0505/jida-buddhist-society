"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface GoldShimmerBorderProps {
  children: React.ReactNode;
  className?: string;
  glowOpacity?: number;
}

export function GoldShimmerBorder({
  children,
  className = "",
  glowOpacity = 0.8,
}: GoldShimmerBorderProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div
      className={`gold-shimmer-container relative p-[1.5px] rounded-3xl overflow-hidden group will-change-transform transform-gpu ${className}`}
      style={{ transform: "translateZ(0)" }}
    >
      {/* 360 度顺时针旋转的流光金芒背景 - 移动端或小视口禁用连续动画，改用静态优雅金边 */}
      <motion.div
        animate={isMobile ? undefined : { rotate: 360 }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          opacity: glowOpacity,
          background:
            "conic-gradient(from 0deg at 50% 50%, #c9a227 0%, #fef3c7 25%, #e8c872 50%, #b8860b 75%, #c9a227 100%)",
        }}
        className="shimmer-sweep absolute -inset-[100%] origin-center"
      />

      {/* 内部主体内容（移动端使用温润 92% 暖白色消除毛玻璃高斯模糊重绘，桌面端保留琉璃质感） */}
      <div className="relative z-10 rounded-[22px] bg-[#FAF8F5]/92 md:bg-gradient-to-br md:from-warm-white/95 md:via-warm-cream/90 md:to-ocher-light/40 md:backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}
