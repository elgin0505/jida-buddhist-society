"use client";

import { useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";

interface LivingBodhiTreeProps {
  points: number;
  size?: "sm" | "md" | "lg";
}

type Stage = "sprout" | "sapling" | "bodhi";

function getStage(points: number): Stage {
  if (points <= 20) return "sprout";
  if (points <= 50) return "sapling";
  return "bodhi";
}

// 漂浮金光粒子（圆满相专属）
function GoldenDustParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: 20 + Math.random() * 110,
        y: 15 + Math.random() * 80,
        size: 1.5 + Math.random() * 2.5,
        delay: Math.random() * 4,
        duration: 3.5 + Math.random() * 2.5,
      })),
    []
  );

  return (
    <>
      {particles.map((p) => (
        <motion.circle
          key={p.id}
          cx={p.x}
          cy={p.y}
          r={p.size}
          fill="#FFB300"
          opacity={0}
          animate={{
            opacity: [0, 0.75, 0],
            y: [0, -(8 + Math.random() * 12), 0],
            x: [0, (Math.random() - 0.5) * 14, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

// ── 嫩芽 SVG（0-20 分）
function SproutSVG() {
  return (
    <motion.g
      animate={{ y: [0, -3, 0], rotate: [-2, 2, -2] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "75px 140px" }}
    >
      {/* 茎 */}
      <path d="M75 140 Q74 120 75 100" stroke="#4a7c59" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* 左芽叶 */}
      <motion.path
        d="M75 115 Q60 108 58 98 Q68 100 75 115"
        fill="#5a9c6a"
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        style={{ transformOrigin: "75px 115px" }}
      />
      {/* 右芽叶 */}
      <motion.path
        d="M75 112 Q90 105 92 95 Q82 97 75 112"
        fill="#6ab87a"
        animate={{ rotate: [3, -3, 3] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "75px 112px" }}
      />
      {/* 嫩芽顶 */}
      <motion.ellipse
        cx="75" cy="98" rx="4" ry="6"
        fill="#4dcc6e"
        animate={{ scaleY: [1, 1.08, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* 晨露水珠 */}
      <motion.circle
        cx="60" cy="102" r="2.5"
        fill="rgba(180,220,255,0.85)"
        animate={{ opacity: [0.8, 1, 0.8], r: [2.5, 3, 2.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* 根部土壤 */}
      <ellipse cx="75" cy="141" rx="14" ry="4" fill="#9b7a4a" opacity="0.35" />
    </motion.g>
  );
}

// ── 小树苗 SVG（21-50 分）
function SaplingSVG() {
  const leaves = [
    { d: "M75 95 Q55 82 52 65 Q67 70 75 95", fill: "#5a9c6a", delay: 0 },
    { d: "M75 90 Q95 77 98 60 Q83 65 75 90", fill: "#74b87e", delay: 0.8 },
    { d: "M75 108 Q58 100 55 88 Q67 92 75 108", fill: "#8dd494", delay: 1.6 },
    { d: "M75 105 Q92 97 95 85 Q83 89 75 105", fill: "#6ab87a", delay: 0.4 },
    { d: "M75 75 Q62 64 60 50 Q72 56 75 75", fill: "#c8e6c9", delay: 1.2 },
  ];

  return (
    <motion.g
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* 主干 */}
      <path d="M75 140 Q73 115 75 70" stroke="#6d4c2a" strokeWidth="4" strokeLinecap="round" fill="none" />
      {/* 侧枝左 */}
      <path d="M75 100 Q62 92 56 82" stroke="#7d5c3a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* 侧枝右 */}
      <path d="M75 95 Q88 87 94 76" stroke="#7d5c3a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* 叶子 */}
      {leaves.map((leaf, i) => (
        <motion.path
          key={i}
          d={leaf.d}
          fill={leaf.fill}
          animate={{ rotate: [-2, 2, -2], y: [0, -2, 0] }}
          transition={{ duration: 3.5 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: leaf.delay }}
          style={{ transformOrigin: "75px 95px" }}
        />
      ))}
      {/* 根部 */}
      <ellipse cx="75" cy="141" rx="18" ry="4.5" fill="#9b7a4a" opacity="0.3" />
    </motion.g>
  );
}

// ── 菩提树 SVG（51+ 分）
function BodhiSVG() {
  return (
    <motion.g
      animate={{ y: [0, -1.5, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* 主干 */}
      <path d="M75 140 Q72 110 75 55" stroke="#5d3a1a" strokeWidth="6" strokeLinecap="round" fill="none" />
      {/* 左主枝 */}
      <path d="M75 90 Q52 78 40 60" stroke="#6d4c2a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* 右主枝 */}
      <path d="M75 85 Q98 72 110 54" stroke="#6d4c2a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* 左次枝 */}
      <path d="M75 105 Q58 98 50 88" stroke="#7a5535" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* 右次枝 */}
      <path d="M75 102 Q92 95 100 85" stroke="#7a5535" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* 树冠叶片群 */}
      {[
        { d: "M75 80 Q45 65 38 42 Q60 48 75 80", fill: "#c8a000" },
        { d: "M75 80 Q105 65 112 42 Q90 48 75 80", fill: "#dab000" },
        { d: "M75 70 Q55 52 50 30 Q68 40 75 70", fill: "#e8c200" },
        { d: "M75 70 Q95 52 100 30 Q82 40 75 70", fill: "#f5ce00" },
        { d: "M75 60 Q62 40 62 20 Q74 32 75 60", fill: "#ffd700" },
        { d: "M75 60 Q88 40 88 20 Q76 32 75 60", fill: "#ffc800" },
        { d: "M75 90 Q40 80 28 65 Q52 72 75 90", fill: "#b89000" },
        { d: "M75 90 Q110 80 122 65 Q98 72 75 90", fill: "#c4a000" },
        { d: "M75 105 Q50 100 42 90 Q60 95 75 105", fill: "#a07800" },
        { d: "M75 105 Q100 100 108 90 Q90 95 75 105", fill: "#b08800" },
      ].map((leaf, i) => (
        <motion.path
          key={i}
          d={leaf.d}
          fill={leaf.fill}
          opacity={0.92}
          animate={{ rotate: [-(i % 3), (i % 3), -(i % 3)], scale: [1, 1.02, 1] }}
          transition={{
            duration: 4 + (i % 5) * 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: (i * 0.35) % 3,
          }}
          style={{ transformOrigin: "75px 80px" }}
        />
      ))}

      {/* 金色光尘粒子 */}
      <GoldenDustParticles />

      {/* 菩提心叶（中心最亮的金叶） */}
      <motion.path
        d="M75 55 Q68 40 70 25 Q78 38 75 55"
        fill="#FFD700"
        animate={{ opacity: [0.85, 1, 0.85], scale: [1, 1.06, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "75px 40px" }}
      />

      {/* 根部 */}
      <ellipse cx="75" cy="141" rx="24" ry="5.5" fill="#9b7a4a" opacity="0.25" />
    </motion.g>
  );
}

/**
 * 功德菩提树 (The Living Bodhi Tree)
 * 根据 points 积分动态渲染三阶段生长形态，配合 Framer Motion 动画。
 */
export function LivingBodhiTree({ points, size = "md" }: LivingBodhiTreeProps) {
  const stage = getStage(points);

  const sizeMap = {
    sm: { w: 90, h: 110 },
    md: { w: 130, h: 160 },
    lg: { w: 180, h: 220 },
  };
  const { w, h } = sizeMap[size];

  const stageLabel = {
    sprout: "初发心",
    sapling: "精进者",
    bodhi: "圆满相",
  }[stage];

  const stageColor = {
    sprout: "text-green-600",
    sapling: "text-emerald-500",
    bodhi: "text-amber-400",
  }[stage];

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={w}
        height={h}
        viewBox="0 0 150 150"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        <AnimatePresence mode="wait">
          {stage === "sprout" && (
            <motion.g
              key="sprout"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <SproutSVG />
            </motion.g>
          )}
          {stage === "sapling" && (
            <motion.g
              key="sapling"
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <SaplingSVG />
            </motion.g>
          )}
          {stage === "bodhi" && (
            <motion.g
              key="bodhi"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <BodhiSVG />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      {/* 积分 + 境界标注 */}
      <div className="flex flex-col items-center">
        <motion.span
          key={points}
          initial={{ scale: 1.3, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="text-2xl font-bold text-amber-600 dark:text-amber-400 leading-none"
        >
          {points}
        </motion.span>
        <span className={`text-[10px] font-semibold mt-0.5 ${stageColor}`}>
          {stageLabel}
        </span>
      </div>
    </div>
  );
}
