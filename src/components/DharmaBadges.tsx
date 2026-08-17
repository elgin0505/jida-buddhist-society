"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Member } from "@/components/MemberContext";

export interface DharmaLevel {
  level: number;
  title: string;
  badge: string;
  minPoints: number;
  maxPoints: number;
  desc: string;
  color: string;
}

export const DHARMA_LEVELS: DharmaLevel[] = [
  {
    level: 1,
    title: "初发心菩萨",
    badge: "🌱",
    minPoints: 0,
    maxPoints: 10,
    desc: "种下一颗菩提种子，踏上福慧修持之旅。",
    color: "from-emerald-400 to-emerald-600",
  },
  {
    level: 2,
    title: "勇猛精进",
    badge: "🌿",
    minPoints: 10,
    maxPoints: 25,
    desc: "精进不退，如救头燃，常随佛学见自性。",
    color: "from-teal-400 to-teal-600",
  },
  {
    level: 3,
    title: "福慧双修",
    badge: "🌸",
    minPoints: 25,
    maxPoints: 50,
    desc: "悲智双运，广行六度，自利利他德泽广。",
    color: "from-amber-400 to-amber-600",
  },
  {
    level: 4,
    title: "法喜充满",
    badge: "🪷",
    minPoints: 50,
    maxPoints: 100,
    desc: "身心清净无挂碍，安住当下常生欢喜。",
    color: "from-golden-deep to-golden-rich",
  },
  {
    level: 5,
    title: "圆满自在",
    badge: "👑",
    minPoints: 100,
    maxPoints: 9999,
    desc: "功德圆满，普度众生，觉行圆满证大自在。",
    color: "from-yellow-300 via-amber-500 to-amber-700",
  },
];

export interface BadgeItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  progressText: string;
  quote: string;
}

interface DharmaBadgesProps {
  member: Member;
  attendanceCount: number;
  redemptionCount: number;
}

