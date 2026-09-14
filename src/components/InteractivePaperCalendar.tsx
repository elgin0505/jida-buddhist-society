'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  type Variants,
} from 'framer-motion';
import { Calendar, Clock, MapPin, Sparkles, ChevronLeft, ChevronRight, X, ExternalLink, Download } from 'lucide-react';

/* ══════════════════════════════════════════════════
   类型定义
══════════════════════════════════════════════════ */
export interface CalendarEvent {
  id: string;
  date: string;          // 'YYYY-MM-DD'
  title: string;
  subtitle?: string;
  time: string;
  location: string;
  points: number;
  description: string;
  accent?: string;       // 印章色，默认朱砂红
  rawDateTime?: string;
  status?: 'upcoming' | 'past';
}

/* ══════════════════════════════════════════════════
   官方唯一活动数据源（严格与 Google 表格 gid=1001 绑定）
   仅包含：迎新会 与 欢乐营
══════════════════════════════════════════════════ */
export const DEFAULT_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'cmt5wz1gl0000lc04ygrkp7zf',
    date: '2026-10-09',
    title: '迎新会',
    subtitle: 'Orientation Day · 菩提新芽',
    time: '18:00',
    location: 'Cafe 3',
    points: 5,
    description:
      '为协助新学子顺遂开启大学生涯，佛学会特别举办迎新会，旨在通过温馨破冰协助新学员打破陌生感、认识理事。',
    accent: '#B03A2E',
    status: 'upcoming',
  },
  {
    id: 'cmtq3nu5e0000ky04aaegr3kq',
    date: '2026-11-20',
    title: '欢乐营',
    subtitle: 'Dhamma Joy Camp · 乐满人间',
    time: '08:00',
    location: '待定',
    points: 5,
    description:
      '一整天的户外团康拓展与青年佛法体验。透过团队协作与欢乐互动，增进同修情谊与正向能量。',
    accent: '#8A6B2E',
    status: 'upcoming',
  },
];

/* ══════════════════════════════════════════════════
   工具常量 & 函数
══════════════════════════════════════════════════ */
const MONTH_CN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const MONTH_EN = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

const WEEKDAY_CN = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAY_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

function toKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

interface DayCell {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
  event: CalendarEvent | null;
}

function buildMonthMatrix(year: number, month: number, eventMap: Map<string, CalendarEvent>): DayCell[] {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const startDate = new Date(year, month, 1 - startWeekday);
  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const key = toKey(d.getFullYear(), d.getMonth(), d.getDate());
    cells.push({
      date: d,
      key,
      inMonth: d.getMonth() === month,
      isToday: key === todayKey,
      event: eventMap.get(key) ?? null,
    });
  }
  return cells;
}

