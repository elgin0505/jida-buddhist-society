"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Sun, Sunset, Moon } from "lucide-react";

const LoginZenScene = dynamic(() => import("@/components/LoginZenScene"), {
  ssr: false,
});

export type TimeOfDay = "day" | "dusk" | "night";

interface MindfulJourneyProps {
  forcedTimeMode?: TimeOfDay;
  showTimeSwitcher?: boolean;
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
          waterGleam: "#FEF08A",
        };
    }
  }, [timeMode]);

  return (
    <div className="fixed inset-0 z-0 select-none overflow-hidden transition-colors duration-1000">
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

      {/* ── 5.5 3D 禅境生灵水景 · 亭台天鹅 · 浮莲微光（无缝融合层） ── */}
      <div className="absolute inset-0 z-[8] pointer-events-auto overflow-hidden">
        <LoginZenScene timeMode={timeMode} />
      </div>

      {/* ── 6. 近景古道与菩提古树（宁静自然的恒河河岸底层修饰） ── */}
      <motion.div
        style={{ x: pathX, y: pathY }}
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[72%] z-[9] opacity-60"
      >
        <div className="pointer-events-none absolute inset-0">
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
            </defs>

            {/* 近景草坡起伏地形 */}
            <path d="M 0 110 Q 280 35, 580 85 T 1140 55 Q 1320 35, 1440 85 L 1440 360 L 0 360 Z" fill="url(#gangesGroundGrad)" />

            {/* 经行古道曲线 */}
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
          </svg>
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
