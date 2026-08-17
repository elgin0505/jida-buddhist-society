"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface DharmaWisdom {
  quote: string;
  source: string;
  meaning: string;
  practice: string;
}

const DHARMA_LIST: DharmaWisdom[] = [
  {
    quote: "随其心净，则佛土净。",
    source: "《维摩诘经》",
    meaning: "当内心保持清净无染，所见世间万物皆是清净庄严的净土。",
    practice: "今日修心：在繁忙中保持觉照，不随外界纷扰起心动念。",
  },
  {
    quote: "面对它、接受它、处理它、放下它。",
    source: "圣严法师",
    meaning: "遇到任何困境，不逃避、不怨尤，尽心处理后心无挂碍。",
    practice: "今日修心：遇到不如意时，深呼吸三次，坦然接纳并化解。",
  },
  {
    quote: "莫轻小善，以为无福；水滴虽微，渐盈大器。",
    source: "《法句经》",
    meaning: "不要轻视细小的善行，每一滴善念与善行汇聚，终成无量福德。",
    practice: "今日修心：随手助人、口出善言，积聚点滴功德。",
  },
  {
    quote: "当下是唯一的时刻；吸气我感到平静，呼气我微笑。",
    source: "一行禅师",
    meaning: "过去不可得，未来尚未到，唯有全然安住于当下的呼吸与觉知。",
    practice: "今日修心：行走坐卧间，常带微笑，专注当下的一举一动。",
  },
  {
    quote: "处事大度，受用一生；自得其乐，生活常青。",
    source: "弘一法师",
    meaning: "包容他人即是善待自己，内心常生欢喜，生活便处处清凉。",
    practice: "今日修心：宽恕一件让他人不快的小事，心宽天地宽。",
  },
  {
    quote: "若人欲了知，三世一切佛，应观法界性，一切唯心造。",
    source: "《华严经》",
    meaning: "世间一切境界与遭遇，皆由自心之所显现。心善则境善。",
    practice: "今日修心：常存感恩与慈悲之心，转变看待周围环境的角度。",
  },
  {
    quote: "菩提本自性，本来清净，但用此心，直了成佛。",
    source: "《六祖坛经》",
    meaning: "智慧与佛性本自具足在每个人心中，回归本真自性即可照破无明。",
    practice: "今日修心：静坐 5 分钟，观照内心的清明，不被烦恼遮蔽。",
  },
  {
    quote: "心好命又好，富贵直到老；命好心不好，福变为祸兆。",
    source: "星云大师",
    meaning: "命运的根本在于心地善良与行持，行善积德方为长久福报。",
    practice: "今日修心：多赞叹同修与朋友的长处，广结善缘。",
  },
  {
    quote: "忍是无价宝，人人使不好；若能会用它，万事都能好。",
    source: "宣化上人",
    meaning: "忍辱是成就有德之人的基石，遇挫能忍，方能成就大智慧。",
    practice: "今日修心：遇言语冲突时，忍默片刻，以柔克刚。",
  },
  {
    quote: "若能放下执着，处处皆是清凉净土。",
    source: "虚云老和尚",
    meaning: "痛苦源于攀缘与执念，放下对外物的执求，便得大自在。",
    practice: "今日修心：梳理一件萦绕心头的琐事，释怀放下。",
  },
];

