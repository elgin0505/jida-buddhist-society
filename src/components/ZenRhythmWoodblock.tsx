"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, RotateCcw, X, Trophy, Sparkles, Heart } from "lucide-react";

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  Zen Rhythm Woodblock (下落式木鱼音游 · 暗黑禅意风)
 *  高性能 Canvas 游戏循环 + Web Audio API 零延迟音效 + 反重力粒子
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

interface Note {
  id: number;
  lane: number; // 0, 1, 2
  y: number; // 0 -> trackHeight
  hit: boolean;
  missed: boolean;
}

interface LeaderboardItem {
  rank: number;
  name: string;
  score: number;
  combo: number;
  title: string;
}

interface ZenRhythmWoodblockProps {
  onClose?: () => void;
  onScoreSave?: (score: number, maxCombo: number) => void;
}

const LANES = [
  { id: 0, key: "D", label: "戒 (D)" },
  { id: 1, key: "F", label: "定 (F)" },
  { id: 2, key: "J", label: "慧 (J)" },
];

const INITIAL_LIVES = 3;
const HIT_LINE_OFFSET = 80; // 判定线距离底部像素
const PERFECT_WINDOW = 35; // 判定像素容差 (Perfect)
const GOOD_WINDOW = 65; // 判定像素容差 (Good)

