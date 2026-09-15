'use client';

import { useCallback, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';

/* ══════════════════════════════════════════════════
   IcyNebulaBackground
   冰蓝星云 · 深空脉冲核心 · 磁性指针光晕
══════════════════════════════════════════════════ */
interface IcyNebulaBackgroundProps {
  borderRadius?: string;
  interactive?: boolean;
}

export function IcyNebulaBackground({
  borderRadius = 'rounded-3xl',
  interactive = true,
}: IcyNebulaBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0.5);
  const rawY = useMotionValue(0.5);

  const springX = useSpring(rawX, { stiffness: 55, damping: 22, mass: 1.4 });
  const springY = useSpring(rawY, { stiffness: 55, damping: 22, mass: 1.4 });

  const glowLeft = useTransform(springX, (v) => `${v * 100}%`);
  const glowTop  = useTransform(springY, (v) => `${v * 100}%`);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${borderRadius}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* ── 底色 ── */}
      <div className="absolute inset-0 bg-[#030b14]" />

      {/* ── 核心 Pulsar ── */}
      <motion.div
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 420, height: 420, borderRadius: '50%',
          background: `radial-gradient(circle at 50% 50%,
            rgba(255,255,255,0.92)  0%,
            rgba(0,240,255,0.80)    8%,
            rgba(0,160,255,0.55)   22%,
            rgba(0,60,160,0.30)    45%,
            rgba(2,20,60,0.10)     68%,
            transparent           100%)`,
          filter: 'blur(2px)',
        }}
        animate={{ scale: [0.94, 1.06, 0.94], opacity: [0.80, 1.00, 0.80] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 700, height: 700, borderRadius: '50%',
          background: `radial-gradient(circle at 50% 50%,
            rgba(0,200,255,0.22)  0%,
            rgba(0,80,200,0.12)  40%,
            transparent          70%)`,
          filter: 'blur(32px)',
        }}
        animate={{ scale: [1.0, 1.08, 1.0], opacity: [0.7, 1.0, 0.7] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />

      {/* ── SVG 湍流滤镜 ── */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <filter id="nebula-turbulence" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves={4} seed={7} result="turbNoise" />
            <feColorMatrix
              type="matrix"
              values="0   0   0.2  0  0
                      0   0.3 0.6  0  0
                      0   0.5 1.2  0 -0.15
                      0   0   0.4  0  0"
              in="turbNoise" result="icedColor"
            />
            <feBlend in="SourceGraphic" in2="icedColor" mode="screen" />
          </filter>
          <filter id="stardust" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.065 0.065" numOctaves={2} seed={42} result="dust" />
            <feColorMatrix
              type="matrix"
              values="0 0 0.1 0 0  0 0 0.2 0 0  0 0 0.8 0 -0.5  0 0 0 0.18 0"
              in="dust" result="dustColor"
            />
            <feBlend in="SourceGraphic" in2="dustColor" mode="screen" />
          </filter>
        </defs>
      </svg>

      {/* 湍流纹理覆盖层 */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 30% 50%, rgba(0,120,255,0.45), transparent 65%),
            radial-gradient(ellipse 70% 55% at 70% 45%, rgba(0,200,255,0.35), transparent 60%),
            radial-gradient(ellipse 50% 80% at 50% 80%, rgba(0,40,160,0.55), transparent 70%)`,
          filter: 'url(#nebula-turbulence)',
          mixBlendMode: 'color-dodge' as const,
          opacity: 0.75,
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(10,30,80,0.6)',
          filter: 'url(#stardust)',
          mixBlendMode: 'screen' as const,
          opacity: 0.45,
        }}
      />

      {/* ── 极光光球 A ── */}
      <motion.div
        className="absolute"
        style={{
          width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,220,255,0.28) 0%, transparent 70%)',
          filter: 'blur(72px)', top: '10%', left: '-8%',
          mixBlendMode: 'screen' as const,
        }}
        animate={{ x: [0,60,20,80,0], y: [0,30,70,20,0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', times: [0,0.25,0.5,0.75,1] }}
      />

      {/* ── 极光光球 B ── */}
      <motion.div
        className="absolute"
        style={{
          width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30,80,255,0.32) 0%, transparent 70%)',
          filter: 'blur(88px)', bottom: '5%', right: '-5%',
          mixBlendMode: 'screen' as const,
        }}
        animate={{ x: [0,-50,-20,-70,0], y: [0,-40,-80,-30,0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut', times: [0,0.25,0.5,0.75,1] }}
      />

      {/* ── 极光光球 C ── */}
      <motion.div
        className="absolute"
        style={{
          width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(120,80,255,0.22) 0%, transparent 70%)',
          filter: 'blur(60px)', top: '55%', left: '35%',
          mixBlendMode: 'screen' as const,
        }}
        animate={{ x: [0,40,-30,50,0], y: [0,-50,20,-40,0], scale: [1,1.12,0.92,1.08,1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', times: [0,0.25,0.5,0.75,1] }}
      />

      {/* ── 磁性指针聚光灯 ── */}
      <motion.div
        style={{
          position: 'absolute',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,240,255,0.22) 0%, rgba(0,120,255,0.08) 50%, transparent 75%)',
          filter: 'blur(20px)',
          left: glowLeft, top: glowTop,
          x: '-50%', y: '-50%',
          mixBlendMode: 'screen' as const,
          pointerEvents: 'none',
        }}
      />

      {/* ── 边缘暗晕 ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%,
            transparent 50%,
            rgba(1,8,24,0.55) 80%,
            rgba(1,8,24,0.85) 100%)`,
          mixBlendMode: 'multiply' as const,
        }}
      />
    </div>
  );
}

export default IcyNebulaBackground;
