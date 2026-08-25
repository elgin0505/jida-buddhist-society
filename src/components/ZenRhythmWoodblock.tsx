"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  X,
  Trophy,
  Heart,
  Music2,
  Zap,
  Play,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 🪷 技大佛学会 - ZenRhythmWoodblock (梵音木鱼下落式音游 · 现代佛曲版)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * 📌 【Prisma 数据库 Schema 关联说明】：
 * 本组件结算时通过 POST /api/game/leaderboard 将战绩关联至已注册用户：
 * 1. 在 `prisma/schema.prisma` 中定义关系：
 *    model User {
 *      id            String         @id @default(cuid())
 *      name          String
 *      email         String         @unique
 *      zenGameScores ZenGameScore[]
 *    }
 *    model ZenGameScore {
 *      id          String   @id @default(cuid())
 *      userId      String
 *      user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
 *      score       Int
 *      maxCombo    Int
 *      trackName   String?
 *      achievedAt  DateTime @default(now())
 *      @@index([userId])
 *    }
 * 2. 前端从 localStorage 提取当前登录同修的身份凭证 (jbs_auth_user)，
 *    向后端提交 userId / userEmail，以确保战绩精准计入玩家功德簿并载入排行榜。
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

// ── 1. 现代佛曲数据结构与曲目列表 ──
export interface BuddhistTrack {
  id: string;
  name: string;
  subtitle: string;
  bpm: number;
  spawnInterval: number; // 音符生成间隔 (ms)
  fallSpeed: number;     // 初始下落基速 (px/frame)
  difficulty: "入门 · 初发心" | "精进 · 日常行" | "金刚 · 极专注";
  badgeColor: string;
  bgmSrc: string;        // 佛曲音频路径占位符
  woodblockSfx: string;  // 木鱼音效路径占位符
  description: string;
}

export const BUDDHIST_TRACKS: BuddhistTrack[] = [
  {
    id: "dabei-cyber",
    name: "《大悲咒 (赛博轻灵版)》",
    subtitle: "千手千眼观世音菩萨广大圆满无碍大悲心陀罗尼",
    bpm: 72,
    spawnInterval: 980,
    fallSpeed: 4.2,
    difficulty: "入门 · 初发心",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    bgmSrc: "/sounds/dabei-cyber.mp3",
    woodblockSfx: "/sounds/woodblock.mp3",
    description: "节奏舒缓悠扬，适合初发心同修调节呼吸，安定心神。",
  },
  {
    id: "yaoshi-lofi",
    name: "《药师佛心咒 (Lo-Fi 禅意)》",
    subtitle: "药师琉璃光如来消灾延寿灌顶真言",
    bpm: 96,
    spawnInterval: 720,
    fallSpeed: 5.6,
    difficulty: "精进 · 日常行",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    bgmSrc: "/sounds/yaoshi-lofi.mp3",
    woodblockSfx: "/sounds/woodblock.mp3",
    description: "Lo-Fi 律动与清脆木鱼自然交融，适合日常专注与自律修持。",
  },
  {
    id: "sixword-ambient",
    name: "《六字真言 (冥想电音版)》",
    subtitle: "嗡嘛呢叭咪吽 · 观音六字大明咒能量律动",
    bpm: 128,
    spawnInterval: 500,
    fallSpeed: 7.2,
    difficulty: "金刚 · 极专注",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    bgmSrc: "/sounds/sixword-ambient.mp3",
    woodblockSfx: "/sounds/woodblock.mp3",
    description: "紧凑密集的鼓点与菩提光斑，挑战手眼如一的高维金刚定力。",
  },
];

interface Note {
  id: number;
  lane: number; // 0: 戒 (D), 1: 定 (F), 2: 慧 (J)
  y: number;
  hit: boolean;
  missed: boolean;
}

interface LeaderboardRecord {
  rank: number;
  id: string;
  userId: string;
  name: string;
  userEmail: string;
  score: number;
  maxCombo: number;
  trackName: string;
  title: string;
}