export function DailyDharmaCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentDharma, setCurrentDharma] = useState<DharmaWisdom>(DHARMA_LIST[0]);
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // 初始化：每天根据日期获取固定法语，也可手动重新求取
  useEffect(() => {
    const todayStr = new Date().toDateString();
    const savedDate = localStorage.getItem("jbs_dharma_date");
    const savedIndex = localStorage.getItem("jbs_dharma_index");
    const savedFlipped = localStorage.getItem("jbs_dharma_flipped");

    if (savedDate === todayStr && savedIndex !== null) {
      const idx = parseInt(savedIndex, 10);
      setCurrentDharma(DHARMA_LIST[idx % DHARMA_LIST.length]);
      if (savedFlipped === "true") {
        setIsFlipped(true);
      }
    } else {
      // 当天第一次：根据日期哈希分配
      const hash = todayStr.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const idx = hash % DHARMA_LIST.length;
      setCurrentDharma(DHARMA_LIST[idx]);
    }
  }, []);

  // Web Audio API 播放清脆的磬声 (Tibetan Bell Sound)
  const playBellSound = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 1.8);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 2.2);
    } catch {}
  };

  const handleDraw = () => {
    playBellSound();
    setIsFlipped(true);
    const todayStr = new Date().toDateString();
    const idx = DHARMA_LIST.findIndex((d) => d.quote === currentDharma.quote);
    localStorage.setItem("jbs_dharma_date", todayStr);
    localStorage.setItem("jbs_dharma_index", String(idx >= 0 ? idx : 0));
    localStorage.setItem("jbs_dharma_flipped", "true");
  };

  const handleRedraw = (e: React.MouseEvent) => {
    e.stopPropagation();
    playBellSound();
    let nextIdx = Math.floor(Math.random() * DHARMA_LIST.length);
    if (DHARMA_LIST[nextIdx].quote === currentDharma.quote) {
      nextIdx = (nextIdx + 1) % DHARMA_LIST.length;
    }
    const newDharma = DHARMA_LIST[nextIdx];
    setCurrentDharma(newDharma);
    setIsFlipped(false);
    setTimeout(() => {
      setIsFlipped(true);
      const todayStr = new Date().toDateString();
      localStorage.setItem("jbs_dharma_date", todayStr);
      localStorage.setItem("jbs_dharma_index", String(nextIdx));
      localStorage.setItem("jbs_dharma_flipped", "true");
    }, 280);
  };

  // 绘制精美竖版微信/WhatsApp海报
  const generatePoster = () => {
    setGenerating(true);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 竖版 9:16 高清海报尺寸 (1080 x 1920)
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    // 1. 禅意水墨宣纸渐变背景
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "#faf6ed");
    grad.addColorStop(0.3, "#f4ece0");
    grad.addColorStop(0.7, "#efe4d2");
    grad.addColorStop(1, "#e6d7bf");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. 双重古典金箔装饰框
    ctx.strokeStyle = "#c9a227";
    ctx.lineWidth = 8;
    ctx.strokeRect(50, 50, width - 100, height - 100);

    ctx.strokeStyle = "rgba(201, 162, 39, 0.4)";
    ctx.lineWidth = 3;
    ctx.strokeRect(66, 66, width - 132, height - 132);

    // 3. 顶部佛学会题头
    ctx.fillStyle = "#854d0e";
    ctx.font = "bold 44px -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("马 来 西 亚 技 术 大 学 佛 学 会", width / 2, 170);

    ctx.fillStyle = "#b8860b";
    ctx.font = "600 28px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("· 每 日 菩 提 法 语 ·", width / 2, 225);

    // 分割金线
    ctx.strokeStyle = "rgba(184, 134, 11, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 180, 265);
    ctx.lineTo(width / 2 + 180, 265);
    ctx.stroke();

    // 4. 日期标注
    const dateObj = new Date();
    const dateStr = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
    ctx.fillStyle = "#78350f";
    ctx.font = "24px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(dateStr, width / 2, 315);

    // 5. 核心法语名句（支持自动换行，典雅书法排版）
    ctx.fillStyle = "#1c1917";
    ctx.font = "bold 56px 'Songti SC', 'SimSun', serif, -apple-system";

    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split("");
      let line = "";
      let currentY = y;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = words[n];
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
      return currentY;
    };

    const quoteY = 560;
    const endY = wrapText(`“${currentDharma.quote}”`, width / 2, quoteY, width - 260, 90);

    // 出处
    ctx.fillStyle = "#b8860b";
    ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(`—— ${currentDharma.source}`, width / 2, endY + 80);

    // 6. 白话浅释卡片框
    const cardY = endY + 160;
    const cardHeight = 420;
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.beginPath();
    ctx.roundRect(120, cardY, width - 240, cardHeight, 32);
    ctx.fill();
    ctx.strokeStyle = "rgba(201, 162, 39, 0.3)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#44403c";
    ctx.font = "bold 30px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("【 智 慧 浅 释 】", width / 2, cardY + 70);

    ctx.fillStyle = "#57534e";
    ctx.font = "30px -apple-system, BlinkMacSystemFont, sans-serif";
    const meaningEndY = wrapText(currentDharma.meaning, width / 2, cardY + 135, width - 340, 52);

    ctx.fillStyle = "#2d6a4f";
    ctx.font = "bold 28px -apple-system, BlinkMacSystemFont, sans-serif";
    wrapText(currentDharma.practice, width / 2, meaningEndY + 70, width - 340, 48);

    // 7. 底部朱红吉祥印章与结语
    const sealX = width / 2 - 70;
    const sealY = height - 250;
    ctx.fillStyle = "#b91c1c";
    ctx.beginPath();
    ctx.roundRect(sealX, sealY, 140, 140, 20);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px 'Songti SC', serif";
    ctx.fillText("福慧", width / 2, sealY + 55);
    ctx.fillText("双修", width / 2, sealY + 105);

    ctx.fillStyle = "#854d0e";
    ctx.font = "bold 24px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("常随佛学 · 广结善缘 · 技大佛学会 共勉", width / 2, height - 70);

    const dataUrl = canvas.toDataURL("image/png");
    setPosterUrl(dataUrl);
    setGenerating(false);
    setShowPosterModal(true);
  };

  return (
    <>
      <div className="relative mb-8">
        {/* 卡片 3D 翻转外壳 */}
        <div style={{ perspective: 1200 }} className="w-full">
          <motion.div
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
            style={{ transformStyle: "preserve-3d" }}
            className="relative min-h-[260px] w-full rounded-3xl cursor-pointer select-none"
            onClick={!isFlipped ? handleDraw : undefined}
          >
            {/* ── 签牌背面（未求签状态） ── */}
            <div
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-golden-deep/40 bg-gradient-to-br from-warm-white via-ocher-light/30 to-golden-deep/20 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900/60 p-6 shadow-lg backdrop-blur-xl text-center overflow-hidden"
            >
              {/* 祥云曼陀罗底纹 */}
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-48 w-48 opacity-10">
                <svg viewBox="0 0 100 100" fill="#c9a227">
                  <circle cx="50" cy="50" r="40" />
                </svg>
              </div>

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-golden-deep/15 text-golden-rich shadow-inner animate-bounce">
                <span className="text-3xl">🪷</span>
              </div>

              <h4 className="mt-4 text-xl font-bold tracking-tight text-charcoal dark:text-white">
                每日菩提法语 · 静心求签
              </h4>
              <p className="mt-1.5 text-xs text-muted max-w-sm">
                心若澄澈，万物皆空。点击下方签牌，求取今日佛法智慧启示与修行指引。
              </p>

              <button
                onClick={handleDraw}
                className="mt-5 flex items-center gap-2 rounded-xl bg-golden-deep px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-golden-rich hover:scale-105 active:scale-95"
              >
                <span>✨</span>
                祈请今日法语
              </button>
            </div>

            {/* ── 签牌正面（已揭晓法语） ── */}
            <div
              style={{
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
              className="relative flex flex-col justify-between rounded-3xl border-2 border-golden-deep/40 bg-gradient-to-br from-warm-white/95 via-warm-cream/90 to-ocher-light/40 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-900/80 p-6 sm:p-7 shadow-[0_16px_40px_-8px_rgba(201,162,39,0.25)] dark:shadow-none backdrop-blur-2xl"
            >
              <div>
                {/* 顶栏信息 */}
                <div className="flex items-center justify-between border-b border-ocher/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📜</span>
                    <span className="text-xs font-bold text-golden-rich">今日菩提法语</span>
                  </div>
                  <span className="rounded-full bg-golden-deep/15 px-2.5 py-0.5 text-[11px] font-bold text-golden-rich">
                    {currentDharma.source}
                  </span>
                </div>

                {/* 法语名句 */}
                <div className="my-5 text-center px-2">
                  <p className="text-xl sm:text-2xl font-bold tracking-wide text-charcoal dark:text-white font-serif">
                    “{currentDharma.quote}”
                  </p>
                </div>

                {/* 智慧浅释与今日修心 */}
                <div className="space-y-2 rounded-2xl bg-white/70 dark:bg-slate-700/50 p-4 shadow-sm border border-ocher/15 dark:border-white/10 text-xs">
                  <p className="text-charcoal/80 dark:text-slate-200 leading-relaxed">
                    <span className="font-bold text-golden-rich">【浅释】</span> {currentDharma.meaning}
                  </p>
                  <p className="text-jade font-medium leading-relaxed">
                    <span className="font-bold">【行持】</span> {currentDharma.practice}
                  </p>
                </div>
              </div>

              {/* 底部操作：重新求签 & 生成海报 */}
              <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-ocher/15">
                <button
                  onClick={handleRedraw}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-muted hover:bg-ocher-light/30 hover:text-charcoal transition-all"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l5.67-5.67" />
                  </svg>
                  再求一签
                </button>

                <button
                  onClick={generatePoster}
                  disabled={generating}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-golden-deep to-golden-rich px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                >
                  <span>🖼️</span>
                  {generating ? "绘制中..." : "生成朋友圈海报"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 海报预览与下载弹窗 */}
      <AnimatePresence>
        {showPosterModal && posterUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPosterModal(false)}
              className="absolute inset-0 bg-charcoal/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-white/80 dark:border-white/10 bg-warm-white/95 dark:bg-slate-800 p-6 shadow-2xl backdrop-blur-2xl text-center"
            >
              <div className="flex items-center justify-between border-b border-ocher/20 pb-3 mb-4">
                <h4 className="text-sm font-bold text-charcoal">今日法语海报生成完毕</h4>
                <button
                  onClick={() => setShowPosterModal(false)}
                  className="rounded-lg p-1 text-muted hover:bg-ocher-light/30 hover:text-charcoal"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 海报缩略图展示 */}
              <div className="overflow-hidden rounded-2xl border-2 border-golden-deep/30 shadow-md max-h-[420px]">
                <img
                  src={posterUrl}
                  alt="今日法语海报"
                  className="h-full w-full object-cover"
                />
              </div>

              <p className="mt-3 text-[11px] text-muted">
                长按图片或点击下方按钮保存，发至微信朋友圈 / WhatsApp 广结善缘
              </p>

              <div className="mt-4 flex gap-2.5">
                <a
                  href={posterUrl}
                  download={`技大佛学会_每日法语_${new Date().toISOString().slice(0, 10)}.png`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-golden-deep py-3 text-xs font-bold text-white shadow-md hover:bg-golden-rich active:scale-95 transition-all"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  保存高清海报
                </a>
                <button
                  onClick={() => setShowPosterModal(false)}
                  className="rounded-xl border border-ocher/30 px-4 py-3 text-xs font-semibold text-charcoal hover:bg-ocher-light/20"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
