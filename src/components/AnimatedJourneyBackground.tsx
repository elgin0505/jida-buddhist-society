"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";

type TimePhase = "morning" | "day" | "dusk" | "night";

export function AnimatedJourneyBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const [timePhase, setTimePhase] = useState<TimePhase>("day");
  const [isClient, setIsClient] = useState(false);

  // Determine initial time phase on mount
  useEffect(() => {
    setIsClient(true);
    const updateTime = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 9) setTimePhase("morning");
      else if (hour >= 9 && hour < 17) setTimePhase("day");
      else if (hour >= 17 && hour < 20) setTimePhase("dusk");
      else setTimePhase("night");
    };
    updateTime();
    // Check every minute just in case they leave the page open
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Smooth springs for mouse parallax
  const springX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  // Parallax transforms for different depth layers
  const celestialX = useTransform(springX, [-1, 1], [-10, 10]);
  const celestialY = useTransform(springY, [-1, 1], [-10, 10]);
  
  const mountainFarX = useTransform(springX, [-1, 1], [-30, 30]);
  const mountainFarY = useTransform(springY, [-1, 1], [-10, 10]);
  
  const mountainNearX = useTransform(springX, [-1, 1], [-60, 60]);
  const mountainNearY = useTransform(springY, [-1, 1], [-20, 20]);
  
  const waterX = useTransform(springX, [-1, 1], [-90, 90]);
  const waterY = useTransform(springY, [-1, 1], [-5, 5]);

  const foregroundX = useTransform(springX, [-1, 1], [-120, 120]);
  const foregroundY = useTransform(springY, [-1, 1], [-30, 30]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Color mapping based on time phase
  const getSkyClass = () => {
    switch (timePhase) {
      case "morning": return "bg-gradient-to-b from-indigo-200 via-sky-100 to-rose-100 dark:from-slate-800 dark:to-slate-700";
      case "day": return "bg-gradient-to-b from-sky-300 to-sky-100 dark:from-slate-900 dark:to-slate-800";
      case "dusk": return "bg-gradient-to-b from-orange-400 via-rose-300 to-purple-400 dark:from-amber-950 dark:to-purple-950";
      case "night": return "bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 dark:from-black dark:to-slate-950";
    }
  };

  const getWaterColors = () => {
    switch (timePhase) {
      case "morning": return { top: "#7dd3fc", bottom: "#38bdf8" }; // sky-300 to sky-400
      case "day": return { top: "#38bdf8", bottom: "#0284c7" }; // sky-400 to sky-600
      case "dusk": return { top: "#fb923c", bottom: "#c026d3" }; // orange-400 to fuchsia-600
      case "night": return { top: "#1e1b4b", bottom: "#0f172a" }; // indigo-950 to slate-900
    }
  };

  const getMountainColors = () => {
    switch (timePhase) {
      case "morning": return { far: "fill-emerald-200 dark:fill-slate-700", near: "fill-emerald-300 dark:fill-slate-800" };
      case "day": return { far: "fill-emerald-300 dark:fill-slate-700", near: "fill-emerald-500 dark:fill-slate-800" };
      case "dusk": return { far: "fill-rose-900/60 dark:fill-slate-800", near: "fill-rose-950/80 dark:fill-slate-900" };
      case "night": return { far: "fill-slate-800 dark:fill-slate-800", near: "fill-slate-900 dark:fill-slate-900" };
    }
  };

  const getForegroundColors = () => {
    switch (timePhase) {
      case "morning": return "fill-emerald-500 dark:fill-emerald-900";
      case "day": return "fill-emerald-600 dark:fill-emerald-900";
      case "dusk": return "fill-amber-950 dark:fill-amber-950";
      case "night": return "fill-slate-950 dark:fill-slate-950";
    }
  };

  if (!isClient) return null; // Avoid hydration mismatch

  const waterColors = getWaterColors();
  const mountainColors = getMountainColors();
  const foregroundColor = getForegroundColors();

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 -z-10 overflow-hidden transition-colors duration-1000 ${getSkyClass()}`}
    >
      {/* Dev Time Switcher (visible in dev mode only or bottom corner) */}
      <div className="absolute bottom-4 right-4 z-50 flex gap-2 rounded-full bg-white/10 p-1 backdrop-blur-md">
        {(["morning", "day", "dusk", "night"] as TimePhase[]).map((phase) => (
          <button
            key={phase}
            onClick={() => setTimePhase(phase)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-all ${
              timePhase === phase ? "bg-white/30 text-white" : "text-white/50 hover:bg-white/20 hover:text-white"
            }`}
          >
            {phase}
          </button>
        ))}
      </div>

      <svg
        className="absolute h-full w-full object-cover"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="sunGradientDay" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
          <radialGradient id="sunGlowDay" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="sunGradientDusk" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="60%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#991b1b" />
          </radialGradient>
          <radialGradient id="sunGlowDusk" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="moonGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="70%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </radialGradient>
          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={waterColors.top} style={{ transition: "all 1s" }} />
            <stop offset="100%" stopColor={waterColors.bottom} style={{ transition: "all 1s" }} />
          </linearGradient>
        </defs>

        {/* --- SKY LAYER --- */}
        {timePhase === "night" && (
          <g>
            {/* Stars */}
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.circle
                key={`star-${i}`}
                cx={Math.random() * 1920}
                cy={Math.random() * 600}
                r={Math.random() * 1.5 + 0.5}
                fill="#ffffff"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 2 }}
              />
            ))}
          </g>
        )}

        <AnimatePresence mode="popLayout">
          {timePhase !== "night" ? (
            <motion.g
              key="sun"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 1 }}
              style={{ x: celestialX, y: celestialY }}
            >
              <motion.circle
                cx={timePhase === "morning" ? 300 : timePhase === "dusk" ? 1400 : 1600}
                cy={timePhase === "dusk" ? 400 : 250}
                r="200"
                fill={timePhase === "dusk" ? "url(#sunGlowDusk)" : "url(#sunGlowDay)"}
                animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <circle
                cx={timePhase === "morning" ? 300 : timePhase === "dusk" ? 1400 : 1600}
                cy={timePhase === "dusk" ? 400 : 250}
                r="80"
                fill={timePhase === "dusk" ? "url(#sunGradientDusk)" : "url(#sunGradientDay)"}
              />
            </motion.g>
          ) : (
            <motion.g
              key="moon"
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 1 }}
              style={{ x: celestialX, y: celestialY }}
            >
              <motion.circle
                cx="1600" cy="150" r="150"
                fill="url(#moonGlow)"
                animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />
              <circle cx="1600" cy="150" r="60" fill="url(#moonGradient)" />
              {/* Moon Craters */}
              <circle cx="1580" cy="130" r="12" fill="#94a3b8" opacity="0.3" />
              <circle cx="1620" cy="160" r="8" fill="#94a3b8" opacity="0.3" />
              <circle cx="1590" cy="170" r="15" fill="#94a3b8" opacity="0.2" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* Clouds */}
        <motion.g style={{ x: celestialX }} className={`fill-white transition-opacity duration-1000 ${timePhase === "night" ? "opacity-10 dark:opacity-5" : timePhase === "dusk" ? "opacity-40 fill-orange-100" : "opacity-80 dark:opacity-20"}`}>
          <motion.path
            d="M -200 150 Q -150 100 -100 150 Q -50 120 0 150 Q 50 180 0 200 L -200 200 Z"
            animate={{ x: [0, 2200] }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          />
          <motion.path
            d="M 500 250 Q 550 180 620 250 Q 680 200 750 250 Q 820 280 750 320 L 500 320 Z"
            animate={{ x: [0, 1500, -1000] }}
            transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          />
          <motion.path
            d="M 1200 100 Q 1280 40 1350 100 Q 1420 80 1500 100 Q 1550 150 1500 180 L 1200 180 Z"
            animate={{ x: [0, 800, -1500] }}
            transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          />
        </motion.g>

        {/* --- MOUNTAIN FAR LAYER --- */}
        <motion.path
          className={`${mountainColors.far} transition-colors duration-1000`}
          d="M -100 700 L 250 400 L 600 650 L 1000 350 L 1400 600 L 1800 250 L 2100 600 L 2100 1080 L -100 1080 Z"
          style={{ x: mountainFarX, y: mountainFarY }}
        />
        <motion.path
          className={`${timePhase === "night" ? "fill-slate-600" : timePhase === "dusk" ? "fill-rose-300/50" : "fill-white"} dark:fill-slate-500 transition-colors duration-1000`}
          d="M 250 400 L 320 460 L 250 480 L 180 460 Z M 1000 350 L 1080 410 L 1000 450 L 920 410 Z M 1800 250 L 1880 310 L 1800 350 L 1720 310 Z"
          style={{ x: mountainFarX, y: mountainFarY }}
        />

        {/* --- MOUNTAIN NEAR LAYER --- */}
        <motion.path
          className={`${mountainColors.near} transition-colors duration-1000`}
          d="M -200 800 L 150 550 L 500 800 L 850 500 L 1300 850 L 1700 450 L 2200 900 L 2200 1080 L -200 1080 Z"
          style={{ x: mountainNearX, y: mountainNearY }}
        />
        <motion.path
          className={`${timePhase === "night" ? "fill-slate-700" : timePhase === "dusk" ? "fill-rose-400/50" : "fill-emerald-100"} dark:fill-slate-600 transition-colors duration-1000`}
          d="M 150 550 L 220 620 L 150 650 L 80 620 Z M 850 500 L 930 580 L 850 620 L 770 580 Z M 1700 450 L 1790 540 L 1700 580 L 1610 540 Z"
          style={{ x: mountainNearX, y: mountainNearY }}
        />

        {/* --- WATER LAYER (Ripples) --- */}
        <motion.g style={{ x: waterX, y: waterY }}>
          <rect x="-200" y="750" width="2400" height="400" fill="url(#waterGrad)" />
          
          {/* Animated Ripples */}
          <motion.path
            className="stroke-white/30 dark:stroke-white/10 fill-transparent"
            strokeWidth="3"
            d="M -200 800 Q 0 780 200 800 T 600 800 T 1000 800 T 1400 800 T 1800 800 T 2200 800"
            animate={{ x: [-100, 100, -100] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            className="stroke-white/20 dark:stroke-white/5 fill-transparent"
            strokeWidth="2"
            d="M -200 850 Q 0 870 200 850 T 600 850 T 1000 850 T 1400 850 T 1800 850 T 2200 850"
            animate={{ x: [100, -100, 100] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            className="stroke-white/40 dark:stroke-white/15 fill-transparent"
            strokeWidth="4"
            d="M -200 900 Q 0 880 200 900 T 600 900 T 1000 900 T 1400 900 T 1800 900 T 2200 900"
            animate={{ x: [-50, 50, -50] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.g>

        {/* --- FOREGROUND & WINDING PATH --- */}
        <motion.g style={{ x: foregroundX, y: foregroundY }}>
          {/* Base hill */}
          <path
            className={`${foregroundColor} transition-colors duration-1000`}
            d="M -200 1080 L -200 850 Q 400 800 800 900 T 2200 800 L 2200 1080 Z"
          />
          {/* The Path */}
          <path
            className={`${timePhase === "night" ? "fill-slate-800" : timePhase === "dusk" ? "fill-amber-900" : "fill-amber-100"} dark:fill-amber-900/80 transition-colors duration-1000`}
            d="M -200 950 Q 200 920 400 980 T 1000 950 T 1800 1020 L 1850 1080 L -200 1080 Z"
          />

          {/* Grass patches */}
          <g className={`${timePhase === "night" ? "fill-slate-900" : timePhase === "dusk" ? "fill-amber-950" : "fill-emerald-500"} dark:fill-emerald-800 transition-colors duration-1000`}>
            <path d="M 100 880 Q 120 860 140 880 Z" />
            <path d="M 600 920 Q 620 900 640 920 Z" />
            <path d="M 1200 900 Q 1230 870 1260 900 Z" />
            <path d="M 1600 980 Q 1630 950 1660 980 Z" />
          </g>

          {/* --- Q-STYLE MONK CHARACTER --- */}
          <motion.g
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
            transform="translate(350, 820) scale(1.3)"
          >
            {/* Staff */}
            <line x1="60" y1="20" x2="40" y2="120" stroke={timePhase === "night" ? "#0f172a" : "#78350f"} strokeWidth="6" strokeLinecap="round" className="transition-colors duration-1000" />
            
            {/* Bindle */}
            <motion.path
              d="M 60 20 Q 75 10 85 30 Q 75 50 55 35 Z"
              fill={timePhase === "night" ? "#1e293b" : "#b45309"}
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformOrigin: "60px 20px" }}
              className="transition-colors duration-1000"
            />

            {/* Back Foot */}
            <motion.ellipse
              cx="25" cy="110" rx="12" ry="6" fill="#020617"
              animate={{ x: [0, -10, 0], y: [0, -5, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
            />

            {/* Front Foot */}
            <motion.ellipse
              cx="45" cy="115" rx="12" ry="6" fill="#0f172a"
              animate={{ x: [-10, 0, -10], y: [-5, 0, -5] }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "linear", delay: 0.3 }}
            />

            {/* Body (Robes) */}
            <path d="M 20 60 Q 35 40 50 60 L 60 100 Q 35 115 15 100 Z" fill={timePhase === "night" ? "#334155" : "#f59e0b"} className="transition-colors duration-1000" />
            <path d="M 25 60 Q 35 50 45 60 L 50 100 Q 35 105 20 100 Z" fill={timePhase === "night" ? "#1e293b" : "#d97706"} className="transition-colors duration-1000" />

            {/* Head */}
            <circle cx="35" cy="40" r="22" fill={timePhase === "night" ? "#94a3b8" : "#fcd34d"} className="transition-colors duration-1000" />
            
            {/* Face details */}
            <g stroke={timePhase === "night" ? "#1e293b" : "#78350f"} className="transition-colors duration-1000">
              <path d="M 25 38 Q 28 42 31 38" fill="none" strokeWidth="2" strokeLinecap="round" />
              <path d="M 43 38 Q 46 42 49 38" fill="none" strokeWidth="2" strokeLinecap="round" />
              <path d="M 33 48 Q 37 52 41 48" fill="none" strokeWidth="2" strokeLinecap="round" />
            </g>
            
            {/* Blush */}
            <circle cx="22" cy="44" r="3" fill="#f87171" opacity={timePhase === "night" ? "0.2" : "0.6"} className="transition-opacity duration-1000" />
            <circle cx="52" cy="44" r="3" fill="#f87171" opacity={timePhase === "night" ? "0.2" : "0.6"} className="transition-opacity duration-1000" />

            {/* Monk Beads */}
            <path d="M 25 65 Q 35 75 45 65" fill="none" stroke={timePhase === "night" ? "#0f172a" : "#78350f"} strokeWidth="3" strokeLinecap="round" strokeDasharray="1 5" className="transition-colors duration-1000" />
          </motion.g>
        </motion.g>
      </svg>
    </div>
  );
}
