"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MemberAvatar, Badge } from "@/components/ui";
import { Member } from "@/components/MemberContext";

interface LeaderboardProps {
  members: Member[];
  currentMemberId?: string;
}

export function Leaderboard({ members, currentMemberId }: LeaderboardProps) {
  const [tab, setTab] = useState<"points" | "all">("points");

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => b.totalPoints - a.totalPoints);
  }, [members]);

  const top3 = sortedMembers.slice(0, 3);
  const remaining = sortedMembers.slice(3);

  // 1st place in center, 2nd place on left, 3rd place on right
  const podium = [
    { rank: 2, member: top3[1], height: "h-28", color: "from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700", badgeColor: "bg-slate-200 text-slate-700", medal: "🥈" },
    { rank: 1, member: top3[0], height: "h-36", color: "from-amber-300 to-amber-500 dark:from-slate-600 dark:to-slate-700", badgeColor: "bg-amber-100 text-amber-800", medal: "🥇" },
    { rank: 3, member: top3[2], height: "h-24", color: "from-amber-600 to-amber-800 dark:from-slate-600 dark:to-slate-700", badgeColor: "bg-orange-100 text-amber-900", medal: "🥉" },
  ];

  return (
    <div className="space-y-6">
      {/* 顶部 Tab 切换 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <h4 className="text-lg font-bold text-charcoal dark:text-white">精进功德榜</h4>
        </div>

        <div className="flex rounded-xl bg-ocher-light/30 dark:bg-slate-800/80 p-1 text-xs font-semibold">
          <button
            onClick={() => setTab("points")}
            className={`rounded-lg px-3 py-1.5 transition-all ${
              tab === "points"
                ? "bg-white dark:bg-slate-700 text-golden-rich shadow-sm"
                : "text-muted dark:text-slate-400 hover:text-charcoal dark:hover:text-white"
            }`}
          >
            功德榜
          </button>
        </div>
      </div>

      {/* 领奖台 (Top 3 Podium) */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-3 pt-6 pb-2">
          {podium.map(({ rank, member, height, color, badgeColor, medal }) => {
            if (!member) return null;
            const isCurrent = member.id === currentMemberId;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rank * 0.1, duration: 0.4 }}
                className="flex flex-1 flex-col items-center max-w-[130px]"
              >
                {/* 皇冠 / 奖牌 */}
                <div className="relative mb-2 flex flex-col items-center">
                  {rank === 1 && (
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-6 text-xl"
                    >
                      👑
                    </motion.div>
                  )}
                  <div className={`relative ${isCurrent ? "ring-4 ring-golden-deep rounded-full" : ""}`}>
                    <MemberAvatar name={member.name} photo={member.photo} size={rank === 1 ? "md" : "sm"} />
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs shadow">
                      {medal}
                    </span>
                  </div>
                </div>

                {/* 姓名与积分 */}
                <p className="w-full truncate text-center text-xs font-bold text-charcoal dark:text-white">
                  {member.name}
                </p>
                <p className="text-[11px] font-bold text-golden-rich">
                  {member.totalPoints} <span className="text-[9px] font-normal text-muted dark:text-slate-400">分</span>
                </p>

                {/* 领奖台台柱 */}
                <div
                  className={`mt-2 flex w-full ${height} flex-col items-center justify-start rounded-t-2xl bg-gradient-to-b ${color} pt-2 shadow-md ${
                    rank === 1
                      ? "ring-2 ring-amber-300 shadow-[0_0_24px_rgba(201,162,39,0.4)]"
                      : ""
                  }`}
                >
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-black ${badgeColor}`}>
                    NO.{rank}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 4名及以后排行榜列表 */}
      {remaining.length > 0 && (
        <div className="space-y-2 pt-2">
          {remaining.map((member, index) => {
            const rank = index + 4;
            const isCurrent = member.id === currentMemberId;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between rounded-xl px-4 py-3 transition-all ${
                  isCurrent
                    ? "bg-golden-deep/15 border border-golden-deep/40 shadow-sm"
                    : "bg-warm-cream/40 dark:bg-slate-800/50 hover:bg-warm-cream/70 dark:hover:bg-slate-800/80"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ocher-light/50 dark:bg-slate-700 text-xs font-bold text-muted dark:text-slate-400">
                    {rank}
                  </span>
                  <MemberAvatar name={member.name} photo={member.photo} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-charcoal dark:text-white">
                      {member.name} {isCurrent && <span className="text-[10px] text-golden-rich">(我)</span>}
                    </p>
                    <p className="text-[11px] text-muted dark:text-slate-400">{member.memberId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="golden">{member.totalPoints} 积分</Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
