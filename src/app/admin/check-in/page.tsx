"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, PageHeader, Badge, MemberAvatar } from "@/components/ui";
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
  const [scannedMember, setScannedMember] = useState<Member | null>(null);
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
        }
      });

    fetch("/api/attendance")
      .then((res) => res.json())
      .then(setRecentCheckIns);
  }, []);

  const handleScan = useCallback(async (data: string) => {
    setShowScanner(false);
    setMessage(null);

    const res = await fetch("/api/members");
    const members: Member[] = await res.json();

    const member =
      members.find((m) => m.memberId === data) ??
      members.find((m) => m.id === data);

    if (member) {
      setScannedMember(member);
    } else {
      setMessage({ type: "error", text: "未找到对应会员，请检查二维码" });
    }
  }, []);

  const handleCheckIn = async () => {
    if (!scannedMember || !selectedEvent) return;

    setLoading(true);
    setMessage(null);

    const event = events.find((e) => e.name === selectedEvent);
    const points = customPoints !== "" ? Number(customPoints) : (event?.points ?? 1);

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: scannedMember.id,
          eventName: selectedEvent,
          pointsEarned: points,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
      } else {
        // 弹出 Spring 气泡
        setToast({
          memberName: scannedMember.name,
          memberId: scannedMember.memberId,
          pointsEarned: points,
        });
        setToastVisible(true);

        setScannedMember(data.member);
        const logs = await fetch("/api/attendance").then((r) => r.json());
        setRecentCheckIns(logs);
      }
    } catch {
      setMessage({ type: "error", text: "签到失败，请稍后重试" });
    } finally {
      setLoading(false);
    }
  };

  const handleManualLookup = async (memberIdInput: string) => {
    setMessage(null);
    const res = await fetch("/api/members");
    const members: Member[] = await res.json();
    const member = members.find(
      (m) =>
        m.memberId.toLowerCase() === memberIdInput.toLowerCase() ||
        m.name.includes(memberIdInput)
    );

    if (member) {
      setScannedMember(member);
    } else {
      setMessage({ type: "error", text: "未找到会员" });
    }
  };

  return (
    <PageWrapper page="admin">
      <AdminPinLock>
        <PageHeader
          title="管理员签到"
          subtitle="扫描会员二维码或手动查找，记录活动出勤并发放积分"
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 签到操作卡 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Card>
              <h4 className="mb-4 text-lg font-semibold text-charcoal">签到操作</h4>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-charcoal">选择活动</label>
                  <select
                    value={selectedEvent}
                    onChange={(e) => {
                      setSelectedEvent(e.target.value);
                      const event = events.find((ev) => ev.name === e.target.value);
                      if (event) setCustomPoints(event.points);
                    }}
                    className="w-full rounded-xl border border-ocher/30 bg-white/80 px-4 py-2.5 text-sm focus:border-golden-deep focus:outline-none focus:ring-2 focus:ring-golden-deep/20"
                  >
                    {events.map((event) => (
                      <option key={event.id} value={event.name}>
                        {event.name} (+{event.points} 积分)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-charcoal">获得积分</label>
                  <input
                    type="number"
                    min={1}
                    value={customPoints}
                    onChange={(e) => setCustomPoints(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-xl border border-ocher/30 bg-white/80 px-4 py-2.5 text-sm focus:border-golden-deep focus:outline-none focus:ring-2 focus:ring-golden-deep/20"
                  />
                </div>

                <button onClick={() => setShowScanner(true)} className="btn-jade w-full py-3">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                    <rect x="7" y="7" width="10" height="10" rx="1" />
                  </svg>
                  扫描二维码签到
                </button>

                <ManualLookup onLookup={handleManualLookup} />
              </div>

              {message && (
                <div
                  className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium ${
                    message.type === "success" ? "bg-jade/10 text-jade" : "bg-carmine/10 text-carmine"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </Card>
          </motion.div>

          {/* 会员信息卡 */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
          >
            <Card>
              <h4 className="mb-4 text-lg font-semibold text-charcoal">会员信息</h4>

              {scannedMember ? (
                <div className="space-y-4">
                  <motion.div
                    key={scannedMember.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex items-center gap-4"
                  >
                    <MemberAvatar name={scannedMember.name} photo={scannedMember.photo} size="md" />
                    <div>
                      <p className="text-lg font-semibold text-charcoal">{scannedMember.name}</p>
                      <p className="text-sm text-muted">{scannedMember.email}</p>
                      <div className="mt-1 flex gap-2">
                        <Badge variant="golden">{scannedMember.memberId}</Badge>
                        <Badge variant="jade">{scannedMember.totalPoints} 积分</Badge>
                      </div>
                    </div>
                  </motion.div>

                  <button
                    onClick={handleCheckIn}
                    disabled={loading || !selectedEvent}
                    className="btn-primary w-full py-3"
                  >
                    {loading ? "签到中..." : "确认签到"}
                  </button>

                  <button onClick={() => setScannedMember(null)} className="btn-secondary w-full">
                    清除
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-jade/10 text-jade">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                      <rect x="7" y="7" width="10" height="10" rx="1" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted">扫描会员二维码或手动查找会员</p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* 最近签到记录 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
        >
          <Card className="mt-6">
            <h4 className="mb-4 text-lg font-semibold text-charcoal">最近签到记录</h4>
            {recentCheckIns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-ocher/20 text-muted">
                      <th className="pb-3 pr-4 font-medium">会员</th>
                      <th className="pb-3 pr-4 font-medium">活动</th>
                      <th className="pb-3 pr-4 font-medium">时间</th>
                      <th className="pb-3 font-medium">积分</th>
                    </tr>
                  </thead>
                  <thead>
                    <tr className="border-b border-ocher/20 text-muted">
                    </tr>
                  </thead>
                  <tbody>
                    {recentCheckIns.slice(0, 10).map((log) => (
                      <tr key={log.id} className="border-b border-ocher/10">
                        <td className="py-3 pr-4">
                          <span className="font-medium text-charcoal">{log.member.name}</span>
                          <span className="ml-1 text-xs text-muted">({log.member.memberId})</span>
                        </td>
                        <td className="py-3 pr-4 text-muted">{log.eventName}</td>
                        <td className="py-3 pr-4 text-muted">{new Date(log.dateTime).toLocaleString("zh-CN")}</td>
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
      <label className="mb-1.5 block text-sm font-medium text-charcoal">手动查找会员</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="输入会员ID或姓名"
          className="flex-1 rounded-xl border border-ocher/30 bg-white/80 px-4 py-2.5 text-sm focus:border-golden-deep focus:outline-none focus:ring-2 focus:ring-golden-deep/20"
          onKeyDown={(e) => e.key === "Enter" && query && onLookup(query)}
        />
        <button onClick={() => query && onLookup(query)} className="btn-secondary shrink-0">
          查找
        </button>
      </div>
    </div>
  );
}
