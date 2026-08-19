"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, EmptyState } from "@/components/ui";
import { PageWrapper } from "@/components/PageWrapper";
import { LotusLoading } from "@/components/LotusLoading";
import { motion, AnimatePresence } from "framer-motion";

interface Event {
  id: string;
  name: string;
  description: string | null;
  dateTime: string;
  location: string | null;
  points: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      });
  }, []);

  const now = new Date();
  const upcoming = events.filter((e) => new Date(e.dateTime) >= now);
  const past = events.filter((e) => new Date(e.dateTime) < now);

  if (loading) {
    return (
      <PageWrapper page="events">
        <LotusLoading text="莲花初绽 · 正在获取佛学会活动列表..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper page="events">
      <PageHeader
        title="活动列表"
        subtitle="查看即将举行的佛学会活动，一键同步日历，参与活动获取功德积分"
      />

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          }
          title="暂无活动"
          description="新的佛学会活动即将发布，敬请期待"
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mb-10">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-charcoal dark:text-white">
                <span className="flex h-2 w-2 rounded-full bg-jade animate-pulse" />
                即将举行 · 随喜参加
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.38 }}
                  >
                    <EventCard event={event} upcoming />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h3 className="mb-4 text-lg font-semibold text-muted dark:text-slate-400">往期活动</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {past.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 + 0.2, duration: 0.38 }}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </PageWrapper>
  );
}

function EventCard({ event, upcoming = false }: { event: Event; upcoming?: boolean }) {
  const date = new Date(event.dateTime);
  const [showCalendarMenu, setShowCalendarMenu] = useState(false);

  // 生成 .ics (Apple / Outlook / 系统日历标准文件)
  const downloadICS = () => {
    const startDate = new Date(event.dateTime);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 默认持续2小时

    const formatDate = (d: Date) =>
      d
        .toISOString()
        .replace(/-|:|\.\d+/g, "");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//JBS//Jida Buddhist Society//CN",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `SUMMARY:技大佛学会 · ${event.name}`,
      `DESCRIPTION:${event.description || "技大佛学会共修活动"} (签到可获 +${event.points} 功德积分)`,
      `LOCATION:${event.location || "技术大学佛学会活动室"}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `JBS_${event.name}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowCalendarMenu(false);
  };

  // 跳转 Google Calendar
  const openGoogleCalendar = () => {
    const startDate = new Date(event.dateTime);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const formatGDate = (d: Date) =>
      d.toISOString().replace(/-|:|\.\d+/g, "");

    const title = encodeURIComponent(`技大佛学会 · ${event.name}`);
    const details = encodeURIComponent(
      `${event.description || "技大佛学会共修活动"}\n(参加签到可获 +${event.points} 功德积分)`
    );
    const location = encodeURIComponent(event.location || "技术大学佛学会活动室");
    const dates = `${formatGDate(startDate)}/${formatGDate(endDate)}`;

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    window.open(url, "_blank");
    setShowCalendarMenu(false);
  };

  return (
    <Card hover className="relative overflow-hidden">
      {upcoming && (
        <div className="absolute right-0 top-0 h-16 w-16">
          <div className="absolute right-[-20px] top-[12px] w-[80px] rotate-45 bg-jade py-0.5 text-center text-[10px] font-bold text-white shadow-sm">
            即将
          </div>
        </div>
      )}

      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200/60 border border-golden-deep/30 shadow-inner">
          <span className="text-xs font-bold text-golden-rich">
            {date.toLocaleDateString("zh-CN", { month: "short" })}
          </span>
          <span className="text-xl font-black leading-none text-golden-rich">
            {date.getDate()}
          </span>
        </div>
        <div className="min-w-0 flex-1 pr-6">
          <h4 className="font-bold text-charcoal">{event.name}</h4>
          <p className="mt-0.5 text-xs text-muted">
            {date.toLocaleString("zh-CN", { weekday: "long", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {event.description && (
        <p className="mb-3 text-sm leading-relaxed text-muted line-clamp-2">
          {event.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {event.location && (
          <Badge variant="sapphire">
            <svg className="mr-1 inline h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {event.location}
          </Badge>
        )}
        <Badge variant="golden">+{event.points} 积分</Badge>
      </div>

      {/* 底部操作行：同步日历 */}
      {upcoming && (
        <div className="relative pt-3 border-t border-ocher/20 flex items-center justify-end gap-2">
          {/* 同步日历下拉按钮 */}
          <div className="relative">
            <button
              onClick={() => setShowCalendarMenu(!showCalendarMenu)}
              className="flex items-center gap-1.5 rounded-xl border border-ocher/50 bg-white/90 px-3 py-1.5 text-xs font-bold text-charcoal hover:bg-ocher-light/40 transition-all shadow-xs"
            >
              <svg className="h-3.5 w-3.5 text-golden-rich" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              加入日历
            </button>

            {/* 日历类型选择菜单 */}
            <AnimatePresence>
              {showCalendarMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 8 }}
                  className="absolute right-0 bottom-full mb-2 z-30 w-48 rounded-2xl border-2 border-golden-deep/30 bg-warm-white/98 p-2 shadow-xl backdrop-blur-xl"
                >
                  <button
                    onClick={downloadICS}
                    className="flex w-full items-center gap-2 rounded-xl p-2 text-left text-xs font-bold text-charcoal hover:bg-ocher-light/40 transition-colors"
                  >
                    <span>🍏</span>
                    Apple / 系统日历 (.ics)
                  </button>
                  <button
                    onClick={openGoogleCalendar}
                    className="flex w-full items-center gap-2 rounded-xl p-2 text-left text-xs font-bold text-charcoal hover:bg-ocher-light/40 transition-colors"
                  >
                    <span>🌐</span>
                    Google 日历 (网页跳转)
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </Card>
  );
}
