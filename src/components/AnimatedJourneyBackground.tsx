"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { InteractiveZenBoat } from "@/components/InteractiveZenBoat";
import { Sun, Sunset, Moon } from "lucide-react";

export type TimeOfDay = "day" | "dusk" | "night";

interface AnimatedJourneyBackgroundProps {
  forcedTimeMode?: TimeOfDay;
  showTimeSwitcher?: boolean;
}

export function AnimatedJourneyBackground({
  forcedTimeMode,
  showTimeSwitcher = true,
}: AnimatedJourneyBackgroundProps) {
  // System time auto-detection
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

  // ── Framer Motion Mouse Parallax Tracking ──
  const rawMouseX = useMotionValue(0);
  const rawMouseY = useMotionValue(0);

  const springX = useSpring(rawMouseX, { stiffness: 45, damping: 25 });
  const springY = useSpring(rawMouseY, { stiffness: 45, damping: 25 });

  // Parallax multipliers for each visual depth layer
  const skyX = useTransform(springX, (v) => v * 0.015);
  const skyY = useTransform(springY, (v) => v * 0.012);

  const celestialX = useTransform(springX, (v) => v * 0.025);
  const celestialY = useTransform(springY, (v) => v * 0.02);

  const mountainX = useTransform(springX, (v) => v * 0.045);
  const mountainY = useTransform(springY, (v) => v * 0.025);

  const midgroundX = useTransform(springX, (v) => v * 0.07);
  const midgroundY = useTransform(springY, (v) => v * 0.035);

  const foregroundX = useTransform(springX, (v) => v * 0.11);
  const foregroundY = useTransform(springY, (v) => v * 0.05);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      rawMouseX.set(e.clientX - centerX);
      rawMouseY.set(e.clientY - centerY);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [rawMouseX, rawMouseY]);

  // Dynamic Theme Gradients and Palettes
  const theme = useMemo(() => {
    switch (timeMode) {
      case "dusk":
        return {
          sky: "bg-gradient-to-b from-[#2E1065] via-[#7C2D12] via-[#C2410C] to-[#FED7AA]",
          sunMoon: "from-[#FEF08A] via-[#F97316] to-[#DC2626]",
          sunHalo: "rgba(249, 115, 22, 0.28)",
          farMountain: "#581C87",
          midMountain: "#701A75",
          nearHills: "#831843",
          waterGradStart: "#9A3412",
          waterGradMid: "#C2410C",
          waterGradEnd: "#431407",
          waveColor1: "rgba(254, 215, 170, 0.25)",
          waveColor2: "rgba(251, 146, 60, 0.2)",
          ground1: "#431407",
          ground2: "#78350F",
          pathColor: "#D97706",
          lanternGlow: true,
        };
      case "night":
        return {
          sky: "bg-gradient-to-b from-[#030712] via-[#0B0F19] via-[#0F172A] to-[#1E293B]",
          sunMoon: "from-[#FEF9C3] via-[#FEF08A] to-[#E2E8F0]",
          sunHalo: "rgba(254, 240, 138, 0.18)",
          farMountain: "#0B1329",
          midMountain: "#0F1E36",
          nearHills: "#162B4D",
          waterGradStart: "#0F172A",
          waterGradMid: "#1E293B",
          waterGradEnd: "#090D16",
          waveColor1: "rgba(186, 230, 253, 0.15)",
          waveColor2: "rgba(147, 197, 253, 0.1)",
          ground1: "#0F172A",
          ground2: "#1E293B",
          pathColor: "#475569",
          lanternGlow: true,
        };
      case "day":
      default:
        return {
          sky: "bg-gradient-to-b from-[#38BDF8] via-[#7DD3FC] via-[#BAE6FD] to-[#E0F2FE]",
          sunMoon: "from-[#FEF08A] via-[#FDE047] to-[#F59E0B]",
          sunHalo: "rgba(253, 224, 71, 0.35)",
          farMountain: "#047857",
          midMountain: "#065F46",
          nearHills: "#064E3B",
          waterGradStart: "#0284C7",
          waterGradMid: "#0EA5E9",
          waterGradEnd: "#0369A1",
          waveColor1: "rgba(255, 255, 255, 0.4)",
          waveColor2: "rgba(224, 242, 254, 0.3)",
          ground1: "#14532D",
          ground2: "#166534",
          pathColor: "#D97706",
          lanternGlow: false,
        };
    }
  }, [timeMode]);

  return (
    <div className="fixed inset-0 z-0 select-none overflow-hidden transition-colors duration-1000">
      {/* ── 1. 天空渐变层 (Sky Gradient) ── */}
      <div className={`absolute inset-0 ${theme.sky} transition-all duration-1000`} />

      {/* 夜空闪烁星光粒子 (Stars on Night mode) */}
      {timeMode === "night" && (
        <div className="pointer-events-none absolute inset-0">
          {[...Array(35)].map((_, i) => (
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
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2 + (i % 4),
                repeat: Infinity,
                delay: (i % 5) * 0.5,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}

      {/* ── 2. 天体层 (Sun / Moon with Parallax) ── */}
      <motion.div
        style={{ x: celestialX, y: celestialY }}
        className="pointer-events-none absolute top-[8%] left-[12%] md:left-[18%]"
      >
        <div className="relative flex items-center justify-center">
          {/* 大气辉光光晕 */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.7, 0.9, 0.7] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-44 w-44 rounded-full blur-2xl"
            style={{ background: theme.sunHalo }}
          />

          {timeMode === "night" ? (
            /* 禅意明月 (Moon) */
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-tr from-amber-100 via-amber-50 to-white shadow-[0_0_35px_rgba(254,240,138,0.6)]">
              <div className="absolute right-1 top-2 h-16 w-16 rounded-full bg-transparent shadow-[-4px_3px_0_0_rgba(15,23,42,0.15)]" />
            </div>
          ) : (
            /* 金乌红日 (Radiant Sun) */
            <div
              className={`h-24 w-24 rounded-full bg-gradient-to-tr ${theme.sunMoon} shadow-[0_0_45px_rgba(245,158,11,0.6)]`}
            />
          )}
        </div>
      </motion.div>

      {/* ── 3. 远天浮云 (Floating Zen Clouds) ── */}
      <motion.div
        style={{ x: skyX, y: skyY }}
        className="pointer-events-none absolute inset-x-0 top-[14%] flex justify-between px-10 opacity-70"
      >
        <motion.svg
          animate={{ x: [-20, 20, -20] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          width="240"
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

        <motion.svg
          animate={{ x: [20, -20, 20] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          width="280"
          height="90"
          viewBox="0 0 280 90"
          fill="none"
          className="hidden md:block opacity-50"
        >
          <path
            d="M30 60 C 45 40, 85 35, 110 48 C 130 30, 175 30, 200 50 C 225 40, 255 45, 265 60 C 275 70, 30 70, 30 60 Z"
            fill={timeMode === "night" ? "#334155" : "#FFFFFF"}
            opacity={timeMode === "night" ? 0.3 : 0.65}
          />
        </motion.svg>
      </motion.div>

      {/* ── 4. 远山叠嶂 (Distant Mountains Layer) ── */}
      <motion.div
        style={{ x: mountainX, y: mountainY }}
        className="pointer-events-none absolute inset-x-0 top-[28%] md:top-[22%] bottom-0"
      >
        <svg
          viewBox="0 0 1440 600"
          fill="none"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          {/* 最远景山峦 (Far Distant Peaks) */}
          <path
            d="M0 320 Q 220 180, 480 270 T 960 210 Q 1200 160, 1440 300 L 1440 600 L 0 600 Z"
            fill={theme.farMountain}
            opacity="0.55"
          />
          {/* 中景山峰与宝塔剪影 (Mid Mountain & Pagoda) */}
          <path
            d="M0 370 Q 300 240, 620 340 T 1180 280 Q 1340 290, 1440 380 L 1440 600 L 0 600 Z"
            fill={theme.midMountain}
            opacity="0.8"
          />
          {/* 远山上的佛寺宝塔剪影 (Zen Pagoda on mountain peak) */}
          <g transform="translate(480, 200) scale(0.65)" fill={theme.midMountain} opacity="0.9">
            <rect x="22" y="55" width="16" height="35" rx="1" />
            <polygon points="10,55 50,55 30,42" />
            <rect x="24" y="30" width="12" height="15" />
            <polygon points="14,30 46,30 30,20" />
            <rect x="26" y="12" width="8" height="10" />
            <polygon points="18,12 42,12 30,5" />
            <line x1="30" y1="5" x2="30" y2="-8" stroke={theme.midMountain} strokeWidth="2" />
            <circle cx="30" cy="-8" r="2.5" fill="#F59E0B" />
          </g>
        </svg>
      </motion.div>

      {/* ── 5. 水波纹湖面层 (Lake / River Surface Layer) ── */}
      <motion.div
        style={{ x: midgroundX, y: midgroundY }}
        className="pointer-events-none absolute inset-x-0 top-[52%] bottom-0"
      >
        {/* 水面底色渐变 */}
        <div
          className="absolute inset-0 transition-all duration-1000"
          style={{
            background: `linear-gradient(180deg, ${theme.waterGradStart} 0%, ${theme.waterGradMid} 45%, ${theme.waterGradEnd} 100%)`,
          }}
        />

        {/* 动态滚动 SVG 水波纹 (Animated Wave Ripples) */}
        <svg
          viewBox="0 0 1440 380"
          fill="none"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {/* 水波纹第 1 层 */}
          <motion.path
            animate={{ d: [
              "M0 40 Q 360 65, 720 40 T 1440 40 L 1440 380 L 0 380 Z",
              "M0 50 Q 360 25, 720 50 T 1440 50 L 1440 380 L 0 380 Z",
              "M0 40 Q 360 65, 720 40 T 1440 40 L 1440 380 L 0 380 Z",
            ]}}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            fill={theme.waveColor1}
          />
          {/* 水波纹第 2 层 */}
          <motion.path
            animate={{ d: [
              "M0 90 Q 320 70, 720 90 T 1440 90 L 1440 380 L 0 380 Z",
              "M0 75 Q 320 105, 720 75 T 1440 75 L 1440 380 L 0 380 Z",
              "M0 90 Q 320 70, 720 90 T 1440 90 L 1440 380 L 0 380 Z",
            ]}}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            fill={theme.waveColor2}
          />
          {/* 金色水光倒影条纹 (Gleaming reflection lines) */}
          <g opacity={timeMode === "night" ? 0.25 : 0.45}>
            {[130, 190, 250, 310].map((yPos, i) => (
              <motion.line
                key={i}
                x1={200 + i * 40}
                y1={yPos}
                x2={500 + i * 60}
                y2={yPos}
                stroke={timeMode === "dusk" ? "#FDBA74" : timeMode === "night" ? "#BAE6FD" : "#FEF08A"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="16 24"
                animate={{ x: [-15, 15, -15], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </g>
        </svg>

        {/* ── 核心互动模块：鼠标牵引的一苇渡江小舟 (Interactive Zen Boat) ── */}
        <InteractiveZenBoat timeMode={timeMode} />
      </motion.div>

      {/* ── 6. 近景陆地、蜿蜒求学路与学子小沙弥 (Foreground Land & Walking Monk) ── */}
      <motion.div
        style={{ x: foregroundX, y: foregroundY }}
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[68%] z-10"
      >
        <svg
          viewBox="0 0 1440 340"
          fill="none"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <defs>
            {/* 陆地渐变 */}
            <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={theme.ground2} />
              <stop offset="100%" stopColor={theme.ground1} />
            </linearGradient>
            {/* 蜿蜒小路渐变 */}
            <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={theme.pathColor} stopOpacity="0.8" />
              <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.5" />
              <stop offset="100%" stopColor={theme.pathColor} stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* 近景起伏草坡 */}
          <path
            d="M 0 120 Q 260 40, 560 90 T 1100 60 Q 1300 40, 1440 90 L 1440 340 L 0 340 Z"
            fill="url(#groundGrad)"
          />

          {/* 蜿蜒求学路 (The Winding Path) */}
          <path
            d="M 0 240 C 140 210, 240 160, 360 170 C 460 180, 520 120, 680 110"
            stroke="url(#pathGrad)"
            strokeWidth="28"
            strokeLinecap="round"
            fill="none"
            opacity="0.75"
          />
          {/* 路面石阶纹理 */}
          <path
            d="M 0 240 C 140 210, 240 160, 360 170 C 460 180, 520 120, 680 110"
            stroke="#FEF3C7"
            strokeWidth="2"
            strokeDasharray="4 14"
            fill="none"
            opacity="0.4"
          />

          {/* 禅意菩提树 / 垂柳剪影 (Zen Tree on left cliff) */}
          <g transform="translate(40, 10)">
            {/* 树干 */}
            <path
              d="M 60 160 Q 55 100, 75 60 Q 80 40, 70 10"
              stroke="#291407"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 70 70 Q 110 50, 130 30"
              stroke="#291407"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            {/* 树冠绿云 */}
            <circle cx="70" cy="15" r="28" fill={theme.ground2} opacity="0.9" />
            <circle cx="110" cy="25" r="24" fill={theme.ground1} opacity="0.85" />
            <circle cx="48" cy="28" r="22" fill={theme.ground2} opacity="0.9" />
          </g>

          {/* ── 步行的小沙弥/求学子 (Walking Novice Monk) ── */}
          <g transform="translate(240, 110)">
            <motion.g
              animate={{
                y: [0, -6, 0],
                rotate: [-1.5, 1.5, -1.5],
              }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* 行囊 / 书笈 (Backpack / Scroll Case) */}
              <rect x="-14" y="-2" width="11" height="18" rx="2" fill="#78350F" />
              <line x1="-9" y1="-2" x2="-9" y2="16" stroke="#FEF3C7" strokeWidth="1" opacity="0.6" />
              <rect x="-16" y="-6" width="15" height="5" rx="1.5" fill="#92400E" />

              {/* 僧袍身体 (Monk Robe) */}
              <path
                d="M -5 4 C -6 8, -8 18, -10 24 L 10 24 C 8 18, 6 8, 5 4 Z"
                fill="#D97706"
              />
              <path d="M 0 5 L -2 24" stroke="#B45309" strokeWidth="1" />

              {/* 头部与斗笠 */}
              <circle cx="0" cy="-3" r="4.5" fill="#FED7AA" />
              {/* 斗笠 */}
              <polygon points="-12,-4 0,-14 12,-4" fill="#D2B48C" />
              <line x1="0" y1="-14" x2="0" y2="-4" stroke="#92400E" strokeWidth="0.8" opacity="0.5" />

              {/* 行走竹杖 (Walking Bamboo Staff) */}
              <motion.line
                x1="8"
                y1="-6"
                x2="14"
                y2="28"
                stroke="#78350F"
                strokeWidth="1.8"
                strokeLinecap="round"
                animate={{ rotate: [-8, 8, -8] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "8px -6px" }}
              />

              {/* 脚步踏行 (Steps) */}
              <motion.ellipse
                cx="-4"
                cy="25"
                rx="3.5"
                ry="1.8"
                fill="#451A03"
                animate={{ x: [-2, 3, -2] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.ellipse
                cx="4"
                cy="25"
                rx="3.5"
                ry="1.8"
                fill="#451A03"
                animate={{ x: [3, -2, 3] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.g>
          </g>
        </svg>
      </motion.div>

      {/* ── 7. 优雅时光切换药丸 (Interactive Time-of-Day Pill Switcher) ── */}
      {showTimeSwitcher && (
        <div className="absolute top-4 right-4 z-40">
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
