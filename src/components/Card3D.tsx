"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glow?: boolean;
}

export function Card3D({ children, className = "", intensity = 15, glow = true }: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDesktopPointer, setIsDesktopPointer] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsDesktopPointer(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktopPointer(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [intensity, -intensity]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-intensity, intensity]), {
    stiffness: 300,
    damping: 30,
  });

  const glossX = useTransform(mouseX, [0, 1], ["0%", "100%"]);
  const glossY = useTransform(mouseY, [0, 1], ["0%", "100%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesktopPointer || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    if (isDesktopPointer) setIsHovered(true);
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <div
      style={isDesktopPointer ? { perspective: 1200 } : undefined}
      className="card-3d-root relative will-change-transform transform-gpu"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={
          isDesktopPointer
            ? {
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }
            : {
                transform: "translateZ(0)",
              }
        }
        className={`card-3d-inner relative overflow-hidden rounded-3xl transition-shadow duration-300 will-change-transform ${className}`}
      >
        {children}

        {/* 桌面端：3D 物理反光流光层 (Glass Specular Sheen) - 仅在 hover:hover 和 pointer:fine 下运行 */}
        {glow && isDesktopPointer && (
          <motion.div
            className="card-3d-glare-desktop pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300"
            style={{
              opacity: isHovered ? 0.35 : 0,
              background: `radial-gradient(circle at ${glossX.get()} ${glossY.get()}, rgba(255, 255, 255, 0.8) 0%, rgba(201, 162, 39, 0.15) 35%, transparent 70%)`,
            }}
          />
        )}

        {/* 移动触控端：干净、静态的高质感微光渐变层，无昂贵的鼠标坐标监听与重绘 */}
        {glow && !isDesktopPointer && (
          <div
            className="card-3d-glare-mobile pointer-events-none absolute inset-0 rounded-3xl opacity-40"
            style={{
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, rgba(201, 162, 39, 0.08) 40%, transparent 80%)",
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
