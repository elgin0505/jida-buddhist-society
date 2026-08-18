"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface InteractiveZenBoatProps {
  timeMode?: "day" | "dusk" | "night";
}

export function InteractiveZenBoat({ timeMode = "day" }: InteractiveZenBoatProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Target pointer positions
  const targetX = useMotionValue(400);
  const targetY = useMotionValue(450);

  // Spring physics for smooth fluid resistance / inertia
  const springX = useSpring(targetX, { stiffness: 45, damping: 22, mass: 0.8 });
  const springY = useSpring(targetY, { stiffness: 40, damping: 20, mass: 0.9 });

  // Dynamic boat rotation angle based on movement direction
  const [boatAngle, setBoatAngle] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const prevPos = useRef({ x: 400, y: 450 });
  const moveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initial center position in the water layer
    const initX = typeof window !== "undefined" ? window.innerWidth * 0.45 : 400;
    const initY = typeof window !== "undefined" ? window.innerHeight * 0.62 : 450;
    targetX.set(initX);
    targetY.set(initY);
    prevPos.current = { x: initX, y: initY };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;

      // Constrain boat to water layer (between 52% and 82% of screen height)
      const minY = winHeight * 0.52;
      const maxY = winHeight * 0.82;
      const clampedY = Math.max(minY, Math.min(maxY, clientY));

      // Constrain boat to horizontal bounds
      const minX = 60;
      const maxX = winWidth - 60;
      const clampedX = Math.max(minX, Math.min(maxX, clientX));

      // Calculate directional vector and angle
      const dx = clampedX - prevPos.current.x;
      const dy = clampedY - prevPos.current.y;
      const distance = Math.hypot(dx, dy);

      if (distance > 3) {
        setIsMoving(true);
        if (moveTimeout.current) clearTimeout(moveTimeout.current);
        moveTimeout.current = setTimeout(() => setIsMoving(false), 350);

        // Angle in degrees
        const rawDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

        // Determine horizontal orientation
        if (dx < -1) {
          setIsFlipped(true);
          const tilt = Math.max(-25, Math.min(25, -rawDeg + 180));
          setBoatAngle(tilt);
        } else if (dx > 1) {
          setIsFlipped(false);
          const tilt = Math.max(-25, Math.min(25, rawDeg));
          setBoatAngle(tilt);
        }

        prevPos.current = { x: clampedX, y: clampedY };
        targetX.set(clampedX);
        targetY.set(clampedY);
      }
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handlePointerMove);
      if (moveTimeout.current) clearTimeout(moveTimeout.current);
    };
  }, [targetX, targetY]);

  // Subtle natural water bobbing
  const bobbing = {
    y: [0, -3, 0, 2, 0],
    rotate: [0, 1.5, 0, -1.5, 0],
    transition: {
      duration: 4.5,
      repeat: Infinity,
      ease: "easeInOut" as const,
    },
  };

  // Color schemes according to time of day
  const boatColors = {
    day: {
      wood: "#8B5A2B",
      woodHighlight: "#A0522D",
      woodShadow: "#5C3A21",
      robe: "#E8C872",
      robeShadow: "#C9A227",
      hat: "#D2B48C",
      wake: "rgba(255, 255, 255, 0.45)",
      lantern: "#FBBF24",
      lanternGlow: "rgba(251, 191, 36, 0.3)",
    },
    dusk: {
      wood: "#6B3A2B",
      woodHighlight: "#8C4A3A",
      woodShadow: "#421C14",
      robe: "#EA580C",
      robeShadow: "#9A3412",
      hat: "#B45309",
      wake: "rgba(254, 215, 170, 0.4)",
      lantern: "#F97316",
      lanternGlow: "rgba(249, 115, 22, 0.5)",
    },
    night: {
      wood: "#2C3E50",
      woodHighlight: "#34495E",
      woodShadow: "#1A252F",
      robe: "#F59E0B",
      robeShadow: "#B45309",
      hat: "#78716C",
      wake: "rgba(186, 230, 253, 0.3)",
      lantern: "#FCD34D",
      lanternGlow: "rgba(252, 211, 77, 0.8)",
    },
  }[timeMode];

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      <motion.div
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        className="absolute left-0 top-0 cursor-grab active:cursor-grabbing"
      >
        <motion.div
          animate={bobbing}
          style={{
            rotate: boatAngle,
            scaleX: isFlipped ? -1 : 1,
            transformOrigin: "center 70%",
          }}
          className="relative flex items-center justify-center transition-transform duration-300 ease-out"
        >
          {/* Dynamic Water Ripple / Wake behind stern */}
          <div className="absolute -bottom-2 -left-6 h-6 w-24 -translate-y-1">
            <motion.div
              animate={{
                scale: isMoving ? [1, 1.4, 1] : [0.9, 1.1, 0.9],
                opacity: isMoving ? [0.6, 0.2, 0] : [0.25, 0.1, 0],
              }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              className="h-3 w-20 rounded-full"
              style={{
                background: `radial-gradient(ellipse at center, ${boatColors.wake} 0%, transparent 75%)`,
              }}
            />
          </div>

          {/* Boat Shadow on Water */}
          <div
            className="absolute -bottom-1 h-3 w-28 rounded-full blur-[2px]"
            style={{
              background:
                timeMode === "night"
                  ? "rgba(10, 15, 30, 0.7)"
                  : "rgba(15, 45, 60, 0.25)",
            }}
          />

          {/* Pure Code SVG Boat & Monk (一苇渡江 · 独木轻舟) */}
          <svg
            width="120"
            height="70"
            viewBox="0 0 140 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-md select-none"
          >
            <defs>
              {/* Boat Wood Gradients */}
              <linearGradient id="boatHullGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={boatColors.woodHighlight} />
                <stop offset="50%" stopColor={boatColors.wood} />
                <stop offset="100%" stopColor={boatColors.woodShadow} />
              </linearGradient>

              {/* Lantern Glow Filter */}
              <filter id="lanternGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── 1. 小舟船身 (Sleek Wooden Sampan) ── */}
            <path
              d="M 12 55 C 35 68, 105 68, 128 55 C 138 49, 132 46, 120 48 C 95 53, 45 53, 20 48 C 8 46, 2 49, 12 55 Z"
              fill="url(#boatHullGrad)"
            />
            {/* 船舷亮边 (Hull Rim Highlight) */}
            <path
              d="M 16 50 C 45 54, 95 54, 124 50 C 128 49, 125 47, 118 48 C 90 52, 50 52, 22 48 C 15 47, 12 49, 16 50 Z"
              fill={boatColors.woodHighlight}
              opacity="0.8"
            />
            {/* 船舱木纹暗部刻线 */}
            <path
              d="M 30 52 C 55 56, 85 56, 110 52"
              stroke={boatColors.woodShadow}
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.6"
            />

            {/* ── 2. 船头挂灯 (Bow Lantern for Dusk/Night) ── */}
            <g transform="translate(122, 38)">
              <path d="M 0 14 Q 4 4, 2 -2" stroke={boatColors.woodShadow} strokeWidth="1.5" />
              <path d="M 2 -2 L 2 2" stroke="#666" strokeWidth="0.8" />
              <circle
                cx="2"
                cy="6"
                r="10"
                fill={boatColors.lanternGlow}
                filter="url(#lanternGlow)"
              />
              <ellipse cx="2" cy="6" rx="3.5" ry="4.5" fill={boatColors.lantern} />
              <ellipse cx="2" cy="6" rx="1.5" ry="3" fill="#FFFBEB" />
            </g>

            {/* ── 3. 撑篙 (Bamboo Oar/Pole) ── */}
            <motion.line
              x1="52"
              y1="18"
              x2="78"
              y2="68"
              stroke="#A88147"
              strokeWidth="2.2"
              strokeLinecap="round"
              animate={
                isMoving
                  ? {
                      x1: [52, 56, 52],
                      x2: [78, 86, 78],
                      y2: [68, 70, 68],
                    }
                  : {}
              }
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* ── 4. 修行者/小沙弥 (Monk / Scholar Silhouette) ── */}
            <path
              d="M 58 35 C 55 38, 52 48, 50 54 L 72 54 C 70 48, 67 38, 64 35 Z"
              fill={boatColors.robe}
            />
            <path
              d="M 60 36 C 58 43, 56 50, 54 54"
              stroke={boatColors.robeShadow}
              strokeWidth="1.2"
            />
            <motion.path
              d="M 62 38 Q 66 43, 68 45"
              stroke={boatColors.robeShadow}
              strokeWidth="2"
              strokeLinecap="round"
              animate={{ rotate: [0, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            <circle cx="61" cy="27" r="4.5" fill="#FED7AA" />

            {/* 斗笠 (Conical Straw Hat) */}
            <path
              d="M 46 26 L 61 17 L 76 26 C 73 28, 49 28, 46 26 Z"
              fill={boatColors.hat}
            />
            <path
              d="M 61 17 L 61 27"
              stroke={boatColors.woodShadow}
              strokeWidth="0.8"
              opacity="0.4"
            />
            <path
              d="M 53 23 Q 61 25, 69 23"
              stroke={boatColors.woodShadow}
              strokeWidth="0.8"
              fill="none"
              opacity="0.5"
            />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}
