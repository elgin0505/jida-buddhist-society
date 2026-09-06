"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

// ── Breathing Guide 正念呼吸引导 ────────────────────────────
type BreathPhase = "吸气" | "屏息" | "呼气";

interface BreathCycleConfig {
  inhale: number;   // 吸气时长（秒）
  hold: number;     // 屏息时长（秒）
  exhale: number;   // 呼气时长（秒）
  rest: number;     // 呼后屏息（秒）
}

interface BreathingGuideProps {
  cycle?: BreathCycleConfig;
  className?: string;
  onPhaseChange?: (phase: BreathPhase) => void;
  autoStart?: boolean;
}

const defaultCycle: BreathCycleConfig = {
  inhale: 4,
  hold: 2,
  exhale: 6,
  rest: 2,
};

export const BreathingGuide: React.FC<BreathingGuideProps> = ({
  cycle = defaultCycle,
  className,
  onPhaseChange,
  autoStart = true,
}) => {
  const [phase, setPhase] = useState<BreathPhase>("吸气");
  const [scale, setScale] = useState(0.65);
  const [opacity, setOpacity] = useState(0.5);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [counter, setCounter] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const totalDuration =
    cycle.inhale + cycle.hold + cycle.exhale + cycle.rest;

  const animate = useCallback(
    (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = (timestamp - startRef.current) / 1000;
      const progress = (elapsed % totalDuration) / totalDuration;

      const inhaleEnd = cycle.inhale / totalDuration;
      const holdEnd = inhaleEnd + cycle.hold / totalDuration;
      const exhaleEnd = holdEnd + cycle.exhale / totalDuration;

      let newPhase: BreathPhase;
      let newScale: number;
      let newOpacity: number;

      if (progress < inhaleEnd) {
        const t = progress / inhaleEnd;
        newPhase = "吸气";
        newScale = 0.65 + t * 0.35;
        newOpacity = 0.5 + t * 0.5;
        // 秒计数器
        setCounter(Math.ceil((inhaleEnd - progress) * totalDuration));
      } else if (progress < holdEnd) {
        newPhase = "屏息";
        newScale = 1;
        newOpacity = 1;
        setCounter(Math.ceil((holdEnd - progress) * totalDuration));
      } else if (progress < exhaleEnd) {
        const t = (progress - holdEnd) / (cycle.exhale / totalDuration);
        newPhase = "呼气";
        newScale = 1 - t * 0.35;
        newOpacity = 1 - t * 0.5;
        setCounter(Math.ceil((exhaleEnd - progress) * totalDuration));
      } else {
        newPhase = "屏息";
        newScale = 0.65;
        newOpacity = 0.5;
        setCounter(
          Math.ceil(((1 - progress) * totalDuration))
        );
      }

      setPhase((prev) => {
        if (prev !== newPhase) {
          onPhaseChange?.(newPhase);
        }
        return newPhase;
      });
      setScale(newScale);
      setOpacity(newOpacity);

      rafRef.current = requestAnimationFrame(animate);
    },
    [cycle, totalDuration, onPhaseChange]
  );

  useEffect(() => {
    if (!isRunning) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning, animate]);

  const phaseColor = {
    吸气: "from-sky-200/80 to-blue-300/60",
    屏息: "from-golden-candle/40 to-amber-200/40",
    呼气: "from-jade-light/40 to-cyan-200/40",
  };

  return (
    <div className={cn("flex flex-col items-center gap-8", className)}>
      {/* 呼吸圆环动画 */}
      <div className="relative flex h-52 w-52 items-center justify-center">
        {/* 外光晕层 */}
        <div
          className="absolute inset-0 rounded-full transition-all"
          style={{
            transform: `scale(${scale * 1.15})`,
            opacity: opacity * 0.3,
            background:
              "radial-gradient(circle, rgba(201,162,39,0.4) 0%, transparent 70%)",
            transition: "transform 0.25s ease-out, opacity 0.25s ease-out",
          }}
        />
        {/* 主圆 */}
        <div
          className={cn(
            "relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br shadow-lg",
            phaseColor[phase]
          )}
          style={{
            transform: `scale(${scale})`,
            opacity: 0.7 + opacity * 0.3,
            transition: "transform 0.25s ease-out, opacity 0.25s ease-out",
          }}
        >
          {/* 内层纹路圆 */}
          <div
            className="absolute inset-4 rounded-full border border-white/30"
            style={{ opacity }}
          />
          <div
            className="absolute inset-8 rounded-full border border-white/20"
            style={{ opacity: opacity * 0.7 }}
          />

          {/* 文字 */}
          <div className="z-10 flex flex-col items-center">
            <span className="text-xl font-light tracking-[0.3em] text-charcoal/80">
              {phase}
            </span>
            <span className="mt-1 text-3xl font-thin tabular-nums text-charcoal/60">
              {counter}
            </span>
          </div>
        </div>
      </div>

      {/* 提示文字 */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm tracking-widest text-muted">跟随节奏，觉察呼吸</p>
        <div className="flex items-center gap-4 text-xs text-muted/60">
          <span>吸气 {cycle.inhale}s</span>
          <span>·</span>
          <span>屏息 {cycle.hold}s</span>
          <span>·</span>
          <span>呼气 {cycle.exhale}s</span>
        </div>
      </div>

      {/* 控制按钮 */}
      <button
        onClick={() => {
          setIsRunning((v) => !v);
          if (!isRunning) startRef.current = null;
        }}
        className="flex items-center gap-2 rounded-full border border-golden-deep/30 bg-warm-white/60 px-6 py-2 text-sm text-golden-rich transition-all hover:bg-ocher-light/30"
      >
        {isRunning ? (
          <>
            <span>⏸</span>
            <span>暂停</span>
          </>
        ) : (
          <>
            <span>▶</span>
            <span>开始</span>
          </>
        )}
      </button>
    </div>
  );
};

// ── Lotus Pulse 莲花脉动动画 ─────────────────────────────────
interface LotusPulseProps {
  size?: number;
  className?: string;
  color?: string;
}

export const LotusPulse: React.FC<LotusPulseProps> = ({
  size = 60,
  className,
  color = "#c9a227",
}) => (
  <div
    className={cn("relative flex items-center justify-center", className)}
    style={{ width: size, height: size }}
  >
    {/* 脉冲圆环 */}
    {[0, 0.4, 0.8].map((delay, i) => (
      <div
        key={i}
        className="absolute inset-0 rounded-full border"
        style={{
          borderColor: color,
          opacity: 0.4,
          animation: `lotus-pulse 2.4s ease-out ${delay}s infinite`,
        }}
      />
    ))}
    {/* 中心莲花 */}
    <span
      className="relative z-10 select-none"
      style={{ fontSize: size * 0.4, lineHeight: 1 }}
    >
      🪷
    </span>
  </div>
);

// ── Ink Ripple 水墨波纹 ──────────────────────────────────────
interface InkRippleProps {
  trigger?: boolean;
  className?: string;
}

export const InkRipple: React.FC<InkRippleProps> = ({
  trigger = false,
  className,
}) => {
  const [ripples, setRipples] = useState<number[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const id = Date.now();
    setRipples((prev) => [...prev, id]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r !== id));
    }, 1200);
  }, [trigger]);

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {ripples.map((id) =>
        [0, 1, 2].map((i) => (
          <div
            key={`${id}-${i}`}
            className="absolute rounded-full border border-golden-deep/40"
            style={{
              animation: `ink-ripple 1.2s ease-out ${i * 0.2}s forwards`,
            }}
          />
        ))
      )}
    </div>
  );
};