export function ZenRhythmWoodblock({ onClose, onScoreSave }: ZenRhythmWoodblockProps) {
  // ── 1. 游戏状态 (UI 响应层) ──
  const [gameState, setGameState] = useState<"ready" | "playing" | "gameover">("ready");
  const [displayScore, setDisplayScore] = useState(0);
  const [displayCombo, setDisplayCombo] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [soundMuted, setSoundMuted] = useState(false);
  const [hitFeedback, setHitFeedback] = useState<{ text: string; color: string; key: number } | null>(null);

  // 反重力粒子状态 (Framer Motion 渲染)
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; dx: number }[]
  >([]);

  // ── 2. 高性能 Ref 数据 (Game Loop 专用，不触发 React 频繁重绘) ──
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const sfxBufferRef = useRef<AudioBuffer | null>(null);

  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const livesRef = useRef(INITIAL_LIVES);
  const notesRef = useRef<Note[]>([]);
  const nextNoteIdRef = useRef(1);
  const lastSpawnTimeRef = useRef(0);
  const gameSpeedRef = useRef(4.0); // 初始下落速度
  const spawnIntervalRef = useRef(900); // 初始生成间隔 (ms)
  const isPlayingRef = useRef(false);
  const activeLanesPressRef = useRef<[boolean, boolean, boolean]>([false, false, false]);

  // ── 3. Web Audio API 零延迟音频引擎 ──
  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    // 预加载木鱼音效 /sounds/woodblock.mp3
    if (!sfxBufferRef.current && audioCtxRef.current) {
      fetch("/sounds/woodblock.mp3")
        .then((res) => {
          if (!res.ok) throw new Error("SFX not found");
          return res.arrayBuffer();
        })
        .then((buf) => audioCtxRef.current?.decodeAudioData(buf))
        .then((decoded) => {
          sfxBufferRef.current = decoded || null;
        })
        .catch(() => {
          // 备用：若无外部 mp3，自动启用高品质合成木鱼声
        });
    }

    // 背景静心佛曲 /sounds/buddhist-bgm.mp3
    if (!bgmRef.current) {
      const audio = new Audio("/sounds/buddhist-bgm.mp3");
      audio.loop = true;
      audio.volume = 0.35;
      bgmRef.current = audio;
    }
  }, []);

  // 播放木鱼音效 (0ms 延迟)
  const playWoodblockSound = useCallback((pitchMultiplier = 1.0) => {
    if (soundMuted) return;

    if (!audioCtxRef.current) {
      initAudio();
    }
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (sfxBufferRef.current) {
      // 真实录制木鱼 SFX 播放
      const source = ctx.createBufferSource();
      source.buffer = sfxBufferRef.current;
      source.playbackRate.value = pitchMultiplier;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.85, ctx.currentTime);
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
    } else {
      // 禅意木鱼物理建模合成 (Resonant Bandpass Woodblock Synth)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.setValueAtTime(580 * pitchMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(140 * pitchMultiplier, now + 0.08);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800 * pitchMultiplier, now);
      filter.Q.setValueAtTime(4.5, now);

      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    }
  }, [initAudio, soundMuted]);

  // ── 4. 反重力光尘粒子触发器 ──
  const spawnAntiGravityParticles = (laneIndex: number, hitY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const laneWidth = canvas.width / 3;
    const centerX = laneIndex * laneWidth + laneWidth / 2;

    const newParticles = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i + Math.random(),
      x: centerX + (Math.random() - 0.5) * 40,
      y: hitY,
      dx: (Math.random() - 0.5) * 30,
    }));

    setParticles((prev) => [...prev.slice(-15), ...newParticles]);
  };

  // ── 5. 击打判定引擎 (Hit Detection) ──
  const triggerHit = useCallback((laneIndex: number) => {
    if (!isPlayingRef.current) return;

    // 激活对应轨道的按压光效
    activeLanesPressRef.current[laneIndex] = true;
    setTimeout(() => {
      activeLanesPressRef.current[laneIndex] = false;
    }, 120);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const hitLineY = canvas.height - HIT_LINE_OFFSET;
    const notes = notesRef.current;

    // 寻找该轨道距离判定线最近的未击中音符
    let closestNote: Note | null = null;
    let minDistance = Infinity;

    for (const note of notes) {
      if (note.lane === laneIndex && !note.hit && !note.missed) {
        const dist = Math.abs(note.y - hitLineY);
        if (dist < minDistance) {
          minDistance = dist;
          closestNote = note;
        }
      }
    }

    if (closestNote && minDistance <= GOOD_WINDOW) {
      closestNote.hit = true;
      playWoodblockSound(1.0 + Math.min(comboRef.current * 0.015, 0.4));

      if (minDistance <= PERFECT_WINDOW) {
        // 💎 PERFECT 判定
        scoreRef.current += 100 + comboRef.current * 10;
        comboRef.current += 1;
        maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
        setHitFeedback({ text: "妙 觉 · PERFECT", color: "#FDE047", key: Date.now() });
        spawnAntiGravityParticles(laneIndex, hitLineY);
      } else {
        // ✨ GOOD 判定
        scoreRef.current += 50 + comboRef.current * 5;
        comboRef.current += 1;
        maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
        setHitFeedback({ text: "清 净 · GOOD", color: "#67E8F9", key: Date.now() });
      }

      // 动态难度机制：随连击加速
      if (comboRef.current % 10 === 0) {
        gameSpeedRef.current = Math.min(4.0 + comboRef.current * 0.08, 9.5);
        spawnIntervalRef.current = Math.max(900 - comboRef.current * 8, 380);
      }

      setDisplayScore(scoreRef.current);
      setDisplayCombo(comboRef.current);
    }
  }, [playWoodblockSound]);

  // ── 6. 游戏结束处理 ──
  const handleGameOver = useCallback(() => {
    isPlayingRef.current = false;
    setGameState("gameover");
    if (bgmRef.current) {
      bgmRef.current.pause();
    }
    if (onScoreSave) {
      onScoreSave(scoreRef.current, maxComboRef.current);
    }
  }, [onScoreSave]);

  // ── 7. 游戏主循环 (HTML5 Game Loop) ──
  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTimestamp = performance.now();

    const gameLoop = (now: number) => {
      const delta = (now - lastTimestamp) / 16.666; // 60fps 标准化
      lastTimestamp = now;

      const width = canvas.width;
      const height = canvas.height;
      const hitLineY = height - HIT_LINE_OFFSET;
      const laneWidth = width / 3;

      // 清空画布
      ctx.clearRect(0, 0, width, height);

      // 1. 绘制 3 条极简轨道边框与微光背景
      for (let i = 0; i < 3; i++) {
        const laneX = i * laneWidth;

        // 轨道按压高光
        if (activeLanesPressRef.current[i]) {
          const pressGrad = ctx.createLinearGradient(0, height, 0, height - 180);
          pressGrad.addColorStop(0, "rgba(212, 175, 55, 0.28)");
          pressGrad.addColorStop(1, "rgba(212, 175, 55, 0)");
          ctx.fillStyle = pressGrad;
          ctx.fillRect(laneX, 0, laneWidth, height);
        }

        // 轨道分割线 (极低透明度暖金)
        ctx.strokeStyle = "rgba(212, 175, 55, 0.12)";
        ctx.lineWidth = 1;
        if (i > 0) {
          ctx.beginPath();
          ctx.moveTo(laneX, 0);
          ctx.lineTo(laneX, height);
          ctx.stroke();
        }
      }

      // 2. 绘制横向金色判定线 (Hit Line)
      const lineGrad = ctx.createLinearGradient(0, 0, width, 0);
      lineGrad.addColorStop(0, "rgba(212, 175, 55, 0.05)");
      lineGrad.addColorStop(0.5, "rgba(253, 224, 71, 0.85)");
      lineGrad.addColorStop(1, "rgba(212, 175, 55, 0.05)");

      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "rgba(212, 175, 55, 0.6)";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, hitLineY);
      ctx.lineTo(width, hitLineY);
      ctx.stroke();
      ctx.shadowBlur = 0; // 重置阴影

      // 3. 定时生成新音符 (菩提光斑)
      if (now - lastSpawnTimeRef.current > spawnIntervalRef.current) {
        const randomLane = Math.floor(Math.random() * 3);
        notesRef.current.push({
          id: nextNoteIdRef.current++,
          lane: randomLane,
          y: -20,
          hit: false,
          missed: false,
        });
        lastSpawnTimeRef.current = now;
      }

      // 4. 更新并绘制下落音符
      const activeNotes: Note[] = [];
      const speed = gameSpeedRef.current * delta;

      for (const note of notesRef.current) {
        if (!note.hit) {
          note.y += speed;

          // 漏击判定 (超出判定线下方)
          if (note.y > hitLineY + GOOD_WINDOW && !note.missed) {
            note.missed = true;
            comboRef.current = 0;
            livesRef.current = Math.max(0, livesRef.current - 1);
            setDisplayCombo(0);
            setLives(livesRef.current);
            setHitFeedback({ text: "落 空 · MISS", color: "#94A3B8", key: Date.now() });

            // 生命值耗尽 -> 止静结算
            if (livesRef.current <= 0) {
              handleGameOver();
              return;
            }
          }

          // 仅绘制在屏幕范围内的音符
          if (note.y < height + 40) {
            activeNotes.push(note);

            const centerX = note.lane * laneWidth + laneWidth / 2;
            const radius = 18;

            // 绘制“菩提光斑” (柔和金光晕染圆球)
            ctx.save();
            ctx.shadowColor = "rgba(234, 179, 8, 0.85)";
            ctx.shadowBlur = 16;

            const noteGrad = ctx.createRadialGradient(
              centerX - 3,
              note.y - 3,
              2,
              centerX,
              note.y,
              radius
            );
            noteGrad.addColorStop(0, "#FEF08A");
            noteGrad.addColorStop(0.5, "#EAB308");
            noteGrad.addColorStop(1, "#854D0E");

            ctx.fillStyle = noteGrad;
            ctx.beginPath();
            ctx.arc(centerX, note.y, radius, 0, Math.PI * 2);
            ctx.fill();

            // 内核清亮白光
            ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
            ctx.beginPath();
            ctx.arc(centerX - 4, note.y - 4, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }
      }

      notesRef.current = activeNotes;
      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [gameState, handleGameOver]);

  // ── 8. 键盘监听 (D, F, J & ESC) ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
        return;
      }

      if (gameState !== "playing") return;

      const key = e.key.toUpperCase();
      if (key === "D") triggerHit(0);
      else if (key === "F") triggerHit(1);
      else if (key === "J") triggerHit(2);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, triggerHit, onClose]);

  // ── 9. 自适应 Canvas 尺寸 ──
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [gameState]);

  // ── 10. 开始游戏 ──
  const startGame = () => {
    initAudio();
    if (bgmRef.current && !soundMuted) {
      bgmRef.current.currentTime = 0;
      bgmRef.current.play().catch(() => {});
    }
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    livesRef.current = INITIAL_LIVES;
    notesRef.current = [];
    gameSpeedRef.current = 4.0;
    spawnIntervalRef.current = 900;
    isPlayingRef.current = true;

    setDisplayScore(0);
    setDisplayCombo(0);
    setLives(INITIAL_LIVES);
    setHitFeedback(null);
    setDisplayScore(0);
    setDisplayCombo(0);
    setLives(INITIAL_LIVES);
    setHitFeedback(null);
    setGameState("playing");
  };

  // 动态排行榜数据 (优先读取云端排行榜)
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);

  useEffect(() => {
    fetch("/api/game/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.leaderboard) && data.leaderboard.length > 0) {
          setLeaderboard(data.leaderboard);
        } else {
          setLeaderboard([
            { rank: 1, name: "慧海居士", score: 8600, combo: 68, title: "金刚妙觉" },
            { rank: 2, name: "净心修行者", score: 6200, combo: 45, title: "破迷居士" },
            { rank: 3, name: "妙音行者", score: 4900, combo: 32, title: "随喜行者" },
            { rank: 4, name: "同修 (我)", score: Math.max(displayScore, 3600), combo: maxComboRef.current || 24, title: "初发心" },
            { rank: 5, name: "法空同修", score: 2800, combo: 18, title: "初发心" },
          ]);
        }
      })
      .catch(() => {});
  }, [gameState, displayScore]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#0a0d14] text-white select-none overflow-hidden font-sans">
      {/* ── 背景暗黑微光噪点 ── */}
      <div className="absolute inset-0 bg-radial from-[#151d2f]/70 via-[#0a0d14] to-[#05070a] pointer-events-none" />

      {/* ── 顶部状态栏 (Top Bar) ── */}
      <div className="relative z-20 w-full max-w-2xl px-6 py-4 flex items-center justify-between border-b border-white/10 backdrop-blur-md">
        {/* 分数 & 称号 */}
        <div className="flex flex-col">
          <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-serif">
            修持功德分
          </span>
          <span className="text-2xl font-black tracking-wider text-amber-300 font-mono">
            {displayScore.toLocaleString()}
          </span>
        </div>

        {/* 悬浮连击 Combo */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] tracking-widest text-stone-400 font-serif">连击</span>
          <motion.span
            key={displayCombo}
            initial={{ scale: 1.3, color: "#FEF08A" }}
            animate={{ scale: 1, color: "#FDE047" }}
            className="text-2xl font-black font-mono tracking-tight"
          >
            {displayCombo}
          </motion.span>
        </div>

        {/* 生命值与静音控制 */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: INITIAL_LIVES }).map((_, i) => (
              <Heart
                key={i}
                className={`h-4 w-4 transition-colors ${
                  i < lives ? "fill-amber-400 text-amber-400" : "fill-stone-700 text-stone-700"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setSoundMuted(!soundMuted);
              if (bgmRef.current) {
                if (!soundMuted) bgmRef.current.pause();
                else bgmRef.current.play().catch(() => {});
              }
            }}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-stone-300 transition-colors"
            title={soundMuted ? "开启音效" : "静音"}
          >
            {soundMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-amber-400" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-stone-300 transition-colors"
              title="退出修持"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── 游戏主轨道视口 (3 Lanes Track Canvas) ── */}
      <div className="relative z-10 w-full max-w-md h-full flex flex-col items-center justify-center my-auto">
        <canvas
          ref={canvasRef}
          className="w-full h-full max-h-[70vh] rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        />

        {/* 判定浮动反馈 (Perfect / Good / Miss) */}
        <AnimatePresence>
          {hitFeedback && (
            <motion.div
              key={hitFeedback.key}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 1.1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute top-1/3 pointer-events-none font-serif text-sm font-bold tracking-[0.25em]"
              style={{ color: hitFeedback.color, textShadow: `0 0 12px ${hitFeedback.color}` }}
            >
              {hitFeedback.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 反重力金色光尘粒子 (Anti-Gravity Particles) ── */}
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: p.x, y: p.y, opacity: 1, scale: 1.2 }}
              animate={{
                y: p.y - 85 - Math.random() * 25,
                x: p.x + p.dx,
                opacity: 0,
                scale: 0.3,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute pointer-events-none h-2.5 w-2.5 rounded-full bg-amber-300 shadow-[0_0_10px_#FDE047]"
              onAnimationComplete={() => {
                setParticles((prev) => prev.filter((item) => item.id !== p.id));
              }}
            />
          ))}
        </AnimatePresence>

        {/* 底部 3 轨道触控/点击交互板 (Touch / Click Pads) */}
        <div className="w-full grid grid-cols-3 gap-2 px-1 pt-3 pb-6">
          {LANES.map((lane) => (
            <button
              key={lane.id}
              type="button"
              onPointerDown={() => triggerHit(lane.id)}
              className="h-16 rounded-xl bg-white/5 hover:bg-amber-400/20 active:bg-amber-400/40 border border-white/10 active:border-amber-400/80 flex flex-col items-center justify-center font-serif text-sm tracking-wider text-stone-200 transition-colors backdrop-blur-md cursor-pointer group"
            >
              <span className="text-base font-bold text-amber-300 group-hover:scale-110 transition-transform">
                {lane.label}
              </span>
              <span className="text-[10px] text-stone-500 font-mono">击打</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 开始弹窗 (Ready Screen) ── */}
      <AnimatePresence>
        {gameState === "ready" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/75 backdrop-blur-xl p-4"
          >
            <div className="w-full max-w-sm rounded-3xl border border-amber-400/30 bg-[#121622]/95 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
              <span className="text-5xl">🪵</span>
              <h2 className="text-xl font-bold font-serif text-amber-300 mt-4 tracking-widest">
                木鱼定心 · 梵音音游
              </h2>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed font-serif">
                随菩提光斑落入判定线瞬间击响木鱼。<br />
                支持键盘 <span className="text-amber-300 font-mono font-bold">D / F / J</span> 或屏幕触控。
              </p>

              <button
                type="button"
                onClick={startGame}
                className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-bold font-serif tracking-widest text-sm shadow-[0_0_25px_rgba(217,119,6,0.5)] hover:brightness-110 active:scale-95 transition-all"
              >
                开启修持 (Start)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 模块四：止静结算与精进榜 (Game Over / Leaderboard) ── */}
      <AnimatePresence>
        {gameState === "gameover" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md rounded-3xl border border-amber-400/30 bg-[#0e121e]/95 p-6 sm:p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,0.95)]"
            >
              {/* 标题 */}
              <div className="flex items-center justify-center gap-2 mb-1">
                <Trophy className="h-5 w-5 text-amber-400" />
                <h3 className="text-xl font-bold font-serif text-amber-300 tracking-widest">
                  止静归真 · 精进榜
                </h3>
              </div>
              <p className="text-[11px] text-stone-400 font-serif">心无挂碍，业障暂歇</p>

              {/* 本次修持成绩卡 */}
              <div className="my-5 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-around">
                <div>
                  <span className="block text-[10px] text-stone-400 font-serif">本次积分</span>
                  <span className="text-2xl font-black font-mono text-amber-300">{displayScore}</span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <span className="block text-[10px] text-stone-400 font-serif">最高连击</span>
                  <span className="text-2xl font-black font-mono text-amber-300">{maxComboRef.current}</span>
                </div>
              </div>

              {/* 精进 Top 5 榜单 */}
              <div className="space-y-2 text-left mb-6">
                <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block px-1">
                  精进同修排行 Top 5
                </span>
                {leaderboard.map((item) => (
                  <div
                    key={item.rank}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                      item.name.includes("(我)")
                        ? "bg-amber-500/20 border border-amber-400/40 text-amber-200"
                        : "bg-white/5 border border-white/5 text-stone-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold w-4 text-center text-amber-400">
                        {item.rank}
                      </span>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-[10px] text-stone-500 font-serif">[{item.title}]</span>
                    </div>
                    <span className="font-mono font-bold text-amber-300">{item.score} 分</span>
                  </div>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={startGame}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-bold font-serif text-xs tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  <RotateCcw className="h-4 w-4" />
                  再次修持 (Retry)
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 font-serif text-xs tracking-wider transition-all"
                  >
                    退出
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ZenRhythmWoodblock;