/* ══════════════════════════════════════════════════
   纸张噪点纹理
══════════════════════════════════════════════════ */
function PaperNoiseDefs({ id }: { id: string }) {
  return (
    <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden>
      <defs>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.05" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   图二风格：东方禅意壁纸插画艺术背景 (Illustrative Zen Wallpaper)
══════════════════════════════════════════════════ */
function ZenCalendarWallpaperArt() {
  return (
    <svg
      viewBox="0 0 860 680"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute inset-0 h-full w-full select-none"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="sun-zen-glow" cx="80%" cy="18%" r="42%">
          <stop offset="0%" stopColor="#F9D48B" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#E5A65D" stopOpacity="0.5" />
          <stop offset="70%" stopColor="#C87A38" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FAF7F2" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="wave-gold-grad" x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#D8A856" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#C48E38" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#A06A26" stopOpacity="0.3" />
        </linearGradient>

        <linearGradient id="wave-amber-grad" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E2B478" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#C68943" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8C5222" stopOpacity="0.2" />
        </linearGradient>

        <linearGradient id="wave-red-grad" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#B03A2E" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#9C2D22" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#78231A" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      {/* ① 右上旭日朝阳与金辉光晕 */}
      <circle cx="690" cy="115" r="160" fill="url(#sun-zen-glow)" />
      <circle cx="690" cy="115" r="54" fill="#FCE1A8" fillOpacity="0.9" />
      <circle cx="690" cy="115" r="38" fill="#FDF3CE" fillOpacity="0.95" />

      {/* 旭日光芒散射线 */}
      <g stroke="#D49A4B" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 6">
        <line x1="690" y1="115" x2="690" y2="2" />
        <line x1="690" y1="115" x2="795" y2="40" />
        <line x1="690" y1="115" x2="840" y2="115" />
        <line x1="690" y1="115" x2="800" y2="195" />
        <line x1="690" y1="115" x2="690" y2="235" />
        <line x1="690" y1="115" x2="575" y2="190" />
        <line x1="690" y1="115" x2="550" y2="115" />
        <line x1="690" y1="115" x2="585" y2="40" />
      </g>

      {/* ② 水墨飞鸟 / 仙鹤剪影 */}
      <g fill="#4A3B32" fillOpacity="0.75">
        <path d="M 520 80 Q 528 72 536 78 Q 544 72 552 80 Q 540 85 520 80 Z" />
        <path d="M 480 110 Q 486 104 492 109 Q 498 104 504 110 Q 495 114 480 110 Z" transform="scale(0.85) translate(80, 20)" />
        <path d="M 580 60 Q 587 53 594 58 Q 601 53 608 60 Q 597 64 580 60 Z" transform="scale(0.7) translate(250, 25)" />
        <path d="M 610 95 Q 616 90 622 94 Q 628 90 634 95 Q 625 98 610 95 Z" transform="scale(0.6) translate(410, 60)" />
      </g>

      {/* ③ 右侧水墨修竹 (竹节与竹叶层次) */}
      <g stroke="#3E5A44" strokeWidth="4.5" strokeLinecap="round" opacity="0.6">
        <line x1="720" y1="360" x2="725" y2="280" />
        <line x1="726" y1="275" x2="732" y2="190" />
        <line x1="733" y1="185" x2="738" y2="110" />
      </g>
      <g stroke="#354D3A" strokeWidth="3.5" strokeLinecap="round" opacity="0.45">
        <line x1="755" y1="380" x2="760" y2="310" />
        <line x1="761" y1="305" x2="768" y2="230" />
        <line x1="769" y1="225" x2="774" y2="160" />
      </g>

      {/* 竹节横环 */}
      <g stroke="#2C4030" strokeWidth="2.5" strokeLinecap="round" opacity="0.7">
        <line x1="723" y1="277" x2="729" y2="278" />
        <line x1="730" y1="187" x2="736" y2="188" />
        <line x1="758" y1="307" x2="764" y2="308" />
        <line x1="766" y1="227" x2="772" y2="228" />
      </g>

      {/* 竹叶形态 */}
      <g fill="#3E5A44" fillOpacity="0.6">
        <path d="M 726 276 C 710 265 678 266 655 272 C 674 278 705 281 726 276 Z" />
        <path d="M 728 274 C 716 250 690 236 668 232 C 682 248 708 262 728 274 Z" />
        <path d="M 733 186 C 750 170 782 165 808 166 C 786 177 756 186 733 186 Z" />
        <path d="M 732 188 C 715 178 692 176 672 180 C 690 187 714 192 732 188 Z" />
        <path d="M 738 112 C 722 96 698 90 676 92 C 696 102 720 110 738 112 Z" />
        <path d="M 770 226 C 788 214 818 212 840 216 C 818 226 792 230 770 226 Z" />
        <path d="M 774 162 C 756 148 732 144 710 148 C 730 156 754 164 774 162 Z" />
      </g>

      {/* ④ 远黛禅山轮廓 */}
      <path
        d="M 380 520 Q 480 430 580 470 T 780 440 L 860 480 L 860 680 L 380 680 Z"
        fill="#A6947D"
        fillOpacity="0.12"
      />
      <path
        d="M 520 540 Q 620 460 720 500 T 860 470 L 860 680 L 520 680 Z"
        fill="#8A7A5E"
        fillOpacity="0.1"
      />

      {/* ⑤ 底部层叠流淌的金色与朱红水墨波纹丝带 */}
      <path
        d="M 0 540 Q 220 500 450 560 T 860 520 L 860 680 L 0 680 Z"
        fill="url(#wave-gold-grad)"
      />
      <path
        d="M 0 585 Q 260 535 520 610 T 860 570 L 860 680 L 0 680 Z"
        fill="url(#wave-amber-grad)"
      />
      <path
        d="M 0 625 Q 310 580 600 645 T 860 620 L 860 680 L 0 680 Z"
        fill="url(#wave-red-grad)"
      />
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   朱砂毛笔墨圈标 (Brush Highlight Circle)
══════════════════════════════════════════════════ */
function BrushCircle({
  accent = '#B03A2E',
  isTarget = false,
  controls,
}: {
  accent?: string;
  isTarget?: boolean;
  controls?: any;
}) {
  return (
    <svg
      viewBox="0 0 54 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute -inset-1 h-[calc(100%+8px)] w-[calc(100%+8px)] -translate-x-1 -translate-y-1"
    >
      <defs>
        <filter id="brush-paper-bleed" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" />
        </filter>
      </defs>

      {/* 底层柔和晕染墨色 */}
      <ellipse
        cx="27"
        cy="27"
        rx="22"
        ry="21"
        fill={accent}
        fillOpacity="0.1"
      />

      {/* 毛笔朱砂主笔锋 */}
      <motion.path
        d="M 28 6 C 41 5, 50 16, 48 28 C 46 41, 36 49, 23 48 C 11 47, 4 36, 6 24 C 8 12, 19 4, 32 6 C 39 7, 46 13, 47 20"
        stroke={accent}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.88"
        fill="none"
        filter="url(#brush-paper-bleed)"
        animate={isTarget && controls ? controls : { pathLength: 1, opacity: 0.95 }}
        initial={isTarget ? { pathLength: 0, opacity: 0 } : false}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/* ══════════════════════════════════════════════════
   单日期格子组件
══════════════════════════════════════════════════ */
interface DayCellProps {
  cell: DayCell;
  isBrushTarget: boolean;
  brushControls: any;
  onSelect: (cell: DayCell) => void;
}

const DayCellView = React.memo(function DayCellView({
  cell,
  isBrushTarget,
  brushControls,
  onSelect,
}: DayCellProps) {
  const { date, inMonth, isToday, event } = cell;
  const dayNum = date.getDate();
  const hasEvent = Boolean(event);

  return (
    <button
      type="button"
      onClick={() => onSelect(cell)}
      disabled={!inMonth || !hasEvent}
      aria-label={`${date.getFullYear()}年${date.getMonth() + 1}月${dayNum}日 ${hasEvent ? event?.title : ''}`}
      className={`group relative flex h-full min-h-[38px] md:min-h-[46px] w-full flex-col items-center justify-center rounded-xl p-0.5 text-center transition-all duration-200 outline-none
        ${!inMonth ? 'opacity-25 pointer-events-none' : ''}
        ${hasEvent ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'}
      `}
    >
      <div className="relative flex h-8 w-8 md:h-10 md:w-10 items-center justify-center">
        {/* 有活动时绘制朱砂红圈 */}
        {hasEvent && (
          <BrushCircle
            accent={event?.accent || '#B03A2E'}
            isTarget={isBrushTarget}
            controls={brushControls}
          />
        )}

        {/* 日期数字 */}
        <span
          className={`relative z-10 text-sm md:text-base font-semibold tabular-nums tracking-tight transition-colors
            ${hasEvent ? 'text-[#B03A2E] font-bold font-serif scale-105' : 'text-[#3E342B]'}
            ${isToday && !hasEvent ? 'font-bold text-[#8A6B2E] underline underline-offset-4' : ''}
          `}
          style={{ fontFamily: 'Georgia, "Songti SC", serif' }}
        >
          {dayNum}
        </span>
      </div>

      {/* 活动小标提示 */}
      {hasEvent && (
        <span className="relative z-10 mt-0.5 line-clamp-1 max-w-[90%] text-[9px] font-medium text-[#B03A2E]/90 leading-tight">
          {event?.title}
        </span>
      )}
    </button>
  );
});

/* ══════════════════════════════════════════════════
   3D 纸张翻页与划动特效 (3D Paper Flip Variants)
══════════════════════════════════════════════════ */
export const MONTH_3D_FLIP_VARIANTS: Variants = {
  initial: (dir: number) => ({
    rotateX: dir > 0 ? -75 : 80,
    y: dir > 0 ? 25 : -25,
    scale: 0.96,
    opacity: 0,
    transformOrigin: 'top center',
  }),
  animate: {
    rotateX: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    transformOrigin: 'top center',
    transition: {
      rotateX: { type: 'spring', stiffness: 100, damping: 15, mass: 0.8 },
      y: { type: 'spring', stiffness: 100, damping: 15, mass: 0.8 },
      scale: { type: 'spring', stiffness: 120, damping: 18 },
      opacity: { duration: 0.2 },
    },
  },
  exit: (dir: number) => ({
    rotateX: dir > 0 ? 80 : -75,
    y: dir > 0 ? -30 : 25,
    scale: 0.95,
    opacity: 0,
    transformOrigin: 'top center',
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

/* ══════════════════════════════════════════════════
   纸张撕开划走变体 (过渡至详情页)
══════════════════════════════════════════════════ */
const PAPER_VARIANTS: Variants = {
  exit: {
    clipPath: [
      'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      'polygon(0% 0%, 60% 0%, 40% 100%, 0% 100%)',
      'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
    ],
    x: [0, -40, -120],
    opacity: [1, 0.9, 0],
    transition: {
      duration: 0.72,
      ease: [0.65, 0, 0.35, 1],
      times: [0, 0.55, 1],
    },
  },
  enter: {
    clipPath: [
      'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
      'polygon(40% 0%, 100% 0%, 100% 100%, 55% 100%)',
      'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    ],
    x: [120, 30, 0],
    opacity: [0, 0.9, 1],
    transition: {
      duration: 0.78,
      ease: [0.22, 1, 0.36, 1],
      times: [0, 0.6, 1],
      delay: 0.22,
    },
  },
  exitDetail: {
    clipPath: [
      'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
      'polygon(60% 0%, 100% 0%, 100% 100%, 40% 100%)',
      'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)',
    ],
    x: [0, 60, 140],
    opacity: [1, 0.7, 0],
    transition: {
      duration: 0.55,
      ease: [0.65, 0, 0.35, 1],
    },
  },
  returnPaper: {
    clipPath: [
      'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
      'polygon(0% 0%, 70% 0%, 50% 100%, 0% 100%)',
      'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    ],
    x: [-120, -30, 0],
    opacity: [0, 0.85, 1],
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      times: [0, 0.55, 1],
      delay: 0.18,
    },
  },
};

/* ══════════════════════════════════════════════════
   主组件: InteractivePaperCalendar
══════════════════════════════════════════════════ */
interface Props {
  events?: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
  className?: string;
}

export function InteractivePaperCalendar({
  events = DEFAULT_CALENDAR_EVENTS,
  onSelectEvent,
  className = '',
}: Props) {
  // 仅映射传入的活动数据（严格展示 Google Sheet 同步活动）
  const displayEvents = useMemo(() => {
    return events.filter((e) => (e.status ? e.status === 'upcoming' : true));
  }, [events]);

  // 建立日期哈希映射
  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent>();
    displayEvents.forEach((ev) => {
      map.set(ev.date, ev);
    });
    return map;
  }, [displayEvents]);

  // 当前月光标状态（默认为 2026年10月）
  const [cursor, setCursor] = useState(() => ({
    year: 2026,
    month: 9, // 0-indexed: 9 表示 10月
  }));

  // 翻页方向（1 为下一月，-1 为上一月）
  const [direction, setDirection] = useState<number>(1);

  // 选中的活动日期与动画状态
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [brushTarget, setBrushTarget] = useState<string | null>(null);
  const [isTearing, setIsTearing] = useState(false);

  // 毛笔动画控制器
  const brushControls = useAnimationControls();

  // 当前月的 42 个格子数据
  const cells = useMemo(
    () => buildMonthMatrix(cursor.year, cursor.month, eventMap),
    [cursor.year, cursor.month, eventMap]
  );

  /* ── 点击活动日期交互流程 ── */
  const handleDayClick = useCallback(
    async (cell: DayCell) => {
      if (!cell.event || isTearing) return;

      onSelectEvent?.(cell.event);

      // ① 毛笔画圈动画
      setBrushTarget(cell.key);
      brushControls.set({ pathLength: 0, opacity: 0 });
      await brushControls.start({
        pathLength: 1,
        opacity: 0.95,
        transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
      });

      // ② 触发撕纸过渡
      setIsTearing(true);
      setTimeout(() => setSelectedDate(cell.key), 120);
      setTimeout(() => {
        setIsTearing(false);
        setBrushTarget(null);
      }, 1000);
    },
    [brushControls, isTearing, onSelectEvent]
  );

  /* ── 关闭详情返回日历 ── */
  const handleClose = useCallback(() => {
    setSelectedDate(null);
  }, []);

  /* ── 模块二：带方向的月份切换 ── */
  const shiftMonth = useCallback((delta: 1 | -1) => {
    setDirection(delta);
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }, []);

  const selectedEvent = selectedDate ? eventMap.get(selectedDate) ?? null : null;
  const noiseId = 'paper-noise-zen-filter';

  return (
    <section className={`relative w-full py-6 md:py-10 ${className}`}>
      <PaperNoiseDefs id={noiseId} />

      <div className="mx-auto max-w-5xl px-3 sm:px-6">
        {/* 顶部禅意小标与主副标题 */}
        <div className="mb-6 text-center md:mb-8">
          <p className="text-[10px] uppercase tracking-[0.5em] text-golden-rich md:text-xs font-medium">
            Zen Calendar · 岁月静好 · 赴一场约
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-charcoal dark:text-warm-white md:text-4xl font-serif">
            翻开一页，与善友相会
          </h2>
          <p className="mt-2 text-xs text-muted leading-relaxed md:text-sm">
            点击日历上有毛笔红圈标记的吉日，细阅佛学会活动与功德详情
          </p>
        </div>

        {/* ═══════ 舞台：日历 & 详情叠放于高拟真宣纸画卷上 ═══════ */}
        <div
          className="relative mx-auto aspect-[4/5] w-full max-w-[640px]
                     overflow-hidden rounded-3xl
                     shadow-[0_25px_70px_-20px_rgba(40,30,20,0.35),0_10px_25px_-10px_rgba(0,0,0,0.15)]
                     border border-[#8A7A5E]/20
                     md:aspect-[16/11] md:max-w-[880px]"
          style={{ perspective: 1200 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {!selectedEvent ? (
              /* ════════════════════════════════════
                 日历纸页外层 (融入图二壁纸构图与活页结构)
              ════════════════════════════════════ */
              <motion.div
                key="calendar-page-frame"
                variants={PAPER_VARIANTS}
                initial={false}
                animate={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', x: 0, opacity: 1 }}
                exit="exit"
                transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
                className="absolute inset-0 will-change-transform overflow-hidden flex flex-col select-none"
                style={{
                  background:
                    'radial-gradient(130% 130% at 25% 10%, #FDFBF5 0%, #F5EFE1 50%, #EADBBE 100%)',
                  perspective: 1200,
                }}
              >
                {/* 纸张噪点纤维 */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-[0.52] mix-blend-multiply z-1"
                  style={{ filter: `url(#${noiseId})` }}
                />

                {/* 顶部活页装订梁与固定翻月操作栏 */}
                <div className="relative z-30 flex items-center justify-between px-5 pt-3 pb-2 md:px-8 md:pt-4 border-b border-[#8A7A5E]/15 bg-gradient-to-b from-[#EDE2CD]/60 to-transparent">
                  {/* 活页装订打孔金属扣环 */}
                  <div className="flex items-center gap-2.5 md:gap-3.5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <span className="h-2 w-2 rounded-full bg-[#3D2E1E] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6),0_1px_2px_rgba(255,255,255,0.4)] ring-1 ring-[#c9bda4]" />
                        <span className="h-1.5 w-0.5 bg-gradient-to-b from-[#8A7A5E] to-[#5A4A38]" />
                      </div>
                    ))}
                  </div>

                  {/* 翻月操作按钮 (常驻顶部，触控稳定) */}
                  <div className="flex items-center gap-1.5 bg-[#FBF6EA]/85 backdrop-blur-xs px-2 py-0.5 rounded-full border border-[#8A7A5E]/20 shadow-xs">
                    <PaperNavBtn onClick={() => shiftMonth(-1)} label="上个月">
                      <ChevronLeft className="h-4 w-4" />
                    </PaperNavBtn>
                    <span className="px-2 text-xs font-bold text-[#5A4A38] tabular-nums font-serif">
                      {cursor.year} · {pad2(cursor.month + 1)}月
                    </span>
                    <PaperNavBtn onClick={() => shiftMonth(1)} label="下个月">
                      <ChevronRight className="h-4 w-4" />
                    </PaperNavBtn>
                  </div>
                </div>

                {/* ═══════ 3D 纸张翻页与光影舞台 ═══════ */}
                <div
                  className="relative flex-1 w-full h-full overflow-hidden"
                  style={{
                    perspective: 1200,
                    perspectiveOrigin: '50% 0%',
                  }}
                >
                  {/* 纸底阴影 */}
                  <motion.div
                    aria-hidden
                    key={`shadow-${cursor.year}-${cursor.month}`}
                    className="pointer-events-none absolute inset-x-8 bottom-1 h-8 rounded-full z-0"
                    initial={{ opacity: 0.1, scaleY: 0.4 }}
                    animate={{ opacity: 0.35, scaleY: 1 }}
                    exit={{ opacity: 0.05, scaleY: 0.3 }}
                    transition={{ duration: 0.4 }}
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(45,30,15,0.4) 0%, transparent 72%)',
                    }}
                  />

                  <AnimatePresence mode="popLayout" custom={direction} initial={false}>
                    <motion.div
                      key={`${cursor.year}-${cursor.month}`}
                      custom={direction}
                      variants={MONTH_3D_FLIP_VARIANTS}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      style={{
                        transformOrigin: 'top center',
                        transformStyle: 'preserve-3d',
                        backfaceVisibility: 'hidden',
                      }}
                      className="absolute inset-0 flex flex-col pl-6 pr-4 pt-2.5 pb-3 md:pl-12 md:pr-10 md:pt-3.5 md:pb-5 will-change-transform"
                    >
                      {/* 图二风格：东方禅意壁纸插画艺术水墨背景 (随纸张一同 3D 翻转) */}
                      <ZenCalendarWallpaperArt />

                      {/* 纸面高光与漫反射遮罩 */}
                      <motion.div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 z-20 mix-blend-multiply"
                        initial={{ opacity: 0.4 }}
                        animate={{ opacity: 0 }}
                        exit={{ opacity: 0.6 }}
                        transition={{ duration: 0.38, ease: 'easeOut' }}
                        style={{
                          background:
                            direction > 0
                              ? 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(210,190,160,0.1) 40%, rgba(55,35,15,0.35) 100%)'
                              : 'linear-gradient(0deg, rgba(255,255,255,0.4) 0%, rgba(210,190,160,0.1) 40%, rgba(55,35,15,0.35) 100%)',
                        }}
                      />

                      {/* ── 顶部：图二风格年份书法 + 英文花体月 ── */}
                      <div className="relative z-10 flex items-start justify-between">
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-2.5">
                            <span
                              className="text-4xl md:text-6xl font-bold tracking-tight text-[#2B241C]"
                              style={{ fontFamily: 'Georgia, "Songti SC", serif', letterSpacing: '-0.03em' }}
                            >
                              {cursor.year}
                            </span>
                            <span
                              className="text-2xl md:text-4xl font-normal italic text-[#B03A2E]"
                              style={{ fontFamily: '"Brush Script MT", "Caveat", "Playfair Display", Georgia, cursive' }}
                            >
                              {MONTH_EN[cursor.month]}
                            </span>
                            <span className="inline-block ml-1 rounded-full bg-[#B03A2E]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#B03A2E]">
                              {MONTH_CN[cursor.month]}月
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] tracking-[0.25em] text-[#8A7A5E] font-serif">
                            技大佛学会 · 岁在丙午
                          </p>
                        </div>
                      </div>

                      {/* 雅致分割线 */}
                      <div
                        aria-hidden
                        className="relative z-10 mt-2.5 md:mt-3 h-px w-full"
                        style={{
                          background:
                            'linear-gradient(90deg, rgba(176,58,46,0.5) 0%, rgba(138,122,94,0.3) 25%, rgba(138,122,94,0.15) 85%, transparent)',
                        }}
                      />

                      {/* ── 星期表头 (中英双行，图二设计精髓) ── */}
                      <div className="relative z-10 mt-2.5 grid grid-cols-7 gap-1 text-center">
                        {WEEKDAY_CN.map((w, idx) => {
                          const isWeekend = idx === 0 || idx === 6;
                          return (
                            <div key={w} className="py-0.5">
                              <div className={`text-[11px] md:text-xs font-bold tracking-wider ${isWeekend ? 'text-[#B03A2E]' : 'text-[#8A7A5E]'}`}>
                                {w}
                              </div>
                              <div className={`text-[9px] uppercase tracking-widest opacity-60 ${isWeekend ? 'text-[#B03A2E]' : 'text-[#8A7A5E]'}`}>
                                {WEEKDAY_EN[idx]}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* ── 日期网格 ── */}
                      <div className="relative z-10 mt-1 grid flex-1 grid-cols-7 grid-rows-6 gap-1">
                        {cells.map((cell) => (
                          <DayCellView
                            key={cell.key}
                            cell={cell}
                            isBrushTarget={brushTarget === cell.key}
                            brushControls={brushControls}
                            onSelect={handleDayClick}
                          />
                        ))}
                      </div>

                      {/* ── 底部禅语与说明 ── */}
                      <div className="relative z-10 mt-2 flex items-center justify-between text-[10px] tracking-[0.25em] text-[#8A7A5E]/80 md:text-xs border-t border-[#8A7A5E]/15 pt-2">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 rounded-full bg-[#B03A2E]/80" />
                          红圈标注为佛学会活动日
                        </span>
                        <span className="font-serif">以戒为师 · 福慧双修</span>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              /* ════════════════════════════════════
                 活动详情宣纸页 (切入过渡)
              ════════════════════════════════════ */
              <motion.div
                key="detail"
                variants={PAPER_VARIANTS}
                initial="enter"
                animate={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', x: 0, opacity: 1 }}
                exit="exitDetail"
                className="absolute inset-0 z-30 overflow-y-auto"
                style={{
                  background:
                    'radial-gradient(120% 120% at 80% 10%, #FFFDF9 0%, #F8F3E6 60%, #EFE5D0 100%)',
                }}
              >
                <EventDetailPanel event={selectedEvent} onClose={handleClose} noiseId={noiseId} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   活动详情宣纸面板
══════════════════════════════════════════════════ */
function EventDetailPanel({
  event,
  onClose,
  noiseId,
}: {
  event: CalendarEvent | null;
  onClose: () => void;
  noiseId: string;
}) {
  if (!event) return null;

  const [dYear, dMonth, dDay] = event.date.split('-');
  const dateObj = new Date(Number(dYear), Number(dMonth) - 1, Number(dDay));
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][dateObj.getDay()];

  // Google Calendar URL
  const googleCalUrl = useMemo(() => {
    const startStr = `${dYear}${dMonth}${dDay}T${event.time.replace(':', '')}00`;
    const endHour = String((Number(event.time.split(':')[0]) + 2) % 24).padStart(2, '0');
    const endStr = `${dYear}${dMonth}${dDay}T${endHour}${event.time.split(':')[1]}00`;
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(`${event.subtitle || ''}\n\n${event.description}`);
    const loc = encodeURIComponent(event.location);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${loc}`;
  }, [dYear, dMonth, dDay, event]);

  // 下载 .ics 文件
  const handleDownloadIcs = useCallback(() => {
    const startStr = `${dYear}${dMonth}${dDay}T${event.time.replace(':', '')}00`;
    const endHour = String((Number(event.time.split(':')[0]) + 2) % 24).padStart(2, '0');
    const endStr = `${dYear}${dMonth}${dDay}T${endHour}${event.time.split(':')[1]}00`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Jida Buddhist Society//Zen Calendar//CN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id}@jidabuddhist.org`,
      `DTSTAMP:${startStr}Z`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${(event.subtitle ? event.subtitle + '\\n' : '') + event.description}`,
      `LOCATION:${event.location}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title}_${event.date}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [dYear, dMonth, dDay, event]);

  return (
    <div className="relative flex h-full flex-col justify-between p-6 md:p-10">
      {/* 宣纸纤维滤镜 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.45] mix-blend-multiply"
        style={{ filter: `url(#${noiseId})` }}
      />

      {/* 顶部工具栏：关闭按钮与朱砂方印 */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* 朱砂印章 */}
          <div
            className="flex h-11 w-11 items-center justify-center rounded-sm border-2 border-[#B03A2E] p-0.5 shadow-xs"
            style={{ backgroundColor: 'rgba(176,58,46,0.06)' }}
          >
            <div className="flex h-full w-full items-center justify-center border border-[#B03A2E]/60 text-center font-serif text-[9px] font-extrabold leading-[10px] tracking-widest text-[#B03A2E]">
              技大
              <br />
              佛学
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#8A7A5E] font-medium">
              Event Details · 盛会法席
            </span>
            <p className="text-xs text-[#5A4A38] font-serif">岁次丙午 · 随喜赞叹</p>
          </div>
        </div>

        {/* 返回日历按钮 */}
        <button
          type="button"
          onClick={onClose}
          className="group flex h-9 w-9 items-center justify-center rounded-full bg-[#EFE5D0]/80 text-[#5A4A38] hover:bg-[#E5D7BE] hover:text-[#2B241C] transition-all duration-200 border border-[#8A7A5E]/20"
          aria-label="返回日历"
        >
          <X className="h-4 w-4 transition-transform group-hover:rotate-90" />
        </button>
      </div>

      {/* 中部核心内容 */}
      <div className="relative z-10 my-4 flex-1">
        {/* 日期大字标 */}
        <div className="flex items-baseline gap-3">
          <span
            className="text-5xl md:text-7xl font-bold tracking-tight text-[#B03A2E]"
            style={{ fontFamily: 'Georgia, "Songti SC", serif' }}
          >
            {dDay}
          </span>
          <div>
            <div className="text-sm md:text-base font-bold text-[#2B241C] font-serif">
              {dYear}年 {dMonth}月 · {weekday}
            </div>
            <div className="text-xs text-[#8A7A5E]">
              农历吉日 · 善业同修
            </div>
          </div>
        </div>

        {/* 活动标题与副标 */}
        <h3
          className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-[#2B241C] font-serif"
          style={{ letterSpacing: '-0.01em' }}
        >
          {event.title}
        </h3>
        {event.subtitle && (
          <p className="mt-1 text-xs md:text-sm font-medium text-[#8A6B2E]">
            {event.subtitle}
          </p>
        )}

        {/* 关键信息芯片 */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-full bg-[#F4ECDC] px-3 py-1 text-[#5A4A38] border border-[#8A7A5E]/20">
            <Clock className="h-3.5 w-3.5 text-[#B03A2E]" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[#F4ECDC] px-3 py-1 text-[#5A4A38] border border-[#8A7A5E]/20">
            <MapPin className="h-3.5 w-3.5 text-[#B03A2E]" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[#F4ECDC] px-3 py-1 text-[#8A6B2E] font-medium border border-[#8A7A5E]/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>+{event.points} 功德积分</span>
          </div>
        </div>

        {/* 活动详述 */}
        <div className="mt-4 rounded-2xl bg-[#FAF6EE]/90 p-4 md:p-5 border border-[#8A7A5E]/15 shadow-inner">
          <p className="text-xs md:text-sm text-[#4A3B2E] leading-relaxed font-serif">
            {event.description}
          </p>
        </div>
      </div>

      {/* 底部操作行 */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#8A7A5E]/20 pt-4">
        <div className="text-[11px] text-[#8A7A5E]">
          随喜参与 · 共种善因
        </div>

        <div className="flex items-center gap-2">
          {/* 加入 Google 日历 */}
          <a
            href={googleCalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-[#FBF6EA] px-3.5 py-2 text-xs font-medium text-[#5A4A38] hover:bg-[#F2E8D2] hover:text-[#2B241C] transition-all border border-[#8A7A5E]/25 shadow-xs"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Google 日历</span>
          </a>

          {/* 导出 .ics 文件 */}
          <button
            type="button"
            onClick={handleDownloadIcs}
            className="flex items-center gap-1.5 rounded-xl bg-[#B03A2E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#962F24] transition-all shadow-sm hover:shadow"
          >
            <Download className="h-3.5 w-3.5" />
            <span>加入本地日历 (.ics)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* 翻月小按钮辅助组件 */
function PaperNavBtn({
  onClick,
  children,
  label,
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-full text-[#5A4A38] hover:bg-[#EADBBE] hover:text-[#2B241C] transition-colors"
    >
      {children}
    </button>
  );
}
