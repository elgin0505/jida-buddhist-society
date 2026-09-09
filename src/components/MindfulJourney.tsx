"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
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

  // ── 2. 静止平稳视角（不随鼠标晃动） ──
  const skyX = 0;
  const skyY = 0;
  const celestialX = 0;
  const celestialY = 0;
  const mountainX = 0;
  const mountainY = 0;
  const riverX = 0;
  const riverY = 0;
  const pathX = 0;
  const pathY = 0;

  // ── 5. 主题色彩方案 (白昼、黄昏、夜晚) ──
  const theme = useMemo(() => {
    switch (timeMode) {
      case "dusk":
        return {
          skyGradient:
            "linear-gradient(180deg, #F43F5E 0%, #FB7185 16%, #FB923C 44%, #FDBA74 68%, #FDE047 88%, #FEF9C3 100%)",
          sunMoon: "from-[#FFF7ED] via-[#FDBA74] to-[#F97316]",
          sunHalo: "rgba(251, 146, 60, 0.85)",
          cloudColor1: "rgba(254, 215, 170, 0.88)",
          cloudColor2: "rgba(251, 146, 60, 0.65)",
          cloudColor3: "rgba(253, 186, 116, 0.45)",
          farMountains: "#FB923C",
          midGhats: "#EA580C",
          riverGradStart: "#EA580C",
          riverGradMid: "#F97316",
          riverGradEnd: "#C2410C",
          waveColor1: "rgba(254, 215, 170, 0.55)",
          waveColor2: "rgba(251, 146, 60, 0.45)",
          ground1: "#7C2D12",
          ground2: "#9A3412",
          pathColor: "#F59E0B",
          waterGleam: "#FED7AA",
        };
      case "night":
        return {
          skyGradient:
            "linear-gradient(180deg, #030712 0%, #0B132B 35%, #0F172A 70%, #1E293B 100%)",
          sunMoon: "from-[#FEF9C3] via-[#FEF08A] to-[#E2E8F0]",
          sunHalo: "rgba(254, 240, 138, 0.25)",
          cloudColor1: "rgba(51, 65, 85, 0.55)",
          cloudColor2: "rgba(30, 41, 59, 0.45)",
          cloudColor3: "rgba(148, 163, 184, 0.25)",
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
          skyGradient:
            "linear-gradient(180deg, #38BDF8 0%, #7DD3FC 28%, #BAE6FD 58%, #E0F2FE 82%, #FFFFFF 100%)",
          sunMoon: "from-[#FFFBEB] via-[#FDE047] to-[#F59E0B]",
          sunHalo: "rgba(253, 224, 71, 0.85)",
          cloudColor1: "rgba(255, 255, 255, 0.94)",
          cloudColor2: "rgba(240, 249, 255, 0.78)",
          cloudColor3: "rgba(224, 242, 254, 0.55)",
          farMountains: "#10B981",
          midGhats: "#059669",
          riverGradStart: "#0284C7",
          riverGradMid: "#38BDF8",
          riverGradEnd: "#0EA5E9",
          waveColor1: "rgba(255, 255, 255, 0.65)",
          waveColor2: "rgba(224, 242, 254, 0.55)",
          ground1: "#166534",
          ground2: "#15803D",
          pathColor: "#F59E0B",
          waterGleam: "#FEF08A",
        };
    }
  }, [timeMode]);

  return (
    <div className="fixed inset-0 z-0 select-none overflow-hidden transition-colors duration-1000">
      {/* ── 1. 天空渐变背景（保证百分百高亮通透） ── */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{ background: theme.skyGradient }}
      />

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

      {/* ── 2. 天际暖阳/清辉月轮与远天游云 ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* ── 太阳 / 月轮 ── */}
        <motion.div
          style={{ x: celestialX, y: celestialY }}
          className="absolute top-[6%] md:top-[7%] left-[8%] md:left-[13%] z-0"
        >
          <div className="relative flex items-center justify-center">
            {/* 温暖天体漫射光晕 */}
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.7, 0.9, 0.7] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute h-52 w-52 rounded-full blur-2xl pointer-events-none"
              style={{ background: theme.sunHalo }}
            />

            {/* 太阳 / 月亮圆盘主体 */}
            <motion.div
              animate={{ x: [-8, 8, -8], y: [-2, 2, -2] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex items-center justify-center"
            >
              {timeMode === "night" ? (
                <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-amber-100 via-amber-50 to-white shadow-[0_0_30px_rgba(254,240,138,0.5)]" />
              ) : timeMode === "dusk" ? (
                <div
                  className={`h-22 w-22 sm:h-24 sm:w-24 rounded-full bg-gradient-to-tr ${theme.sunMoon} shadow-[0_0_55px_rgba(251,146,60,0.85)]`}
                />
              ) : (
                <div
                  className={`h-22 w-22 sm:h-24 sm:w-24 rounded-full bg-gradient-to-tr ${theme.sunMoon} shadow-[0_0_60px_rgba(253,224,71,0.9)]`}
                />
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* 云朵 2：高空右上祥云（轻盈流线，对流反向浮动） */}
        <motion.div
          style={{ x: skyX, y: skyY }}
          className="absolute top-[4%] md:top-[5%] right-[5%] md:right-[12%]"
        >
          <motion.svg
            animate={{ x: [25, -25, 25], y: [2, -2, 2] }}
            transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
            width="320"
            height="100"
            viewBox="0 0 320 100"
            fill="none"
          >
            <path
              d="M30 75 C 15 75, 5 62, 18 50 C 15 32, 38 22, 60 30 C 80 12, 118 10, 140 26 C 165 14, 205 16, 222 34 C 248 24, 280 32, 290 52 C 310 55, 318 70, 302 75 Z"
              fill={theme.cloudColor1}
              opacity={0.88}
            />
            <path
              d="M60 75 C 75 52, 110 48, 135 58 C 160 46, 200 48, 218 62 C 240 55, 270 60, 278 75 Z"
              fill={theme.cloudColor2}
              opacity={0.6}
            />
          </motion.svg>
        </motion.div>

        {/* 云朵 3：左上轻灵薄云 */}
        <motion.div
          style={{ x: skyX, y: skyY }}
          className="absolute top-[13%] left-[3%] md:left-[6%]"
        >
          <motion.svg
            animate={{ x: [-18, 18, -18], y: [-2, 2, -2] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
            width="250"
            height="80"
            viewBox="0 0 250 80"
            fill="none"
          >
            <path
              d="M25 60 C 12 60, 5 48, 16 38 C 14 24, 34 16, 52 22 C 68 8, 100 8, 118 20 C 138 10, 170 12, 185 26 C 205 18, 230 26, 235 42 C 248 45, 252 56, 240 60 Z"
              fill={theme.cloudColor2}
              opacity={0.82}
            />
          </motion.svg>
        </motion.div>

        {/* 云朵 4：中空右侧悠然叠云 */}
        <motion.div
          style={{ x: skyX, y: skyY }}
          className="absolute top-[16%] md:top-[14%] right-[22%] md:right-[26%]"
        >
          <motion.svg
            animate={{ x: [20, -20, 20], y: [3, -3, 3] }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            width="280"
            height="85"
            viewBox="0 0 280 85"
            fill="none"
          >
            <path
              d="M30 65 C 18 65, 8 52, 20 42 C 18 28, 38 18, 56 25 C 72 10, 105 8, 124 22 C 144 12, 178 14, 194 28 C 215 20, 245 28, 252 45 C 266 48, 270 60, 258 65 Z"
              fill={theme.cloudColor1}
              opacity={0.85}
            />
            <path
              d="M50 65 C 65 44, 98 40, 120 50 C 142 40, 175 42, 190 54 C 210 48, 235 52, 242 65 Z"
              fill={theme.cloudColor3}
              opacity={0.65}
            />
          </motion.svg>
        </motion.div>

        {/* 云朵 5：近山脉微风薄雾（山脊上方平缓缭绕的轻纱云带） */}
        <motion.div
          style={{ x: mountainX, y: mountainY }}
          className="absolute top-[22%] md:top-[18%] left-[25%] md:left-[35%]"
        >
          <motion.svg
            animate={{ x: [-35, 35, -35] }}
            transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
            width="360"
            height="70"
            viewBox="0 0 360 70"
            fill="none"
          >
            <path
              d="M20 50 C 50 32, 90 35, 120 42 C 150 28, 200 28, 230 38 C 260 25, 310 30, 340 50 C 310 52, 60 52, 20 50 Z"
              fill={theme.cloudColor3}
              opacity={0.75}
            />
          </motion.svg>
        </motion.div>

        {/* 云朵 6：右侧天际远山薄岚 */}
        <motion.div
          style={{ x: mountainX, y: mountainY }}
          className="absolute top-[24%] md:top-[20%] right-[4%]"
        >
          <motion.svg
            animate={{ x: [15, -15, 15] }}
            transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
            width="240"
            height="60"
            viewBox="0 0 240 60"
            fill="none"
          >
            <path
              d="M15 45 C 40 30, 75 32, 100 38 C 125 26, 165 26, 190 35 C 210 24, 230 35, 235 45 Z"
              fill={theme.cloudColor2}
              opacity={0.6}
            />
          </motion.svg>
        </motion.div>
      </div>

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
