"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, EmptyState } from "@/components/ui";
import { PageWrapper } from "@/components/PageWrapper";
import { motion } from "framer-motion";

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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-ocher-light/20" />
          ))}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper page="events">
      <PageHeader
        title="活动列表"
        subtitle="查看即将举行的佛学会活动，参与活动获取功德积分"
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
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-charcoal">
                <span className="flex h-2 w-2 rounded-full bg-jade" />
                即将举行
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
              <h3 className="mb-4 text-lg font-semibold text-muted">往期活动</h3>
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

  return (
    <Card hover className="relative overflow-hidden">
      {upcoming && (
        <div className="absolute right-0 top-0 h-16 w-16">
          <div className="absolute right-[-20px] top-[12px] w-[80px] rotate-45 bg-jade py-0.5 text-center text-[10px] font-bold text-white">
            即将
          </div>
        </div>
      )}

      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-golden-deep/10">
          <span className="text-xs font-bold text-golden-rich">
            {date.toLocaleDateString("zh-CN", { month: "short" })}
          </span>
          <span className="text-xl font-bold leading-none text-golden-rich">
            {date.getDate()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-charcoal">{event.name}</h4>
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

      <div className="flex flex-wrap items-center gap-2">
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
    </Card>
  );
}
