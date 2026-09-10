// src/components/GrowingSacredVine.tsx
'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  MotionValue,
} from 'framer-motion';
import { useIsMobile } from '@/hooks/useIsMobile';

// ---------- 工笔七叶掌状复叶（青翠宣纸墨色与流金主脉） ----------
const GongbiSevenLeafCluster: React.FC<{ size?: number }> = ({ size = 110 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-55 -55 110 110"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <g strokeLinecap="round" strokeLinejoin="round">
        {/* 小叶柄 */}
        <path d="M 0 0 Q 3 -8 0 -14" stroke="#3A5C40" strokeWidth="2.2" fill="none" />

        {/* 七片披针小叶扇形舒展 */}
        {[
          { angle: -72, len: 26, w: 9 },
          { angle: -52, len: 32, w: 11 },
          { angle: -30, len: 39, w: 12 },
          { angle: -8,  len: 42, w: 13 },
          { angle: 16,  len: 38, w: 12 },
          { angle: 38,  len: 33, w: 11 },
          { angle: 62,  len: 27, w: 9 },
        ].map((leaf, i) => {
          const rad = (leaf.angle * Math.PI) / 180;
          const tipX = Math.sin(rad) * leaf.len;
          const tipY = -14 - Math.cos(rad) * leaf.len;

          const perpX = Math.cos(rad) * leaf.w;
          const perpY = Math.sin(rad) * leaf.w;

          const midX = (tipX) * 0.55;
          const midY = -14 + (-Math.cos(rad) * leaf.len) * 0.55;

          const c1X = midX - perpX * 0.5;
          const c1Y = midY - perpY * 0.5;
          const c2X = midX + perpX * 0.5;
          const c2Y = midY + perpY * 0.5;

          return (
            <g key={i}>
              {/* 工笔透光青玉色叶肉 */}
              <path
                d={`M 0 -14 Q ${c1X} ${c1Y} ${tipX} ${tipY} Q ${c2X} ${c2Y} 0 -14 Z`}
                fill="rgba(65, 110, 75, 0.42)"
                stroke="#2C4E33"
                strokeWidth="1.2"
              />
              {/* 细密副脉 */}
              <path
                d={`M ${c1X * 0.7} ${c1Y * 0.7} L ${midX} ${midY} L ${c2X * 0.7} ${c2Y * 0.7}`}
                stroke="rgba(125, 175, 135, 0.65)"
                strokeWidth="0.6"
                fill="none"
              />
              {/* 贯穿金玉主脉 */}
              <path
                d={`M 0 -14 L ${tipX} ${tipY}`}
                stroke="#C69E38"
                strokeWidth="0.9"
                fill="none"
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

// ---------- 叶片节点定义 ----------
interface LeafNode {
  t: number;          // 沿主干的进度位置
  side: 1 | -1;       // 1 表示右侧，-1 表示左侧
  scale: number;      // 缩放比例
  rotate: number;     // 初始角度
}

const LEAF_NODES: LeafNode[] = [
  { t: 0.08, side: 1,  scale: 0.75, rotate: -22 },
  { t: 0.18, side: -1, scale: 0.95, rotate: 26 },
  { t: 0.28, side: 1,  scale: 0.85, rotate: -18 },
  { t: 0.38, side: -1, scale: 1.15, rotate: 32 },
  { t: 0.48, side: 1,  scale: 1.0,  rotate: -24 },
  { t: 0.58, side: -1, scale: 0.9,  rotate: 22 },
  { t: 0.68, side: 1,  scale: 1.2,  rotate: -20 },
  { t: 0.78, side: -1, scale: 0.95, rotate: 25 },
  { t: 0.88, side: 1,  scale: 1.05, rotate: -28 },
  { t: 0.96, side: -1, scale: 0.8,  rotate: 18 },
];

// ---------- 单个生长叶簇（伴随藤蔓延展逐级破土绽放） ----------
const VineLeaf: React.FC<{
  node: LeafNode;
  scrollYProgress: MotionValue<number>;
  containerHeight: number;
  isMobile?: boolean;
}> = ({ node, scrollYProgress, containerHeight, isMobile = false }) => {
  const y = node.t * containerHeight;
  const x = 50 + Math.sin(node.t * Math.PI * 2.3) * 85 + node.side * 24;

  const start = Math.max(0, node.t - 0.07);
  const end = Math.min(1, node.t + 0.07);

  const scale = useTransform(scrollYProgress, [start, end], [0, node.scale]);
  const opacity = useTransform(scrollYProgress, [start, end], [0, 0.95]);
  const rotate = useTransform(
    scrollYProgress,
    [start, end],
    [node.rotate - 30 * node.side, node.rotate]
  );

  // 移动端：仅在进入视口时执行单次流畅入场动画，完全解耦滚动逐帧计算
  if (isMobile) {
    return (
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: node.scale, opacity: 0.95 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{
          duration: 0.8,
          delay: 0.2 + node.t * 1.2,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          transformOrigin: `${x}px ${y}px`,
        }}
      >
        <g transform={`translate(${x}, ${y}) rotate(${node.rotate})`}>
          <GongbiSevenLeafCluster size={110} />
        </g>
      </motion.g>
    );
  }

  return (
    <motion.g
      style={{
        scale,
        opacity,
        rotate,
        transformOrigin: '0px 0px',
      }}
    >
      <g transform={`translate(${x}, ${y})`}>
        <GongbiSevenLeafCluster size={125} />
      </g>
    </motion.g>
  );
};

// ---------- 主组件 ----------
export interface GrowingSacredVineProps {
  flip?: boolean;
}

export const GrowingSacredVine: React.FC<GrowingSacredVineProps> = ({ flip = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 26,
    mass: 0.8,
  });

  // PC 端随滚动抽枝生长的蔓延路径
  const pathLength = useTransform(smoothProgress, [0, 0.88], [0, 1]);
  const trunkOpacity = useTransform(smoothProgress, [0, 0.05], [0, 0.95]);
  const parallaxY = useTransform(smoothProgress, [0, 1], [30, -30]);

  // 次级分支动画变换
  const branch1PathLength = useTransform(smoothProgress, [0.15, 0.35], [0, 1]);
  const branch1Opacity = useTransform(smoothProgress, [0.15, 0.35], [0, 0.85]);
  const branch2PathLength = useTransform(smoothProgress, [0.35, 0.55], [0, 1]);
  const branch2Opacity = useTransform(smoothProgress, [0.35, 0.55], [0, 0.85]);
  const branch3PathLength = useTransform(smoothProgress, [0.55, 0.75], [0, 1]);
  const branch3Opacity = useTransform(smoothProgress, [0.55, 0.75], [0, 0.85]);

  const containerHeight = 900;

  // 移动端精简叶片节点：取半数核心节点，减少 50% 的复杂 SVG 路径计算
  const activeLeafNodes = isMobile
    ? LEAF_NODES.filter((_, idx) => idx % 2 === 0)
    : LEAF_NODES;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden select-none"
      style={{
        zIndex: 0,
        contentVisibility: 'auto',
        containIntrinsicSize: '900px',
      }}
      aria-hidden="true"
    >
      {/* ───── 1. 宣纸温润光晕底色 ───── */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_40%,rgba(235,215,160,0.25),transparent_75%)]" />

      {/* ───── 2. 工笔草叶花卉名画真迹层 ───── */}
      <motion.div
        className={`absolute top-[-5%] h-[110%] w-[320px] sm:w-[480px] md:w-[580px] lg:w-[680px] pointer-events-none transition-transform duration-700 ease-out ${
          flip
            ? 'right-[-20px] sm:right-[2%] lg:right-[5%] scale-x-[-1]'
            : 'left-[-20px] sm:left-[2%] lg:left-[5%]'
        }`}
        style={
          isMobile
            ? { transform: 'translate3d(0, 0, 0)' }
            : { y: parallaxY, transform: 'translate3d(0, 0, 0)' }
        }
      >
        <div
          className={`relative w-full h-full ${
            isMobile
              ? 'opacity-35' // 移动端消除 mix-blend-multiply 与重度滤镜，使用纯净透明度
              : 'opacity-60 sm:opacity-75 lg:opacity-80 mix-blend-multiply'
          }`}
          style={
            isMobile
              ? undefined
              : {
                  maskImage:
                    'radial-gradient(ellipse 68% 78% at 50% 50%, black 45%, rgba(0,0,0,0.3) 75%, transparent 100%)',
                  WebkitMaskImage:
                    'radial-gradient(ellipse 68% 78% at 50% 50%, black 45%, rgba(0,0,0,0.3) 75%, transparent 100%)',
                }
          }
        >
          <Image
            src="/botanical-bg.jpg"
            alt="工笔草木名画"
            fill
            sizes="(max-width: 768px) 50vw, 35vw"
            quality={60}
            loading="lazy"
            className={`object-contain object-center ${
              isMobile ? '' : 'filter saturate-[1.08] contrast-[1.03]'
            }`}
            draggable={false}
          />
        </div>
      </motion.div>

      {/* ───── 3. ⭐ 动态蔓生藤蔓（移动端 whileInView 单次动画，PC 端实时滚动生发） ───── */}
      <div className={`w-full h-full ${flip ? '-scale-x-100' : ''}`}>
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 600 ${containerHeight}`}
          preserveAspectRatio="xMinYMin slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gongbiVineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7EAB83" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#436F49" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#25432B" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* -------- 主藤蔓粗茎 -------- */}
          {isMobile ? (
            <motion.path
              d={`M -70 -40
                  C 80 120, -10 240, 105 370
                  S 40 550, 140 730
                  S -5 880, 115 ${containerHeight}`}
              fill="none"
              stroke="url(#gongbiVineGrad)"
              strokeWidth="3.8"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.95 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 2.0, ease: 'easeOut' }}
            />
          ) : (
            <motion.path
              d={`M -70 -40
                  C 80 120, -10 240, 105 370
                  S 40 550, 140 730
                  S -5 880, 115 ${containerHeight}`}
              fill="none"
              stroke="url(#gongbiVineGrad)"
              strokeWidth="3.8"
              strokeLinecap="round"
              style={{
                pathLength,
                opacity: trunkOpacity,
              }}
            />
          )}

          {/* -------- 次级分支（蔓延展开）-------- */}
          {isMobile ? (
            <>
              <motion.path
                d="M 35 190 Q 95 235 160 215"
                fill="none"
                stroke="#436F49"
                strokeWidth="1.8"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.85 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
              />
              <motion.path
                d="M 80 400 Q 25 450 -15 490"
                fill="none"
                stroke="#436F49"
                strokeWidth="1.8"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.85 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.7, ease: 'easeOut' }}
              />
              <motion.path
                d="M 120 645 Q 185 695 230 780"
                fill="none"
                stroke="#436F49"
                strokeWidth="1.8"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 0.85 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 1.0, ease: 'easeOut' }}
              />
            </>
          ) : (
            <>
              <motion.path
                d="M 35 190 Q 95 235 160 215"
                fill="none"
                stroke="#436F49"
                strokeWidth="1.8"
                strokeLinecap="round"
                style={{
                  pathLength: branch1PathLength,
                  opacity: branch1Opacity,
                }}
              />
              <motion.path
                d="M 80 400 Q 25 450 -15 490"
                fill="none"
                stroke="#436F49"
                strokeWidth="1.8"
                strokeLinecap="round"
                style={{
                  pathLength: branch2PathLength,
                  opacity: branch2Opacity,
                }}
              />
              <motion.path
                d="M 120 645 Q 185 695 230 780"
                fill="none"
                stroke="#436F49"
                strokeWidth="1.8"
                strokeLinecap="round"
                style={{
                  pathLength: branch3PathLength,
                  opacity: branch3Opacity,
                }}
              />
            </>
          )}

          {/* -------- 沿藤蔓破土绽放的工笔七叶草簇 -------- */}
          {activeLeafNodes.map((node, i) => (
            <VineLeaf
              key={i}
              node={node}
              scrollYProgress={smoothProgress}
              containerHeight={containerHeight}
              isMobile={isMobile}
            />
          ))}
        </svg>
      </div>

      {/* ───── 4. 禅意微尘（仅在 PC 端渲染，移动端免除常驻脉冲动画） ───── */}
      {!isMobile && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <span
            className="absolute w-2 h-2 rounded-full bg-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse"
            style={{ top: '22%', left: '18%', animationDuration: '4s' }}
          />
          <span
            className="absolute w-1.5 h-1.5 rounded-full bg-emerald-600/40 shadow-[0_0_8px_rgba(45,106,79,0.4)] animate-pulse"
            style={{ top: '68%', left: '26%', animationDuration: '6s', animationDelay: '1.5s' }}
          />
          <span
            className="absolute w-2.5 h-2.5 rounded-full bg-amber-300/40 shadow-[0_0_14px_rgba(251,191,36,0.4)] animate-pulse"
            style={{ top: '35%', right: '22%', animationDuration: '5s', animationDelay: '0.8s' }}
          />
          <span
            className="absolute w-1.5 h-1.5 rounded-full bg-emerald-700/30 shadow-[0_0_8px_rgba(64,145,108,0.35)] animate-pulse"
            style={{ top: '75%', right: '15%', animationDuration: '7s', animationDelay: '2s' }}
          />
        </div>
      )}
    </div>
  );
};

export default GrowingSacredVine;