export function DharmaBadges({
  member,
  attendanceCount,
  redemptionCount,
}: DharmaBadgesProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  // 计算当前等级
  const currentLevelInfo = useMemo(() => {
    const pts = member.totalPoints;
    for (let i = DHARMA_LEVELS.length - 1; i >= 0; i--) {
      if (pts >= DHARMA_LEVELS[i].minPoints) {
        const lvl = DHARMA_LEVELS[i];
        const nextLvl = DHARMA_LEVELS[i + 1] || null;
        const progress = nextLvl
          ? Math.min(
              100,
              Math.max(
                0,
                ((pts - lvl.minPoints) / (nextLvl.minPoints - lvl.minPoints)) * 100
              )
            )
          : 100;
        const remaining = nextLvl ? nextLvl.minPoints - pts : 0;
        return { lvl, nextLvl, progress, remaining };
      }
    }
    return {
      lvl: DHARMA_LEVELS[0],
      nextLvl: DHARMA_LEVELS[1],
      progress: 0,
      remaining: 10,
    };
  }, [member.totalPoints]);

  // 从本地获取木鱼敲击次数与法语抽签记录
  const meritCount = typeof window !== "undefined"
    ? parseInt(localStorage.getItem("jbs_zen_merit_count") || "0", 10)
    : 0;
  const dharmaDrawn = typeof window !== "undefined"
    ? localStorage.getItem("jbs_dharma_flipped") === "true"
    : false;

  // 勋章列表动态计算
  const badges: BadgeItem[] = [
    {
      id: "first_checkin",
      name: "晨钟初响",
      icon: "🔔",
      description: "初次出勤参加佛学会共修活动",
      unlocked: attendanceCount >= 1,
      progressText: attendanceCount >= 1 ? "已达成" : `还需出勤 1 次`,
      quote: "千里之行，始于足下；初发心即成菩提。",
    },
    {
      id: "diligent_trio",
      name: "精进同修",
      icon: "📿",
      description: "累计参加 3 次或以上佛学会活动",
      unlocked: attendanceCount >= 3,
      progressText: attendanceCount >= 3 ? "已达成" : `进度: ${attendanceCount}/3 次`,
      quote: "不积跬步无以至千里，持之以恒道业成。",
    },
    {
      id: "deep_roots",
      name: "善根深厚",
      icon: "🌟",
      description: "累计功德积分达到 30 积分",
      unlocked: member.totalPoints >= 30,
      progressText: member.totalPoints >= 30 ? "已达成" : `进度: ${member.totalPoints}/30 积分`,
      quote: "深植德本，生诸佛国，诸善根器皆生欢喜。",
    },
    {
      id: "wooden_fish",
      name: "静心培德",
      icon: "🐟",
      description: "使用电子木鱼敲击积聚功德 10 次以上",
      unlocked: meritCount >= 10,
      progressText: meritCount >= 10 ? "已达成" : `今日功德: ${meritCount}/10 次`,
      quote: "木鱼声声唤醒客，洗净尘劳复自真。",
    },
    {
      id: "reward_claimed",
      name: "广结善缘",
      icon: "🎁",
      description: "在商城成功兑换过 1 次结缘品",
      unlocked: redemptionCount >= 1,
      progressText: redemptionCount >= 1 ? "已达成" : `尚未兑换结缘品`,
      quote: "以法结缘，以宝利生，欢喜布施福泽绵长。",
    },
    {
      id: "daily_dharma",
      name: "法雨润心",
      icon: "📜",
      description: "求取并参悟 1 次每日菩提法语",
      unlocked: dharmaDrawn,
      progressText: dharmaDrawn ? "已达成" : `点击抽签即可解锁`,
      quote: "佛法如甘露，除灭一切烦恼热。",
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-6">
      {/* ── 修持境界与升级进度 ── */}
      <div className="rounded-3xl border border-white/80 dark:border-white/10 bg-gradient-to-br from-white/80 via-warm-cream/60 to-ocher-light/30 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900/60 p-6 shadow-md backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr ${currentLevelInfo.lvl.color} text-3xl shadow-lg ring-4 ring-white/90 text-white`}
            >
              {currentLevelInfo.lvl.badge}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-golden-rich">
                  修持境界 · Level {currentLevelInfo.lvl.level}
                </span>
                <span className="rounded-full bg-golden-deep/15 px-2 py-0.5 text-[10px] font-extrabold text-golden-rich">
                  {currentLevelInfo.lvl.title}
                </span>
              </div>
              <p className="mt-0.5 text-sm font-semibold text-charcoal dark:text-slate-200">
                {currentLevelInfo.lvl.desc}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-muted">当前累计功德</p>
            <p className="text-2xl font-black text-golden-rich">
              {member.totalPoints} <span className="text-xs font-normal text-muted">分</span>
            </p>
          </div>
        </div>

        {/* 经验进度条 */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-muted">
            <span>
              {currentLevelInfo.nextLvl
                ? `距离晋升【${currentLevelInfo.nextLvl.title}】还需 ${currentLevelInfo.remaining} 积分`
                : "已达成最高修持境界 · 圆满自在"}
            </span>
            <span className="font-bold text-golden-rich">
              {Math.round(currentLevelInfo.progress)}%
            </span>
          </div>

          <div className="relative h-3 w-full overflow-hidden rounded-full bg-ocher-light/40 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${currentLevelInfo.progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${currentLevelInfo.lvl.color} shadow-sm`}
            />
          </div>
        </div>
      </div>

      {/* ── 动态成就勋章馆 ── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎖️</span>
            <h4 className="text-lg font-bold text-charcoal dark:text-white">修持成就勋章馆</h4>
          </div>
          <span className="rounded-full bg-golden-deep/15 px-3 py-1 text-xs font-bold text-golden-rich">
            已点亮 {unlockedCount} / {badges.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {badges.map((badge) => (
            <motion.button
              key={badge.id}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedBadge(badge)}
              className={`group relative flex flex-col items-center rounded-2xl p-4 text-center transition-all border ${
                badge.unlocked
                  ? "bg-white/80 dark:bg-slate-800/90 border-golden-deep/30 shadow-md hover:shadow-lg hover:border-golden-deep"
                  : "bg-warm-cream/30 dark:bg-slate-800/30 border-dashed border-ocher/30 dark:border-white/10 opacity-60 hover:opacity-85"
              }`}
            >
              {/* 勋章图标 */}
              <div
                className={`relative mb-2 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-transform group-hover:scale-110 ${
                  badge.unlocked
                    ? "bg-gradient-to-br from-amber-100 to-amber-300 dark:from-slate-700 dark:to-slate-600 shadow-md ring-2 ring-golden-deep/40 text-charcoal"
                    : "bg-ocher-light/20 dark:bg-slate-700/50 grayscale text-muted"
                }`}
              >
                {badge.icon}
                {badge.unlocked && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-golden-deep text-[9px] font-bold text-white shadow">
                    ✓
                  </span>
                )}
              </div>

              <p className="text-xs font-bold text-charcoal dark:text-slate-100">{badge.name}</p>
              <p className="mt-1 line-clamp-1 text-[10px] text-muted dark:text-slate-400">
                {badge.description}
              </p>

              <span
                className={`mt-2.5 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                  badge.unlocked
                    ? "bg-jade/10 text-jade"
                    : "bg-ocher-light/40 text-muted"
                }`}
              >
                {badge.progressText}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── 勋章详情 3D 弹窗 ── */}
      <AnimatePresence>
        {selectedBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBadge(null)}
              className="absolute inset-0 bg-charcoal/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-white/80 dark:border-white/10 bg-warm-white/95 dark:bg-slate-800 p-7 shadow-2xl backdrop-blur-2xl text-center"
            >
              {/* 勋章大徽章展示与光晕 */}
              <div className="relative my-4 flex items-center justify-center">
                <div
                  className={`flex h-24 w-24 items-center justify-center rounded-3xl text-5xl shadow-2xl ring-4 ${
                    selectedBadge.unlocked
                      ? "bg-gradient-to-tr from-amber-300 via-amber-400 to-yellow-200 dark:from-slate-700 dark:to-slate-600 ring-golden-deep/50 animate-pulse"
                      : "bg-ocher-light/30 dark:bg-slate-700/50 ring-ocher/30 dark:ring-white/10 grayscale"
                  }`}
                >
                  {selectedBadge.icon}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2">
                <h4 className="text-xl font-bold text-charcoal dark:text-white">
                  {selectedBadge.name}
                </h4>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    selectedBadge.unlocked
                      ? "bg-jade/15 text-jade"
                      : "bg-carmine/10 text-carmine"
                  }`}
                >
                  {selectedBadge.unlocked ? "已点亮" : "未解锁"}
                </span>
              </div>

              <p className="mt-2 text-xs text-charcoal/80">
                {selectedBadge.description}
              </p>

              {/* 禅意法义寄语 */}
              <div className="my-5 rounded-2xl bg-white/70 dark:bg-slate-700/50 p-4 border border-ocher/15 dark:border-white/10 text-xs text-golden-rich font-serif italic">
                “{selectedBadge.quote}”
              </div>

              <button
                onClick={() => setSelectedBadge(null)}
                className="w-full rounded-xl bg-golden-deep py-3 text-xs font-bold text-white shadow-md hover:bg-golden-rich transition-all"
              >
                随喜赞叹 · 关闭
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