interface ZenRhythmWoodblockProps {
  onClose?: () => void;
  onScoreSave?: (score: number, maxCombo: number, trackName: string) => void;
}

const LANES = [
  { id: 0, key: "D", label: "戒 (D)" },
  { id: 1, key: "F", label: "定 (F)" },
  { id: 2, key: "J", label: "慧 (J)" },
];

const INITIAL_LIVES = 3;
const HIT_LINE_OFFSET = 80;
const PERFECT_WINDOW = 36;
const GOOD_WINDOW = 68;

export function ZenRhythmWoodblock({ onClose, onScoreSave }: ZenRhythmWoodblockProps) {
  // ── 状态管理 ──
  const [gameState, setGameState] = useState<"select" | "playing" | "gameover">("select");
  const [selectedTrack, setSelectedTrack] = useState<BuddhistTrack>(BUDDHIST_TRACKS[0]);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayCombo, setDisplayCombo] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [soundMuted, setSoundMuted] = useState(false);
  const [hitFeedback, setHitFeedback] = useState<{ text: string; color: string; key: number } | null>(null);

  // 真实排行榜数据与加载状态
  const [leaderboard, setLeaderboard] = useState<LeaderboardRecord[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [currentUserInfo, setCurrentUserInfo] = useState<{ id?: string; email?: string; name?: string } | null>(null);

  // 反重力粒子
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; dx: number }[]
  >([]);

  // ── Game Loop 专用 Ref ──
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
  const gameSpeedRef = useRef(4.2);
  const spawnIntervalRef = useRef(980);
  const isPlayingRef = useRef(false);
  const activeLanesPressRef = useRef<[boolean, boolean, boolean]>([false, false, false]);

  // 读取当前已登录的修持用户凭证
  useEffect(() => {
    try {
      const stored = localStorage.getItem("jbs_auth_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUserInfo(parsed);
      }
    } catch {
      // 忽略解析错误
    }
  }, []);

  // ── 拉取真实云端排行榜数据 ──
  const fetchLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch("/api/game/leaderboard", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.leaderboard)) {
        setLeaderboard(data.leaderboard);
      }
    } catch (e) {
      console.error("Failed to fetch real leaderboard:", e);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  // ── Web Audio API 零延迟音频引擎 ──
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
      fetch(selectedTrack.woodblockSfx)
        .then((res) => {
          if (!res.ok) throw new Error("SFX file not found");
          return res.arrayBuffer();
        })
        .then((buf) => audioCtxRef.current?.decodeAudioData(buf))
        .then((decoded) => {
          sfxBufferRef.current = decoded;
        })
        .catch(() => {
          // 自动降级为内置高阶带通物理合成器
        });
    }

    // 初始化所选曲目 BGM
    if (bgmRef.current) {
      bgmRef.current.pause();
    }
    const audio = new Audio(selectedTrack.bgmSrc);
    audio.loop = true;
    audio.volume = 0.35;
    bgmRef.current = audio;
  }, [selectedTrack]);

  // 播放 0ms 延迟真实/合成木鱼音效
  const playWoodblockSound = useCallback((pitchMultiplier = 1.0) => {
    if (soundMuted) return;
    if (!audioCtxRef.current) initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (sfxBufferRef.current) {
      const source = ctx.createBufferSource();
      source.buffer = sfxBufferRef.current;
      source.playbackRate.value = pitchMultiplier;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.88, ctx.currentTime);
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
    } else {
      // 物理建模带通谐振合成木鱼 (Resonant Bandpass Synth)
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.setValueAtTime(590 * pitchMultiplier, now);
      osc.frequency.exponentialRampToValueAtTime(140 * pitchMultiplier, now + 0.08);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(820 * pitchMultiplier, now);
      filter.Q.setValueAtTime(4.6, now);

      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    }
  }, [initAudio, soundMuted]);

  // 触发反重力金色光尘粒子
  const spawnAntiGravityParticles = (laneIndex: number, hitY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const laneWidth = canvas.width / 3;
    const centerX = laneIndex * laneWidth + laneWidth / 2;

    const newParticles = Array.from({ length: 5 }, (_, i) => ({
      id: Date.now() + i + Math.random(),
      x: centerX + (Math.random() - 0.5) * 38,
      y: hitY,
      dx: (Math.random() - 0.5) * 28,
    }));

    setParticles((prev) => [...prev.slice(-15), ...newParticles]);
  };

  // 击打判定
  const triggerHit = useCallback((laneIndex: number) => {
    if (!isPlayingRef.current) return;

    activeLanesPressRef.current[laneIndex] = true;
    setTimeout(() => {
      activeLanesPressRef.current[laneIndex] = false;
    }, 120);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const hitLineY = canvas.height - HIT_LINE_OFFSET;
    const notes = notesRef.current;

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
        scoreRef.current += 100 + comboRef.current * 10;
        comboRef.current += 1;
        maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
        setHitFeedback({ text: "妙 觉 · PERFECT", color: "#FDE047", key: Date.now() });
        spawnAntiGravityParticles(laneIndex, hitLineY);
      } else {
        scoreRef.current += 50 + comboRef.current * 5;
        comboRef.current += 1;
        maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
        setHitFeedback({ text: "清 净 · GOOD", color: "#67E8F9", key: Date.now() });
      }

      setDisplayScore(scoreRef.current);
      setDisplayCombo(comboRef.current);
    }
  }, [playWoodblockSound]);

  // 结算并上报真实数据库
  const handleGameOver = useCallback(async () => {
    isPlayingRef.current = false;
    setGameState("gameover");
    if (bgmRef.current) {
      bgmRef.current.pause();
    }

    const finalScore = scoreRef.current;
    const finalCombo = maxComboRef.current;
    const trackTitle = selectedTrack.name;

    // 1. 调用外部回调
    if (onScoreSave) {
      onScoreSave(finalScore, finalCombo, trackTitle);
    }

    // 2. 提交成绩至数据库 API
    if (currentUserInfo && (currentUserInfo.id || currentUserInfo.email)) {
      try {
        await fetch("/api/game/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUserInfo.id,
            userEmail: currentUserInfo.email,
            score: finalScore,
            maxCombo: finalCombo,
            trackName: trackTitle,
          }),
        });
      } catch (err) {
        console.error("Score auto-save failed:", err);
      }
    }

    // 3. 实时拉取最新排行榜
    fetchLeaderboard();
  }, [onScoreSave, currentUserInfo, selectedTrack, fetchLeaderboard]);

  // ── HTML5 Game Loop ──
  useEffect(() => {
    if (gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTimestamp = performance.now();

    const gameLoop = (now: number) => {
      const delta = (now - lastTimestamp) / 16.666;
      lastTimestamp = now;

      const width = canvas.width;
      const height = canvas.height;
      const hitLineY = height - HIT_LINE_OFFSET;
      const laneWidth = width / 3;

      ctx.clearRect(0, 0, width, height);

      // 1. 绘制 3 条极简轨道
      for (let i = 0; i < 3; i++) {
        const laneX = i * laneWidth;

        if (activeLanesPressRef.current[i]) {
          const pressGrad = ctx.createLinearGradient(0, height, 0, height - 180);
          pressGrad.addColorStop(0, "rgba(212, 175, 55, 0.28)");
          pressGrad.addColorStop(1, "rgba(212, 175, 55, 0)");
          ctx.fillStyle = pressGrad;
          ctx.fillRect(laneX, 0, laneWidth, height);
        }

        ctx.strokeStyle = "rgba(212, 175, 55, 0.12)";
        ctx.lineWidth = 1;
        if (i > 0) {
          ctx.beginPath();
          ctx.moveTo(laneX, 0);
          ctx.lineTo(laneX, height);
          ctx.stroke();
        }
      }

      // 2. 绘制金色判定线 (Hit Line)
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
      ctx.shadowBlur = 0;

      // 3. 定时依据曲目节奏 (BPM/Interval) 生成菩提光斑
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

      // 4. 更新与绘制下落音符
      const activeNotes: Note[] = [];
      const speed = gameSpeedRef.current * delta;

      for (const note of notesRef.current) {
        if (!note.hit) {
          note.y += speed;

          // 漏击判定
          if (note.y > hitLineY + GOOD_WINDOW && !note.missed) {
            note.missed = true;
            comboRef.current = 0;
            livesRef.current = Math.max(0, livesRef.current - 1);
            setDisplayCombo(0);
            setLives(livesRef.current);
            setHitFeedback({ text: "落 空 · MISS", color: "#94A3B8", key: Date.now() });

            if (livesRef.current <= 0) {
              handleGameOver();
              return;
            }
          }

          if (note.y < height + 40) {
            activeNotes.push(note);

            const centerX = note.lane * laneWidth + laneWidth / 2;
            const radius = 18;

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

  // 键盘监听
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

  // Canvas 尺寸响应
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

  // 启动游戏并注入选定曲目的动态节奏参数
  const startTrackGame = (track: BuddhistTrack) => {
    setSelectedTrack(track);
    initAudio();

    // 动态引擎挂载：注入选定曲目的专属速度与生成频率
    gameSpeedRef.current = track.fallSpeed;
    spawnIntervalRef.current = track.spawnInterval;

    if (bgmRef.current && !soundMuted) {
      bgmRef.current.currentTime = 0;
      bgmRef.current.play().catch(() => {});
    }

    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    livesRef.current = INITIAL_LIVES;
    notesRef.current = [];
    isPlayingRef.current = true;

    setDisplayScore(0);
    setDisplayCombo(0);
    setLives(INITIAL_LIVES);
    setHitFeedback(null);
    setGameState("playing");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#0a0d14] text-white select-none overflow-hidden font-sans">
      {/* 背景暗黑微光 */}
      <div className="absolute inset-0 bg-radial from-[#151d2f]/70 via-[#0a0d14] to-[#05070a] pointer-events-none" />

      {/* ── 顶部状态栏 (Top Bar) ── */}
      <div className="relative z-20 w-full max-w-2xl px-6 py-4 flex items-center justify-between border-b border-white/10 backdrop-blur-md">
        <div className="flex flex-col">
          <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-serif">
            {gameState === "playing" ? selectedTrack.name : "梵音木鱼音游"}
          </span>
          <span className="text-2xl font-black tracking-wider text-amber-300 font-mono">
            {displayScore.toLocaleString()}
          </span>
        </div>

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

        {/* 判定浮动反馈 */}
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

        {/* 反重力金色光尘粒子 */}
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

        {/* 底部 3 轨道触控/点击交互板 */}
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

      {/* ── 模块一：现代佛曲选择系统 (Track Selection Modal) ── */}
      <AnimatePresence>
        {gameState === "select" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-2xl p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.94, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-lg rounded-3xl border border-amber-400/30 bg-[#0e1322]/95 p-6 sm:p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,0.95)]"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-3xl">🪷</span>
              </div>
              <h2 className="text-xl font-bold font-serif text-amber-300 tracking-widest mt-1">
                梵音木鱼 · 现代佛曲修持
              </h2>
              <p className="text-xs text-stone-400 mt-1 mb-6 font-serif">
                请选择修持曲目，各曲目具备独特的节拍速度 (BPM) 与动态生成频率
              </p>

              {/* 3 首佛曲选择卡片 */}
              <div className="space-y-3 text-left">
                {BUDDHIST_TRACKS.map((track) => {
                  const isSelected = selectedTrack.id === track.id;
                  return (
                    <motion.div
                      key={track.id}
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => setSelectedTrack(track)}
                      className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-amber-500/15 border-amber-400 shadow-[0_0_20px_rgba(217,119,6,0.25)] ring-1 ring-amber-400/50"
                          : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                              isSelected
                                ? "bg-amber-400 text-stone-950 border-amber-300 font-bold"
                                : "bg-white/10 text-stone-300 border-white/10"
                            }`}
                          >
                            <Music2 className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-stone-100 font-serif">
                              {track.name}
                            </h3>
                            <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                              {track.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${track.badgeColor}`}
                          >
                            {track.difficulty}
                          </span>
                          <span className="text-[10px] text-amber-300/80 font-mono">
                            {track.bpm} BPM
                          </span>
                        </div>
                      </div>

                      <p className="mt-2.5 text-[11px] text-stone-400/90 leading-relaxed pl-1">
                        {track.description}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              {/* 启动按钮 */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => startTrackGame(selectedTrack)}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-bold font-serif tracking-widest text-sm shadow-[0_0_25px_rgba(217,119,6,0.5)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-stone-950" />
                  <span>开启修持 ({selectedTrack.difficulty.split(" · ")[0]})</span>
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-stone-300 font-serif text-xs tracking-wider transition-all"
                  >
                    返回
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 模块三：真实排行榜与止静结算 (Game Over & Leaderboard) ── */}
      <AnimatePresence>
        {gameState === "gameover" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
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
              <p className="text-[11px] text-stone-400 font-serif">
                修持曲目：<span className="text-amber-300 font-medium">{selectedTrack.name}</span>
              </p>

              {/* 本次修持成绩卡 */}
              <div className="my-5 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-around">
                <div>
                  <span className="block text-[10px] text-stone-400 font-serif">本次功德分</span>
                  <span className="text-2xl font-black font-mono text-amber-300">
                    {displayScore.toLocaleString()}
                  </span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <span className="block text-[10px] text-stone-400 font-serif">最高连击</span>
                  <span className="text-2xl font-black font-mono text-amber-300">
                    {maxComboRef.current}
                  </span>
                </div>
              </div>

              {/* 真实云端 Top 10 精进榜单 */}
              <div className="space-y-2 text-left mb-6">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    全社同修功德榜 (Top 10)
                  </span>
                  {loadingLeaderboard && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-300/80 animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      同步中…
                    </span>
                  )}
                </div>

                {loadingLeaderboard && leaderboard.length === 0 ? (
                  <div className="py-8 text-center text-xs text-stone-500 font-serif">
                    正在加载同修记录…
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="py-6 text-center text-xs text-stone-500 font-serif">
                    暂无修持战绩，您是第一位精进者！
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {leaderboard.map((item) => {
                      const isMe =
                        (currentUserInfo?.id && item.userId === currentUserInfo.id) ||
                        (currentUserInfo?.email && item.userEmail === currentUserInfo.email) ||
                        item.name.includes("(我)");

                      return (
                        <div
                          key={item.id || item.rank}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                            isMe
                              ? "bg-amber-500/25 border border-amber-400/60 text-amber-100 shadow-[0_0_12px_rgba(217,119,6,0.3)] ring-1 ring-amber-400/40"
                              : "bg-white/5 border border-white/5 text-stone-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono font-bold w-5 text-center text-amber-400 shrink-0">
                              {item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : item.rank}
                            </span>
                            <div className="min-w-0">
                              <span className="font-medium truncate block">
                                {item.name} {isMe && <span className="text-[10px] text-amber-300 font-bold">(我)</span>}
                              </span>
                              <span className="text-[9px] text-stone-400 font-serif block truncate">
                                [{item.title}] · {item.trackName || selectedTrack.name}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-amber-300 block">
                              {item.score.toLocaleString()}
                            </span>
                            <span className="text-[9px] text-stone-400 block font-mono">
                              Combo {item.maxCombo}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => startTrackGame(selectedTrack)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-bold font-serif text-xs tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  再次修持
                </button>

                <button
                  type="button"
                  onClick={() => setGameState("select")}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-amber-300 font-serif text-xs tracking-wider transition-all border border-amber-400/20 cursor-pointer"
                >
                  切换曲目
                </button>

                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-stone-400 font-serif text-xs transition-all"
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
