"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  3D 悬浮 Logo 组件 (3D Parallax Hover Logo)
 *  鼠标移动时产生 3D 倾斜 + 金色呼吸光晕
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface ZenLogo3DProps {
  className?: string;
}

export function ZenLogo3D({ className = "" }: ZenLogo3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);

  // Motion values for mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring-dampened rotation for smooth 3D tilt
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), {
    stiffness: 150,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), {
    stiffness: 150,
    damping: 20,
  });

  // Glow intensity based on mouse distance from center
  const glowIntensity = useSpring(
    useTransform(
      mouseX,
      [-0.5, 0, 0.5],
      [0.4, 0.7, 0.4]
    ),
    { stiffness: 100, damping: 25 }
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: -30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`relative z-10 mb-8 flex flex-col items-center text-center ${className}`}
      style={{ perspective: 800 }}
    >
      {/* 3D 倾斜容器 */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative mb-5"
      >
        {/* 外层呼吸金色光晕 */}
        <motion.div
          animate={{
            boxShadow: [
              "0 0 30px rgba(201, 162, 39, 0.35), 0 0 60px rgba(255, 179, 0, 0.15), 0 0 90px rgba(255, 193, 7, 0.08)",
              "0 0 40px rgba(201, 162, 39, 0.55), 0 0 80px rgba(255, 179, 0, 0.25), 0 0 120px rgba(255, 193, 7, 0.12)",
              "0 0 30px rgba(201, 162, 39, 0.35), 0 0 60px rgba(255, 179, 0, 0.15), 0 0 90px rgba(255, 193, 7, 0.08)",
            ],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="h-[88px] w-[88px] rounded-[26px] overflow-hidden"
        >
          {/* Logo 图像或占位符 */}
          {!imgError ? (
            <Image
              src="/logo.png"
              alt="技大佛学会"
              width={88}
              height={88}
              priority
              onError={() => setImgError(true)}
              className="h-full w-full object-contain mix-blend-multiply dark:invert dark:mix-blend-screen"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-golden-deep via-ocher to-golden-rich">
              <span className="text-3xl font-black text-white tracking-tight">佛</span>
            </div>
          )}
        </motion.div>

        {/* 底部反射光 (3D 深度提示) */}
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-4 w-16 rounded-full opacity-20 blur-md"
          style={{
            background: "radial-gradient(ellipse, rgba(201, 162, 39, 0.6) 0%, transparent 70%)",
          }}
        />
      </motion.div>

      {/* 标题文字 */}
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-[26px] font-bold tracking-tight text-charcoal dark:text-white sm:text-3xl"
      >
        技大佛学会
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.5 }}
        className="mt-1.5 text-sm font-medium text-muted/80 dark:text-slate-400"
      >
        出勤与积分追踪 · 会员系统
      </motion.p>
    </motion.div>
  );
}
