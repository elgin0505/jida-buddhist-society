"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, PageHeader, Badge } from "@/components/ui";
import { QRScanner } from "@/components/QRScanner";
import { PageWrapper } from "@/components/PageWrapper";
import { CheckInToast } from "@/components/CheckInToast";
import { AdminPinLock } from "@/components/AdminPinLock";
import { motion } from "framer-motion";

interface Event {
  id: string;
  name: string;
  points: number;
}

interface Member {
  id: string;
  memberId: string;
  name: string;
  email: string;
  photo: string | null;
  totalPoints: number;
}

interface ToastData {
  memberName: string;
  memberId: string;
  pointsEarned: number;
}

export default function AdminCheckInPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [customPoints, setCustomPoints] = useState<number | "">("");
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<
    { id: string; dateTime: string; eventName: string; pointsEarned: number; member: { name: string; memberId: string } }[]
  >([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        const upcoming = data.filter(
          (e: Event & { dateTime: string }) => new Date(e.dateTime) >= new Date()
        );
        if (upcoming.length > 0) {
          setSelectedEvent(upcoming[0].name);
          setCustomPoints(upcoming[0].points);
        } else if (data.length > 0) {
          setSelectedEvent(data[0].name);
          setCustomPoints(data[0].points);
        }
      });

    fetch("/api/attendance")
      .then((res) => res.json())
      .then(setRecentCheckIns);
  }, []);

  // 执行直接签到
  const executeCheckInForMember = async (member: Member) => {
    if (!selectedEvent) {
      setMessage({ type: "error", text: "请先选择需要签到的活动" });
      return;
    }

    setLoading(true);
    setMessage(null);

    const event = events.find((e) => e.name === selectedEvent);
    const points = customPoints !== "" ? Number(customPoints) : (event?.points ?? 1);

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          eventName: selectedEvent,
          pointsEarned: points,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "签到失败" });
      } else {
        // 弹出 Spring 提示气泡
        setToast({
          memberName: member.name,
          memberId: member.memberId,
          pointsEarned: points,
        });
        setToastVisible(true);
        setMessage({
          type: "success",
          text: `🎉 会员【${member.name} (${member.memberId})】签到成功！已发放 +${points} 功德积分。`,
        });

        // 刷新最近签到列表
        const logs = await fetch("/api/attendance").then((r) => r.json());
        setRecentCheckIns(logs);
      }
    } catch {
      setMessage({ type: "error", text: "网络异常，签到失败，请稍后重试" });
    } finally {
      setLoading(false);
    }
  };

  // 扫码直接完成签到
  const handleScan = useCallback(
    async (data: string) => {
      setShowScanner(false);
      setMessage(null);

      try {
        const res = await fetch("/api/members");
        const members: Member[] = await res.json();

        const trimmed = data.trim().toLowerCase();
        const member =
          members.find((m) => m.memberId.toLowerCase() === trimmed) ??
          members.find((m) => m.id === data.trim());

        if (member) {
          await executeCheckInForMember(member);
        } else {
          setMessage({ type: "error", text: `未找到二维码对应的会员 (${data})，请检查二维码` });
        }
      } catch {
        setMessage({ type: "error", text: "获取会员列表失败，请重试" });
      }
    },
    [selectedEvent, customPoints, events]
  );

  // 手动输入查找并签到
  const handleManualLookup = async (memberIdInput: string) => {
    setMessage(null);
    try {
      const res = await fetch("/api/members");
      const members: Member[] = await res.json();
      const trimmed = memberIdInput.trim().toLowerCase();
      const member = members.find(
        (m) =>
          m.memberId.toLowerCase() === trimmed ||
          m.name.toLowerCase().includes(trimmed)
      );

      if (member) {
        await executeCheckInForMember(member);
      } else {
        setMessage({ type: "error", text: `未找到匹配会员 "${memberIdInput}"` });
      }
    } catch {
      setMessage({ type: "error", text: "查找会员失败，请稍后重试" });
    }
  };

  return (
    <PageWrapper page="admin">
      <AdminPinLock>
        <PageHeader
          title="管理员签到"
          subtitle="选择活动后扫描会员二维码或手动查找，一键记录出勤并发放功德积分"
        />

        <div className="max-w-2xl mx-auto space-y-6">
          {/* 签到操作卡 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-charcoal">签到操作</h4>
                <span className="text-xs font-semibold text-golden-rich bg-golden-deep/10 border border-golden-deep/20 px-2.5 py-1 rounded-full">
                  ⚡ 扫码即自动完成签到
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-charcoal">选择活动</label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => {
                      setSelectedEvent(e.target.value);
                      const event = events.find((ev) => ev.name === e.target.value);
                      if (event) setCustomPoints(event.points);
                    }}
                    className="w-full rounded-xl border border-ocher/40 bg-white/90 px-4 py-2.5 text-sm text-charcoal font-medium focus:border-golden-deep focus:outline-none focus:ring-2 focus:ring-golden-deep/20 shadow-xs"
                  >
                    {events.length === 0 ? (
                      <option value="">暂无活动（请先添加活动）</option>
                    ) : (
                      events.map((event) => (
                        <option key={event.id} value={event.name}>
                          {event.name} (+{event.points} 积分)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-charcoal">获得积分</label>
                  <input
                    type="number"
                    min={1}
                    value={customPoints}
                    onChange={(e) => setCustomPoints(e.target.value ? Number(e.target.value) : "")}
                    placeholder="请输入签到获得积分"
                    className="w-full rounded-xl border border-ocher/40 bg-white/90 px-4 py-2.5 text-sm text-charcoal font-medium focus:border-golden-deep focus:outline-none focus:ring-2 focus:ring-golden-deep/20 shadow-xs"
                  />
                </div>

                <button
                  onClick={() => setShowScanner(true)}
                  disabled={loading || !selectedEvent}
                  className="btn-jade w-full py-3.5 text-base font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                    <rect x="7" y="7" width="10" height="10" rx="1" />
                  </svg>
                  {loading ? "正在处理签到..." : "开启摄像头扫描签到"}
                </button>

                <div className="pt-2 border-t border-ocher/20">
                  <ManualLookup onLookup={handleManualLookup} />
                </div>
              </div>

              {message && (
                <div
                  className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold border ${
                    message.type === "success"
                      ? "bg-jade/10 text-jade border-jade/30"
                      : "bg-carmine/10 text-carmine border-carmine/30"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </Card>
          </motion.div>

          {/* 最近签到记录 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-charcoal">最近签到记录</h4>
                <span className="text-xs text-muted">实时更新</span>
              </div>

              {recentCheckIns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-ocher/20 text-muted">
                        <th className="pb-3 pr-4 font-semibold">会员</th>
                        <th className="pb-3 pr-4 font-semibold">活动</th>
                        <th className="pb-3 pr-4 font-semibold">时间</th>
                        <th className="pb-3 font-semibold">积分</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCheckIns.slice(0, 10).map((log) => (
                        <tr key={log.id} className="border-b border-ocher/10">
                          <td className="py-3 pr-4">
                            <span className="font-bold text-charcoal">{log.member.name}</span>
                            <span className="ml-1 text-xs text-muted">({log.member.memberId})</span>
                          </td>
                          <td className="py-3 pr-4 text-muted font-medium">{log.eventName}</td>
                          <td className="py-3 pr-4 text-muted text-xs font-medium">
                            {new Date(log.dateTime).toLocaleString("zh-CN")}
                          </td>
                          <td className="py-3">
                            <Badge variant="jade">+{log.pointsEarned}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted">暂无签到记录</p>
              )}
            </Card>
          </motion.div>
        </div>

        {showScanner && (
          <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
        )}

        {/* Spring 弹出气泡 */}
        {toast && (
          <CheckInToast
            memberName={toast.memberName}
            memberId={toast.memberId}
            pointsEarned={toast.pointsEarned}
            visible={toastVisible}
            onDismiss={() => {
              setToastVisible(false);
              setTimeout(() => setToast(null), 400);
            }}
          />
        )}
      </AdminPinLock>
    </PageWrapper>
  );
}

function ManualLookup({ onLookup }: { onLookup: (query: string) => void }) {
  const [query, setQuery] = useState("");

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-charcoal">手动输入查找签到</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入会员编号(如 JBS0001) 或姓名"
          className="flex-1 rounded-xl border border-ocher/40 bg-white/90 px-4 py-2.5 text-sm text-charcoal font-medium focus:border-golden-deep focus:outline-none focus:ring-2 focus:ring-golden-deep/20 shadow-xs"
          onKeyDown={(e) => e.key === "Enter" && query && onLookup(query)}
        />
        <button
          onClick={() => query && onLookup(query)}
          className="btn-secondary shrink-0 font-bold"
        >
          一键签到
        </button>
      </div>
    </div>
  );
}
