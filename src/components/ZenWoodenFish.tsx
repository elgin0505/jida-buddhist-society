"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingText {
  id: number;
  text: string;
  x: number;
}

const BLESSING_WORDS = [
  "功德 +1",
  "智慧 +1",
  "福气 +1",
  "烦恼 -1",
  "心生欢喜",
  "平安吉祥",
  "清净自在",
  "菩提日增",
];

export function ZenWoodenFish() {
  const [isOpen, setIsOpen] = useState(false);
  const [meritCount, setMeritCount] = useState(0);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isStriking, setIsStriking] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 初始化今日敲击次数
  useEffect(() => {
    const saved = localStorage.getItem("jbs_zen_merit_count");
    if (saved) {
      setMeritCount(parseInt(saved, 10) || 0);
    }
  }, []);

  // Web Audio API 合成真实的空灵木鱼敲击声（无需下载外部音频文件，零延迟，100%离线可用）
  const playWoodenFishSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // 1. 主共鸣腔 (木质沉稳基频)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(580, now);
      osc1.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      gain1.gain.setValueAtTime(0.7, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // 2. 泛音敲击 (清脆质感)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1180, now);
      osc2.frequency.exponentialRampToValueAtTime(320, now + 0.04);

      gain2.gain.setValueAtTime(0.4, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.13);
      osc2.stop(now + 0.07);
    } catch {
      // 忽略音频错误
    }
  };

  const handleStrike = () => {
    playWoodenFishSound();
    setIsStriking(true);
    setTimeout(() => setIsStriking(false), 120);

    const newCount = meritCount + 1;
    setMeritCount(newCount);
    localStorage.setItem("jbs_zen_merit_count", String(newCount));

    // 随机选择一段祝福语
    const word = BLESSING_WORDS[Math.floor(Math.random() * BLESSING_WORDS.length)];
    const randomOffset = (Math.random() - 0.5) * 60; // 左右微弱随机散开

    const newFloating: FloatingText = {
      id: Date.now() + Math.random(),
      text: word,
      x: randomOffset,
    };

    setFloatingTexts((prev) => [...prev.slice(-6), newFloating]);
  };

  const removeFloatingText = (id: number) => {
    setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <>
      {/* 悬浮木鱼触发按钮 (右下角) */}
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              key="muyu-trigger"
              initial={{ scale: 0, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 20 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2.5 rounded-full border border-ocher/40 bg-warm-white/90 px-4 py-2.5 shadow-[0_8px_24px_-4px_rgba(201,162,39,0.25)] backdrop-blur-md transition-all hover:bg-white"
              title="打开电子木鱼"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-golden-deep/15 text-golden-rich">
                <WoodenFishSvg className="h-5 w-5" />
              </div>
              <div className="text-left pr-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-golden-rich">
                  静心木鱼
                </p>
                <p className="text-xs font-semibold text-charcoal">
                  功德: {meritCount}
                </p>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 电子木鱼弹窗挂件 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="muyu-panel"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: "spring", stiffness: 420, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-80 overflow-hidden rounded-3xl border border-white/70 bg-warm-white/95 p-6 shadow-[0_24px_64px_-8px_rgba(201,162,39,0.3),0_0_0_1px_rgba(201,162,39,0.15)] backdrop-blur-2xl"
          >
            {/* 顶栏控制 */}
            <div className="flex items-center justify-between border-b border-ocher/15 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-jade animate-pulse" />
                <h4 className="text-sm font-bold text-charcoal">静心电子木鱼</h4>
              </div>

              <div className="flex items-center gap-2">
                {/* 声音开关 */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`rounded-lg p-1.5 transition-colors ${
                    soundEnabled
                      ? "text-golden-rich hover:bg-golden-deep/10"
                      : "text-muted/40 hover:bg-ocher-light/30"
                  }`}
                  title={soundEnabled ? "静音" : "开启声音"}
                >
                  {soundEnabled ? (
                    <SoundOnSvg className="h-4 w-4" />
                  ) : (
                    <SoundOffSvg className="h-4 w-4" />
                  )}
                </button>

                {/* 关闭窗口 */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-muted transition-colors hover:bg-ocher-light/30 hover:text-charcoal"
                >
                  <CloseSvg className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 功德计数展示 */}
            <div className="my-3 text-center">
              <p className="text-[11px] font-medium text-muted">今日积聚功德</p>
              <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-golden-rich">
                {meritCount}
              </p>
            </div>

            {/* 木鱼主体敲击区 */}
            <div className="relative my-4 flex flex-col items-center justify-center py-4 select-none">
              {/* 浮动飞出文字 */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                {floatingTexts.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 1, y: 0, x: item.x, scale: 0.8 }}
                    animate={{ opacity: 0, y: -90, x: item.x * 1.3, scale: 1.25 }}
                    transition={{ duration: 1.1, ease: "easeOut" }}
                    onAnimationComplete={() => removeFloatingText(item.id)}
                    className="absolute text-sm font-bold text-golden-rich drop-shadow-sm pointer-events-none whitespace-nowrap"
                  >
                    {item.text}
                  </motion.div>
                ))}
              </div>

              {/* 木鱼 SVG */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.90 }}
                animate={isStriking ? { scale: [1, 0.91, 1.03, 1] } : {}}
                transition={{ duration: 0.15 }}
                onClick={handleStrike}
                className="group relative flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-b from-golden-deep/20 via-ocher-light/40 to-golden-deep/30 p-4 shadow-[0_12px_28px_-6px_rgba(201,162,39,0.25)] ring-4 ring-white/80 active:ring-golden-deep/40 transition-all cursor-pointer focus:outline-none"
              >
                <div className="relative h-24 w-24 text-golden-rich transition-transform group-hover:scale-105">
                  <WoodenFishDetailedSvg />
                </div>

                {/* 敲击水波纹 */}
                {isStriking && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 rounded-full border-2 border-golden-deep pointer-events-none"
                  />
                )}
              </motion.button>

              <p className="mt-4 text-xs font-medium text-muted/80 animate-pulse">
                点击木鱼 · 静心培德
              </p>
            </div>

            {/* 底部禅意寄语 */}
            <div className="rounded-xl bg-ocher-light/20 p-2.5 text-center text-[11px] text-muted">
              “静坐常思己过，闲谈莫论人非。”
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── SVG 图标集合 ──
function WoodenFishSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3C7 3 3 7 3 12c0 3.5 2 6.5 5 8v1h8v-1c3-1.5 5-4.5 5-8 0-5-4-9-9-9z" />
      <path d="M9 13a3 3 0 106 0M8 8h.01M16 8h.01" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function WoodenFishDetailedSvg() {
  return (
    <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
      {/* 木鱼主体 */}
      <path
        d="M50 15 C26 15 14 32 14 55 C14 74 28 85 42 88 L42 90 L58 90 L58 88 C72 85 86 74 86 55 C86 32 74 15 50 15 Z"
        fill="url(#muyuGrad)"
        stroke="#b8860b"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* 木鱼嘴巴缝隙 */}
      <path
        d="M32 58 C32 68 68 68 68 58 C68 52 32 52 32 58 Z"
        fill="#422006"
        stroke="#854d0e"
        strokeWidth="2"
      />
      {/* 鱼眼/花纹刻饰 */}
      <circle cx="34" cy="36" r="5" fill="#78350f" />
      <circle cx="66" cy="36" r="5" fill="#78350f" />
      <path
        d="M50 24 C44 28 44 38 50 42 C56 38 56 28 50 24 Z"
        fill="#fef3c7"
        opacity="0.6"
      />
      {/* 侧面鳞纹雕刻 */}
      <path
        d="M24 46 Q18 56 26 66"
        stroke="#854d0e"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M76 46 Q82 56 74 66"
        stroke="#854d0e"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      <defs>
        <radialGradient id="muyuGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function SoundOnSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
    </svg>
  );
}

function SoundOffSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
    </svg>
  );
}

function CloseSvg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
