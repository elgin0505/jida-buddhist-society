"use client";

import React from "react";
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
  return (
    <div className={`relative p-[1.5px] rounded-3xl overflow-hidden group ${className}`}>
      {/* 360 度顺时针旋转的流光金芒背景 */}
      <motion.div
        animate={{ rotate: 360 }}
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
        className="absolute -inset-[100%] origin-center"
      />

      {/* 内部主体内容（衬在毛玻璃底层之上） */}
      <div className="relative z-10 rounded-[22px] bg-gradient-to-br from-warm-white/95 via-warm-cream/90 to-ocher-light/40 backdrop-blur-xl">
        {children}
      </div>
    </div>
  );
}
