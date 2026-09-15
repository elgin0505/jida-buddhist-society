'use client';

import { useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { useIsMobile } from '@/hooks/useIsMobile';

/* ══════════════════════════════════════════════════
   IcyNebulaBackground
   冰蓝星云 · 深空脉冲核心 · 轻量化高能效渲染
══════════════════════════════════════════════════ */
interface IcyNebulaBackgroundProps {
  borderRadius?: string;
  interactive?: boolean;
  rawX?: ReturnType<typeof useMotionValue<number>>;
  rawY?: ReturnType<typeof useMotionValue<number>>;
}

export function IcyNebulaBackground({
  borderRadius = 'rounded-3xl',
  interactive = true,
  rawX: externalRawX,
  rawY: externalRawY,
}: IcyNebulaBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const internalRawX = useMotionValue(0.5);
  const internalRawY = useMotionValue(0.5);

  const rawX = externalRawX || internalRawX;
  const rawY = externalRawY || internalRawY;

  const springX = useSpring(rawX, { stiffness: 55, damping: 22, mass: 1.4 });
  const springY = useSpring(rawY, { stiffness: 55, damping: 22, mass: 1.4 });

  const glowLeft = useTransform(springX, (v) => `${v * 100}%`);
  const glowTop  = useTransform(springY, (v) => `${v * 100}%`);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${borderRadius}`}
      style={{ zIndex: 0, transform: 'translateZ(0)' }}
      aria-hidden="true"
    >
      {/* ── 底色 ── */}
      <div className="absolute inset-0 bg-[#030b14]" />

      {/* ── 核心 Pulsar（适度缩减超重 blur 避免移动端复合层重绘卡顿） ── */}
      <motion.div
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: isMobile ? 320 : 420,
          height: isMobile ? 320 : 420,
          borderRadius: '50%',
          background: `radial-gradient(circle at 50% 50%,
            rgba(255,255,255,0.95)  0%,
            rgba(0,240,255,0.85)    12%,
            rgba(0,160,255,0.55)   26%,
            rgba(0,60,160,0.30)    50%,
            rgba(2,20,60,0.10)     70%,
            transparent           100%)`,
        }}
        animate={isMobile ? { opacity: [0.85, 1.0, 0.85] } : { scale: [0.94, 1.06, 0.94], opacity: [0.80, 1.00, 0.80] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: isMobile ? 480 : 640,
          height: isMobile ? 480 : 640,
          borderRadius: '50%',
          background: `radial-gradient(circle at 50% 50%,
            rgba(0,200,255,0.25)  0%,
            rgba(0,80,200,0.14)  45%,
            transparent          75%)`,
        }}
        animate={isMobile ? undefined : { scale: [1.0, 1.08, 1.0], opacity: [0.7, 1.0, 0.7] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />

      {/* ── 桌面端专用：高质感 SVG 滤镜（移动端跳过以彻底消灭滚动掉帧） ── */}
      {!isMobile && (
        <>
          <svg width="0" height="0" className="absolute" aria-hidden="true">
            <defs>
              <filter id="nebula-turbulence" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.015 0.02" numOctaves={2} seed={7} result="turbNoise" />
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
            </defs>
          </svg>

          {/* 湍流纹理覆盖层 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 30% 50%, rgba(0,120,255,0.35), transparent 65%),
                radial-gradient(ellipse 70% 55% at 70% 45%, rgba(0,200,255,0.28), transparent 60%),
                radial-gradient(ellipse 50% 80% at 50% 80%, rgba(0,40,160,0.45), transparent 70%)`,
              filter: 'url(#nebula-turbulence)',
              mixBlendMode: 'color-dodge',
              opacity: 0.6,
            }}
          />
        </>
      )}

      {/* ── 移动端极速渲染：原生 CSS 纯 GPU 渲染的多层冰蓝云雾（0 滤镜开销，画面柔美不卡顿） ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle 280px at 20% 30%, rgba(0,160,255,0.28), transparent 70%),
            radial-gradient(circle 320px at 80% 40%, rgba(0,220,255,0.22), transparent 70%),
            radial-gradient(circle 260px at 50% 85%, rgba(0,80,220,0.32), transparent 70%),
            radial-gradient(ellipse 90% 70% at 50% 50%, rgba(0,120,255,0.18), transparent 80%)`,
          mixBlendMode: 'screen',
        }}
      />

      {/* ── 极光光球 A（移动端仅保留 1~2 个缓慢游移光球） ── */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: isMobile ? 260 : 360,
          height: isMobile ? 260 : 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,220,255,0.26) 0%, transparent 70%)',
          top: '10%',
          left: '-5%',
          mixBlendMode: 'screen',
        }}
        animate={{ x: [0, 40, 0], y: [0, 20, 0] }}
        transition={{ duration: isMobile ? 12 : 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── 极光光球 B ── */}
      <motion.div
        className="absolute pointer-events-none"
        style={{
          width: isMobile ? 240 : 320,
          height: isMobile ? 240 : 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(30,80,255,0.28) 0%, transparent 70%)',
          bottom: '5%',
          right: '-5%',
          mixBlendMode: 'screen',
        }}
        animate={{ x: [0, -35, 0], y: [0, -30, 0] }}
        transition={{ duration: isMobile ? 14 : 28, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── 桌面端专属：磁性指针聚光灯（移动端关闭避免高频重绘） ── */}
      {!isMobile && interactive && (
        <motion.div
          style={{
            position: 'absolute',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,240,255,0.22) 0%, rgba(0,120,255,0.08) 50%, transparent 75%)',
            left: glowLeft,
            top: glowTop,
            x: '-50%',
            y: '-50%',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
      )}

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
