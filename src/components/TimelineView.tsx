"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Badge } from "@/components/ui";

interface TimelineItem {
  id: string;
  type: "attendance" | "redemption";
  title: string;
  date: string;
  points: number;
}

interface TimelineViewProps {
  attendances: { id: string; eventName: string; dateTime: string; pointsEarned: number }[];
  redemptions: { id: string; reward: { name: string }; createdAt: string; pointsSpent: number }[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } as any },
};

export function TimelineView({ attendances = [], redemptions = [] }: TimelineViewProps) {
  // Merge and sort data
  const items: TimelineItem[] = [
    ...attendances.map((a) => ({
      id: `att-${a.id}`,
      type: "attendance" as const,
      title: a.eventName,
      date: a.dateTime,
      points: a.pointsEarned,
    })),
    ...redemptions.map((r) => ({
      id: `red-${r.id}`,
      type: "redemption" as const,
      title: r.reward.name,
      date: r.createdAt,
      points: r.pointsSpent,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted font-medium">
        暂无出勤或兑换记录
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-2xl py-6">
      {/* 贯穿中轴的细线 */}
      <div className="absolute bottom-0 left-[85px] top-4 w-px bg-gradient-to-b from-golden-deep/50 via-golden-deep/20 to-transparent sm:left-[120px]" />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
        {items.map((item) => {
          const isAttendance = item.type === "attendance";
          const dateObj = new Date(item.date);
          
          return (
            <motion.div key={item.id} variants={itemVariants} className="relative flex items-start gap-4 sm:gap-6">
              {/* 左侧：时间 */}
              <div className="w-[70px] shrink-0 text-right sm:w-[100px]">
                <div className="text-xs font-bold text-charcoal sm:text-sm">
                  {format(dateObj, "MM-dd", { locale: zhCN })}
                </div>
                <div className="mt-0.5 text-[10px] text-muted sm:text-xs">
                  {format(dateObj, "HH:mm")}
                </div>
              </div>

              {/* 中间：发光圆点 */}
              <div className="relative mt-1 flex h-4 w-4 shrink-0 items-center justify-center">
                <div className="absolute h-full w-full rounded-full bg-golden-deep/30 blur-[4px]" />
                <div className="relative h-2 w-2 rounded-full bg-golden-rich shadow-[0_0_8px_rgba(255,179,0,0.8)]" />
              </div>

              {/* 右侧：卡片详情 */}
              <div className="flex-1 rounded-2xl border-2 border-golden-deep/30 bg-gradient-to-r from-warm-white/95 via-warm-cream/90 to-ocher-light/35 p-4 shadow-sm backdrop-blur-md transition-all hover:border-golden-deep/60 hover:shadow-md">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-charcoal">
                      {isAttendance ? `参加了 ${item.title}` : `兑换了 ${item.title}`}
                    </h4>
                  </div>
                  <div className="shrink-0">
                    <Badge variant={isAttendance ? "jade" : "carmine"} className="text-xs font-bold shadow-sm">
                      {isAttendance ? "+" : "-"}{item.points} 功德
                    </Badge>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
