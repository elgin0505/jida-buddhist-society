"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Sun, Sunset, Moon, Sparkles } from "lucide-react";

export type TimeOfDay = "day" | "dusk" | "night";

interface MindfulJourneyProps {
  forcedTimeMode?: TimeOfDay;
  showTimeSwitcher?: boolean;
}

interface LotusParticle {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

export function MindfulJourney({
  forcedTimeMode,
  showTimeSwitcher = true,
}: MindfulJourneyProps) {
  // ── 1. 时间感知系统 (Time-Aware System) ──
  const [detectedTime, setDetectedTime] = useState<TimeOfDay>("day");
  const [manualTime, setManualTime] = useState<TimeOfDay | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 17) {
      setDetectedTime("day");
    } else if (hour >= 17 && hour < 19.5) {
      setDetectedTime("dusk");
    } else {
      setDetectedTime("night");
    }
  }, []);

  const timeMode: TimeOfDay = forcedTimeMode || manualTime || detectedTime;

  // ── 2. 鼠标视差物理平滑过渡 (Smooth Parallax Physics) ──
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 30, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 30, damping: 25 });

  const skyX = useTransform(springX, (v) => v * 0.012);
  const skyY = useTransform(springY, (v) => v * 0.008);
  const celestialX = useTransform(springX, (v) => v * 0.02);
  const celestialY = useTransform(springY, (v) => v * 0.015);
  const mountainX = useTransform(springX, (v) => v * 0.035);
  const mountainY = useTransform(springY, (v) => v * 0.02);
  const riverX = useTransform(springX, (v) => v * 0.06);
  const riverY = useTransform(springY, (v) => v * 0.025);
  const pathX = useTransform(springX, (v) => v * 0.08);
  const pathY = useTransform(springY, (v) => v * 0.03);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set(e.clientX - centerX);
      mouseY.set(e.clientY - centerY);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // ── 3. 交互状态 1：应机说法 (Hover Pause on Procession) ──
  const [isHovered, setIsHovered] = useState(false);

  // ── 4. 交互状态 2：步步生莲 (Step-by-step Lotus Trail) ──
  const [lotuses, setLotuses] = useState<LotusParticle[]>([]);
  const lastSpawnTime = useRef(0);

  const handlePathPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastSpawnTime.current < 110) return;
    lastSpawnTime.current = now;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newLotus: LotusParticle = {
      id: now + Math.random(),
      x,
      y,
      scale: 0.75 + Math.random() * 0.45,
      rotate: (Math.random() - 0.5) * 35,
    };

    setLotuses((prev) => {
      const next = [...prev, newLotus];
      return next.length > 16 ? next.slice(next.length - 16) : next;
    });

    setTimeout(() => {
      setLotuses((prev) => prev.filter((item) => item.id !== newLotus.id));
    }, 2200);
  }, []);

  // ── 5. 主题色彩方案 (白昼、黄昏、夜晚) ──
  const theme = useMemo(() => {
    switch (timeMode) {
      case "dusk":
        return {
          sky: "bg-gradient-to-b from-[#2E1065] via-[#7C2D12] via-[#C2410C] to-[#FED7AA]",
          sunMoon: "from-[#FEF08A] via-[#F97316] to-[#DC2626]",
          sunHalo: "rgba(249, 115, 22, 0.35)",
          farMountains: "#581C87",
          midGhats: "#701A75",
          riverGradStart: "#9A3412",
          riverGradMid: "#C2410C",
          riverGradEnd: "#431407",
          waveColor1: "rgba(254, 215, 170, 0.25)",
          waveColor2: "rgba(251, 146, 60, 0.2)",
          ground1: "#431407",
          ground2: "#78350F",
          pathColor: "#D97706",
          buddhaRobe: "#E11D48",
          discipleRobe: "#D97706",
          waterGleam: "#FDBA74",
        };
      case "night":
        return {
          sky: "bg-gradient-to-b from-[#030712] via-[#0B0F19] via-[#0F172A] to-[#1E293B]",
          sunMoon: "from-[#FEF9C3] via-[#FEF08A] to-[#E2E8F0]",
          sunHalo: "rgba(254, 240, 138, 0.2)",
          farMountains: "#0B1329",
          midGhats: "#0F1E36",
          riverGradStart: "#0F172A",
          riverGradMid: "#1E293B",
          riverGradEnd: "#090D16",
          waveColor1: "rgba(186, 230, 253, 0.15)",
          waveColor2: "rgba(147, 197, 253, 0.1)",
          ground1: "#0F172A",
          ground2: "#1E293B",
          pathColor: "#334155",
          buddhaRobe: "#D97706",
          discipleRobe: "#B45309",
          waterGleam: "#BAE6FD",
        };
      case "day":
      default:
        return {
          sky: "bg-gradient-to-b from-[#38BDF8] via-[#7DD3FC] via-[#BAE6FD] to-[#E0F2FE]",
          sunMoon: "from-[#FEF08A] via-[#FDE047] to-[#F59E0B]",
          sunHalo: "rgba(253, 224, 71, 0.4)",
          farMountains: "#047857",
          midGhats: "#065F46",
          riverGradStart: "#0284C7",
          riverGradMid: "#0EA5E9",
          riverGradEnd: "#0369A1",
          waveColor1: "rgba(255, 255, 255, 0.4)",
          waveColor2: "rgba(224, 242, 254, 0.3)",
          ground1: "#14532D",
          ground2: "#166534",
          pathColor: "#D97706",
          buddhaRobe: "#B45309",
          discipleRobe: "#D97706",
          waterGleam: "#FEF08A",
        };
    }
  }, [timeMode]);

  return (
    <div className="fixed inset-0 z-0 select-none overflow-hidden transition-colors duration-1000">
      {/* ── 核心：队伍严格贴合 SVG 道路贝塞尔曲线起伏的 GPU 动画 ── */}
      <style>{`
        @keyframes walkAlongSvgRoad {
          0% {
            transform: translate(-720px, 163px);
            opacity: 0;
          }
          4% {
            opacity: 1;
          }
          15% {
            transform: translate(0px, 153px);
          }
          28% {
            transform: translate(240px, 123px);
          }
          42% {
            transform: translate(480px, 93px);
          }
          56% {
            transform: translate(720px, 118px);
          }
          70% {
            transform: translate(960px, 78px);
          }
          84% {
            transform: translate(1200px, 38px);
          }
          94% {
            transform: translate(1440px, 23px);
            opacity: 1;
          }
          100% {
            transform: translate(1680px, -17px);
            opacity: 0;
          }
        }
      `}</style>

      {/* ── 1. 天空渐变背景 ── */}
      <div className={`absolute inset-0 ${theme.sky} transition-all duration-1000`} />

      {/* 夜间繁星微光 */}
      {timeMode === "night" && (
        <div className="pointer-events-none absolute inset-0">
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                top: `${(i * 17) % 55}%`,
                left: `${(i * 23) % 98}%`,
                width: i % 3 === 0 ? "3px" : "2px",
                height: i % 3 === 0 ? "3px" : "2px",
                boxShadow: "0 0 6px 1px rgba(255, 255, 255, 0.8)",
              }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: 2.5 + (i % 4),
                repeat: Infinity,
                delay: (i % 5) * 0.4,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* ── 2. 金阳暖日 / 清辉明月 ── */}
      <motion.div
        style={{ x: celestialX, y: celestialY }}
        className="pointer-events-none absolute top-[7%] left-[10%] md:left-[16%]"
      >
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.7, 0.9, 0.7] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-44 w-44 rounded-full blur-2xl"
            style={{ background: theme.sunHalo }}
          />

          {timeMode === "night" ? (
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-tr from-amber-100 via-amber-50 to-white shadow-[0_0_35px_rgba(254,240,138,0.6)]" />
          ) : (
            <div
              className={`h-24 w-24 rounded-full bg-gradient-to-tr ${theme.sunMoon} shadow-[0_0_45px_rgba(245,158,11,0.6)]`}
            />
          )}
        </div>
      </motion.div>

      {/* ── 3. 远天游云 ── */}
      <motion.div
        style={{ x: skyX, y: skyY }}
        className="pointer-events-none absolute inset-x-0 top-[14%] flex justify-between px-8 opacity-70"
      >
        <motion.svg
          animate={{ x: [-25, 25, -25] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          width="260"
          height="80"
          viewBox="0 0 240 80"
          fill="none"
          className="opacity-60"
        >
          <path
            d="M20 55 C 30 35, 60 30, 80 40 C 95 25, 135 25, 155 45 C 175 35, 205 40, 215 55 C 225 65, 20 65, 20 55 Z"
            fill={timeMode === "night" ? "#1E293B" : "#FFFFFF"}
            opacity={timeMode === "night" ? 0.35 : 0.75}
          />
        </motion.svg>
      </motion.div>

      {/* ── 4. 恒河对岸远山与古印度佛塔剪影 ── */}
      <motion.div
        style={{ x: mountainX, y: mountainY }}
        className="pointer-events-none absolute inset-x-0 top-[26%] md:top-[20%] bottom-0"
      >
        <svg viewBox="0 0 1440 600" fill="none" preserveAspectRatio="none" className="h-full w-full">
          <path d="M0 310 Q 240 170, 520 260 T 1020 190 Q 1240 150, 1440 290 L 1440 600 L 0 600 Z" fill={theme.farMountains} opacity="0.5" />
          <path d="M0 360 Q 320 230, 640 330 T 1200 260 Q 1360 280, 1440 370 L 1440 600 L 0 600 Z" fill={theme.midGhats} opacity="0.8" />
          <g transform="translate(560, 210) scale(0.75)" fill={theme.midGhats} opacity="0.95">
            <rect x="10" y="48" width="40" height="18" rx="2" />
            <path d="M 14 48 C 14 26, 46 26, 46 48 Z" />
            <rect x="25" y="20" width="10" height="6" />
            <line x1="30" y1="20" x2="30" y2="4" stroke={theme.midGhats} strokeWidth="2.5" />
            <circle cx="30" cy="3" r="3.5" fill="#F59E0B" />
          </g>
        </svg>
      </motion.div>

      {/* ── 5. 圣河恒河水面层 ── */}
      <motion.div
        style={{ x: riverX, y: riverY }}
        className="pointer-events-none absolute inset-x-0 top-[50%] bottom-0"
      >
        <div
          className="absolute inset-0 transition-all duration-1000"
          style={{
            background: `linear-gradient(180deg, ${theme.riverGradStart} 0%, ${theme.riverGradMid} 45%, ${theme.riverGradEnd} 100%)`,
          }}
        />
        <svg viewBox="0 0 1440 380" fill="none" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <motion.path
            animate={{
              d: [
                "M0 45 Q 360 70, 720 45 T 1440 45 L 1440 380 L 0 380 Z",
                "M0 55 Q 360 30, 720 55 T 1440 55 L 1440 380 L 0 380 Z",
                "M0 45 Q 360 70, 720 45 T 1440 45 L 1440 380 L 0 380 Z",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            fill={theme.waveColor1}
          />
          <motion.path
            animate={{
              d: [
                "M0 95 Q 320 75, 720 95 T 1440 95 L 1440 380 L 0 380 Z",
                "M0 80 Q 320 110, 720 80 T 1440 80 L 1440 380 L 0 380 Z",
                "M0 95 Q 320 75, 720 95 T 1440 95 L 1440 380 L 0 380 Z",
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            fill={theme.waveColor2}
          />
          <g opacity={timeMode === "night" ? 0.3 : 0.5}>
            {[140, 200, 260].map((yPos, i) => (
              <motion.line
                key={i}
                x1={180 + i * 50}
                y1={yPos}
                x2={520 + i * 70}
                y2={yPos}
                stroke={theme.waterGleam}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeDasharray="14 28"
                animate={{ x: [-20, 20, -20], opacity: [0.35, 0.8, 0.35] }}
                transition={{ duration: 4.5 + i, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </g>
        </svg>
      </motion.div>

      {/* ── 6. 近景古道与队伍（统一置于 1440x360 SVG 坐标系中，精准贴合起伏路面） ── */}
      <motion.div
        style={{ x: pathX, y: pathY }}
        className="absolute inset-x-0 bottom-0 top-[60%] z-10 pointer-events-none"
      >
        <div
          onPointerMove={handlePathPointerMove}
          className="pointer-events-auto absolute inset-0 cursor-crosshair"
          title="在古道上滑动鼠标，体验步步生莲"
        >
          {/* 统一的近景与经行 SVG 视口 */}
          <svg
            viewBox="0 0 1440 360"
            fill="none"
            preserveAspectRatio="none"
            className="h-full w-full pointer-events-none overflow-visible"
          >
            <defs>
              <linearGradient id="gangesGroundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={theme.ground2} />
                <stop offset="100%" stopColor={theme.ground1} />
              </linearGradient>
              <linearGradient id="gangesPathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={theme.pathColor} stopOpacity="0.85" />
                <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.6" />
                <stop offset="100%" stopColor={theme.pathColor} stopOpacity="0.9" />
              </linearGradient>
              <radialGradient id="buddhaAuraGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.95" />
                <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
              </radialGradient>
              <filter id="buddhaAuraGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 近景草坡起伏地形 */}
            <path d="M 0 110 Q 280 35, 580 85 T 1140 55 Q 1320 35, 1440 85 L 1440 360 L 0 360 Z" fill="url(#gangesGroundGrad)" />

            {/* 经行古道曲线 (从左下 250px 攀上 190px 峰顶，微降至 215px，再一路攀升至 120px) */}
            <path
              d="M -700 260 C -350 250, 0 250, 240 220 C 480 190, 720 215, 960 175 C 1200 135, 1440 120, 1800 100"
              stroke="url(#gangesPathGrad)"
              strokeWidth="36"
              strokeLinecap="round"
              fill="none"
              opacity={timeMode === "night" ? 0.6 : 0.85}
            />
            {/* 古道青石路标与金光石痕 */}
            <path
              d="M -700 260 C -350 250, 0 250, 240 220 C 480 190, 720 215, 960 175 C 1200 135, 1440 120, 1800 100"
              stroke="#FEF3C7"
              strokeWidth="2.5"
              strokeDasharray="6 18"
              fill="none"
              opacity={timeMode === "night" ? 0.3 : 0.5}
            />

            {/* 菩提古树 */}
            <g transform="translate(40, 5)">
              <path d="M 65 170 Q 60 105, 82 60 Q 88 38, 76 5" stroke="#291407" strokeWidth="12" strokeLinecap="round" fill="none" />
              <path d="M 76 75 Q 120 52, 145 30" stroke="#291407" strokeWidth="6" strokeLinecap="round" fill="none" />
              <circle cx="76" cy="12" r="32" fill={theme.ground2} opacity="0.9" />
              <circle cx="120" cy="22" r="28" fill={theme.ground1} opacity="0.85" />
              <circle cx="50" cy="26" r="24" fill={theme.ground2} opacity="0.9" />
            </g>

            {/* ── 核心队伍：精准随道路曲线行进的 SVG 编组 ── */}
            <g
              style={{
                animation: "walkAlongSvgRoad 80s linear infinite",
                animationPlayState: isHovered ? "paused" : "running",
                willChange: "transform, opacity",
              }}
              className="pointer-events-auto cursor-pointer"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {/* ─────────────────────────────────────────────────────────────
               * 领队：佛陀 (The Buddha)
               * ───────────────────────────────────────────────────────────── */}
              <g transform="translate(580, 0)">
                {/* 佛陀金色神圣背光 */}
                <motion.circle
                  cx="0"
                  cy="-12"
                  r="26"
                  fill="url(#buddhaAuraGrad)"
                  filter="url(#buddhaAuraGlow)"
                  animate={
                    isHovered
                      ? { scale: [1.3, 1.45, 1.3], opacity: [0.85, 1, 0.85] }
                      : { scale: [1, 1.12, 1], opacity: [0.55, 0.75, 0.55] }
                  }
                  transition={{ duration: isHovered ? 2 : 4, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* 独立 Y 轴经行浮沉 */}
                <motion.g animate={isHovered ? { y: 0 } : { y: [0, -4, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}>
                  <path d="M -12 18 C -14 36, -18 72, -22 96 L 22 96 C 18 72, 14 36, 12 18 Z" fill={theme.buddhaRobe} />
                  <path d="M -8 22 Q 4 50, 16 96" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                  <path d="M -12 40 Q 0 65, 8 96" stroke="#78350F" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
                  <motion.g animate={isHovered ? { rotate: 0 } : { rotate: [-1.5, 1.5, -1.5] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}>
                    <path d="M -6 32 C -2 38, 12 38, 16 32" stroke="#FED7AA" strokeWidth="3" strokeLinecap="round" />
                    <ellipse cx="6" cy="31" rx="6.5" ry="4" fill="#1C1917" />
                    <ellipse cx="6" cy="30" rx="5.5" ry="2" fill="#44403C" />
                  </motion.g>
                  <circle cx="0" cy="-6" r="9.5" fill="#FED7AA" />
                  <circle cx="0" cy="-16" r="4.5" fill="#451A03" />
                  <ellipse cx="0" cy="-8" rx="10" ry="8" fill="#451A03" opacity="0.8" />
                  <motion.ellipse cx="-8" cy="97" rx="5.5" ry="2.6" fill="#451A03" animate={isHovered ? { x: 0 } : { x: [-3, 3, -3] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} />
                  <motion.ellipse cx="8" cy="97" rx="5.5" ry="2.6" fill="#451A03" animate={isHovered ? { x: 0 } : { x: [3, -3, 3] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} />
                </motion.g>
              </g>

              {/* ─────────────────────────────────────────────────────────────
               * 随行：十大弟子 (Ten Disciples)
               * ───────────────────────────────────────────────────────────── */}
              {[
                { name: "舍利弗", x: 480, height: 86, scale: 0.94, delay: 0.3 },
                { name: "目犍连", x: 425, height: 88, scale: 0.95, delay: 0.6 },
                { name: "大迦叶", x: 370, height: 84, scale: 0.92, delay: 0.9 },
                { name: "阿难陀", x: 320, height: 82, scale: 0.90, delay: 1.2 },
                { name: "须菩提", x: 270, height: 85, scale: 0.93, delay: 1.5 },
                { name: "富楼那", x: 220, height: 83, scale: 0.91, delay: 1.8 },
                { name: "迦旃延", x: 170, height: 85, scale: 0.92, delay: 2.1 },
                { name: "阿那律", x: 120, height: 82, scale: 0.90, delay: 2.4 },
                { name: "优婆离", x: 70, height: 80, scale: 0.88, delay: 2.7 },
                { name: "罗睺罗", x: 20, height: 78, scale: 0.86, delay: 3.0 },
              ].map((disciple) => (
                <g key={disciple.name} transform={`translate(${disciple.x}, ${97 - disciple.height * disciple.scale}) scale(${disciple.scale})`}>
                  <motion.g
                    animate={isHovered ? { y: 0 } : { y: [0, -3.2, 0] }}
                    transition={{ duration: 3.6, repeat: Infinity, delay: disciple.delay, ease: "easeInOut" }}
                  >
                    <path d={`M -9 15 C -11 30, -14 60, -17 ${disciple.height} L 17 ${disciple.height} C 14 60, 11 30, 9 15 Z`} fill={theme.discipleRobe} />
                    <path d={`M -6 18 Q 2 45, 12 ${disciple.height}`} stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                    <circle cx="0" cy="-2" r="7.5" fill="#FED7AA" />
                    <circle cx="0" cy="-2" r="8" fill="#78350F" opacity="0.25" />
                    {disciple.x % 2 === 0 ? (
                      <motion.line x1="7" y1="-8" x2="13" y2={disciple.height} stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" animate={isHovered ? { rotate: 0 } : { rotate: [-4, 4, -4] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "7px -8px" }} />
                    ) : (
                      <ellipse cx="2" cy="24" rx="4.5" ry="3" fill="#451A03" opacity="0.8" />
                    )}
                    <motion.ellipse cx="-6" cy={disciple.height + 1} rx="4.5" ry="2" fill="#451A03" animate={isHovered ? { x: 0 } : { x: [-2.5, 2.5, -2.5] }} transition={{ duration: 3.6, repeat: Infinity, delay: disciple.delay, ease: "easeInOut" }} />
                    <motion.ellipse cx="6" cy={disciple.height + 1} rx="4.5" ry="2" fill="#451A03" animate={isHovered ? { x: 0 } : { x: [2.5, -2.5, 2.5] }} transition={{ duration: 3.6, repeat: Infinity, delay: disciple.delay, ease: "easeInOut" }} />
                  </motion.g>
                </g>
              ))}
            </g>
          </svg>

          {/* ── 应机说法微提示 ── */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-500/30 px-4 py-1.5 text-xs font-medium text-amber-950 dark:text-amber-100 backdrop-blur-md shadow-xl"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                <span>佛陀应机说法 · 身心寂静</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 步步生莲 ── */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <AnimatePresence>
              {lotuses.map((item) => (
                <motion.div
                  key={item.id}
                  style={{
                    position: "absolute",
                    left: item.x,
                    top: item.y,
                    transform: `translate(-50%, -50%) rotate(${item.rotate}deg)`,
                  }}
                  initial={{ scale: 0, opacity: 0, y: 5 }}
                  animate={{ scale: [0, item.scale * 1.15, item.scale], opacity: [0, 0.95, 0], y: -18 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 2.1, ease: "easeOut" }}
                >
                  <svg width="44" height="44" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_8px_rgba(245,158,11,0.65)]">
                    <defs>
                      <linearGradient id="lotusPetalGold" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="60%" stopColor="#FEF08A" />
                        <stop offset="100%" stopColor="#FFFFFF" />
                      </linearGradient>
                    </defs>
                    <path d="M 30 10 C 24 24, 24 38, 30 46 C 36 38, 36 24, 30 10 Z" fill="url(#lotusPetalGold)" />
                    <path d="M 16 20 C 18 32, 24 40, 30 46 C 24 42, 16 30, 16 20 Z" fill="url(#lotusPetalGold)" opacity="0.9" />
                    <path d="M 44 20 C 42 32, 36 40, 30 46 C 36 42, 44 30, 44 20 Z" fill="url(#lotusPetalGold)" opacity="0.9" />
                    <path d="M 8 30 C 14 38, 22 44, 30 46 C 20 44, 12 36, 8 30 Z" fill="url(#lotusPetalGold)" opacity="0.75" />
                    <path d="M 52 30 C 46 38, 38 44, 30 46 C 40 44, 48 36, 52 30 Z" fill="url(#lotusPetalGold)" opacity="0.75" />
                    <circle cx="30" cy="42" r="4.5" fill="#FEF08A" />
                    <circle cx="30" cy="42" r="2" fill="#F59E0B" />
                  </svg>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ── 7. 优雅时光切换药丸 (白昼、黄昏、夜晚) ── */}
      {showTimeSwitcher && (
        <div className="absolute top-4 right-4 z-40 pointer-events-auto">
          <div className="flex items-center gap-1 rounded-full border border-white/30 bg-white/20 p-1 backdrop-blur-xl shadow-lg dark:bg-black/30 dark:border-white/10">
            <button
              onClick={() => setManualTime("day")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                timeMode === "day"
                  ? "bg-amber-400 text-amber-950 shadow-sm font-semibold"
                  : "text-white/80 hover:text-white"
              }`}
              title="清晨/白天"
            >
              <Sun className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">白天</span>
            </button>
            <button
              onClick={() => setManualTime("dusk")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                timeMode === "dusk"
                  ? "bg-orange-500 text-white shadow-sm font-semibold"
                  : "text-white/80 hover:text-white"
              }`}
              title="暮鼓黄昏"
            >
              <Sunset className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">黄昏</span>
            </button>
            <button
              onClick={() => setManualTime("night")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                timeMode === "night"
                  ? "bg-indigo-600 text-white shadow-sm font-semibold"
                  : "text-white/80 hover:text-white"
              }`}
              title="静夜繁星"
            >
              <Moon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">夜晚</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
