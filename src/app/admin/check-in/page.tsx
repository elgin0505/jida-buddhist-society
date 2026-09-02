"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import { Card, PageHeader, Badge } from "@/components/ui";
import { QRScanner } from "@/components/QRScanner";
import { PageWrapper } from "@/components/PageWrapper";
import { CheckInToast } from "@/components/CheckInToast";
import { AdminPinLock } from "@/components/AdminPinLock";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Check,
  Sparkles,
  UserCheck,
  Users,
  CalendarCheck,
  Award,
  QrCode,
  ArrowUpDown,
  History,
  Mail,
  Gift,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  Loader2,
} from "lucide-react";

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
  _count?: {
    attendances: number;
    redemptions: number;
  };
}

interface ToastData {
  memberName: string;
  memberId: string;
  pointsEarned: number;
}

interface MemberDetailData extends Member {
  attendances: {
    id: string;
    dateTime: string;
    eventName: string;
    pointsEarned: number;
  }[];
  redemptions: {
    id: string;
    createdAt: string;
    pointsSpent: number;
    reward: { name: string };
  }[];
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<"check-in" | "members" | "logs">("check-in");
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [customPoints, setCustomPoints] = useState<number | "">("");
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<
    { id: string; dateTime: string; eventName: string; pointsEarned: number; member: { name: string; memberId: string } }[]
  >([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  // 会员名册搜索与排序
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberSortBy, setMemberSortBy] = useState<"points-desc" | "points-asc" | "id-asc" | "name-asc">("points-desc");

  // 查看指定会员详情弹窗
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null);
  const [memberDetail, setMemberDetail] = useState<MemberDetailData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchMembers = useCallback(() => {
    fetch("/api/members")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMembers(data);
      })
      .catch(console.error);
  }, []);

  const fetchAttendance = useCallback(() => {
    fetch("/api/attendance")
      .then((res) => res.json())
      .then(setRecentCheckIns)
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchAttendance();

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
  }, [fetchMembers, fetchAttendance]);

  // 当打开会员详情弹窗时，请求该会员的出勤与兑换历史
  useEffect(() => {
    if (!detailMemberId) {
      setMemberDetail(null);
      return;
    }
    setLoadingDetail(true);
    fetch(`/api/members/${detailMemberId}`)
      .then((res) => res.json())
      .then((data) => {
        setMemberDetail(data);
      })
      .catch(console.error)
      .finally(() => setLoadingDetail(false));
  }, [detailMemberId]);

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
      const adminPin = typeof window !== "undefined"
        ? sessionStorage.getItem("jbs_admin_pin") || localStorage.getItem("jbs_admin_custom_pin") || "1080"
        : "1080";

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": adminPin,
        },
        body: JSON.stringify({
          memberId: member.id,
          eventName: selectedEvent,
          pointsEarned: points,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "签到失败" });
        return;
      }

      setMessage({
        type: "success",
        text: `✅ 签到成功！${member.name} (${member.memberId}) 已获得 +${points} 功德积分`,
      });

      // 触发气泡通知
      setToast({
        memberName: member.name,
        memberId: member.memberId,
        pointsEarned: points,
      });
      setToastVisible(true);

      // 刷新列表
      fetchAttendance();
      fetchMembers();
    } catch {
      setMessage({ type: "error", text: "网络错误，签到失败" });
    } finally {
      setLoading(false);
    }
  };

  // 处理扫码签到
  const handleScan = useCallback(
    async (decodedText: string) => {
      setShowScanner(false);
      setLoading(true);
      setMessage(null);

      const event = events.find((e) => e.name === selectedEvent);
      const points = customPoints !== "" ? Number(customPoints) : (event?.points ?? 1);

      try {
        let memberId = decodedText;
        try {
          const parsed = JSON.parse(decodedText);
          if (parsed.memberId) memberId = parsed.memberId;
        } catch {}

        const membersRes = await fetch("/api/members");
        const allMembers: Member[] = await membersRes.json();
        const member = allMembers.find(
          (m) =>
            m.id === memberId ||
            m.memberId.toLowerCase() === memberId.toLowerCase()
        );

        if (!member) {
          setMessage({ type: "error", text: "未找到对应的会员信息" });
          setLoading(false);
          return;
        }

        await executeCheckInForMember(member);
      } catch {
        setMessage({ type: "error", text: "处理二维码失败" });
        setLoading(false);
      }
    },
    [selectedEvent, customPoints, events, executeCheckInForMember]
  );

  // 手动输入查找并签到
  const handleManualLookup = async (memberIdInput: string) => {
    setMessage(null);
    try {
      const res = await fetch("/api/members");
      const membersList: Member[] = await res.json();
      const trimmed = memberIdInput.trim().toLowerCase();
      const member = membersList.find(
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

  // 统计指标计算
  const stats = useMemo(() => {
    const totalCount = members.length;
    const totalPoints = members.reduce((acc, m) => acc + (m.totalPoints || 0), 0);
    const avgPoints = totalCount > 0 ? Math.round(totalPoints / totalCount) : 0;
    const topMember = members.length > 0 ? [...members].sort((a, b) => b.totalPoints - a.totalPoints)[0] : null;
    return { totalCount, totalPoints, avgPoints, topMember };
  }, [members]);

  // 会员名册筛选与排序
  const filteredAndSortedMembers = useMemo(() => {
    let result = [...members];
    const q = memberSearchQuery.trim().toLowerCase();

    if (q) {
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.memberId.toLowerCase().includes(q) ||
          (m.email && m.email.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (memberSortBy === "points-desc") return (b.totalPoints || 0) - (a.totalPoints || 0);
      if (memberSortBy === "points-asc") return (a.totalPoints || 0) - (b.totalPoints || 0);
      if (memberSortBy === "id-asc") return a.memberId.localeCompare(b.memberId);
      if (memberSortBy === "name-asc") return a.name.localeCompare(b.name, "zh");
      return 0;
    });

    return result;
  }, [members, memberSearchQuery, memberSortBy]);

  return (
    <PageWrapper page="admin">
      <AdminPinLock>
        <PageHeader
          title="管理员控制台"
          subtitle="管理活动现场签到、查看与检索全社会员名册档案及修持积分"
        />

        {/* ── 3 大功能切换 Tabs ── */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-2xl bg-white/80 dark:bg-slate-800/80 p-1.5 shadow-sm border border-ocher/20 dark:border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab("check-in")}
              className={`flex items-center gap-2 rounded-xl px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                activeTab === "check-in"
                  ? "bg-golden-deep text-white shadow-md"
                  : "text-muted hover:text-charcoal dark:hover:text-white"
              }`}
            >
              <QrCode className="h-4 w-4" />
              <span>现场扫码签到</span>
            </button>

            <button
              onClick={() => setActiveTab("members")}
              className={`flex items-center gap-2 rounded-xl px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                activeTab === "members"
                  ? "bg-golden-deep text-white shadow-md"
                  : "text-muted hover:text-charcoal dark:hover:text-white"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>全体会员名册 ({members.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`flex items-center gap-2 rounded-xl px-4 sm:px-6 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                activeTab === "logs"
                  ? "bg-golden-deep text-white shadow-md"
                  : "text-muted hover:text-charcoal dark:hover:text-white"
              }`}
            >
              <History className="h-4 w-4" />
              <span>出勤签到日志</span>
            </button>
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            Tab 1: 现场扫码签到
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === "check-in" && (
          <div className="max-w-2xl mx-auto space-y-6">
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
                        <option value="">暂无活动（请先在 Events 中添加）</option>
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
                    <ManualLookup
                      members={members}
                      loading={loading}
                      onSelectMember={executeCheckInForMember}
                      onLookup={handleManualLookup}
                    />
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
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            Tab 2: 全体会员名册 (All Members Directory)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === "members" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* 统计指标卡 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-warm-white to-warm-cream p-4 border-2 border-golden-deep/20 shadow-sm flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-golden-deep/15 text-golden-rich">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted uppercase tracking-wider">总会员数</p>
                  <p className="text-2xl font-black font-mono text-charcoal">{stats.totalCount}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-warm-white to-warm-cream p-4 border-2 border-golden-deep/20 shadow-sm flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted uppercase tracking-wider">全社累计总积分</p>
                  <p className="text-2xl font-black font-mono text-amber-600">{stats.totalPoints.toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-warm-white to-warm-cream p-4 border-2 border-golden-deep/20 shadow-sm flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted uppercase tracking-wider">人均功德分</p>
                  <p className="text-2xl font-black font-mono text-emerald-600">{stats.avgPoints}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-warm-white to-warm-cream p-4 border-2 border-golden-deep/20 shadow-sm flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-muted uppercase tracking-wider">精进榜首</p>
                  <p className="text-base font-bold text-charcoal truncate">
                    {stats.topMember ? `${stats.topMember.name}` : "暂无"}
                  </p>
                  <p className="text-[10px] text-muted font-mono">
                    {stats.topMember ? `${stats.topMember.totalPoints} 积分` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* 搜索与排序工具栏 */}
            <Card>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    placeholder="按姓名、编号 (FXH...) 或邮箱搜索..."
                    className="w-full rounded-xl border border-ocher/40 bg-white/90 pl-10 pr-4 py-2.5 text-sm text-charcoal placeholder:text-muted/60 focus:border-golden-deep focus:outline-none focus:ring-2 focus:ring-golden-deep/20"
                  />
                  {memberSearchQuery && (
                    <button
                      onClick={() => setMemberSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <ArrowUpDown className="h-4 w-4 text-muted" />
                  <span className="text-xs text-muted font-medium">排序：</span>
                  <select
                    value={memberSortBy}
                    onChange={(e) => setMemberSortBy(e.target.value as any)}
                    className="rounded-xl border border-ocher/40 bg-white/90 px-3 py-2 text-xs font-bold text-charcoal focus:border-golden-deep focus:outline-none"
                  >
                    <option value="points-desc">积分从高到低 ⬇️</option>
                    <option value="points-asc">积分从低到高 ⬆️</option>
                    <option value="id-asc">按会员编号 (ID)</option>
                    <option value="name-asc">按姓名拼音</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* 会员卡片与表格列表 */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-charcoal">会员档案名册</h4>
                  <span className="rounded-full bg-golden-deep/10 px-2.5 py-0.5 text-xs font-bold text-golden-rich">
                    共 {filteredAndSortedMembers.length} 人
                  </span>
                </div>
              </div>

              {filteredAndSortedMembers.length === 0 ? (
                <div className="py-12 text-center text-muted">
                  <Users className="h-10 w-10 mx-auto mb-2 text-muted/50" />
                  <p className="text-sm font-medium">未找到符合条件的会员</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-ocher/20 text-muted text-xs">
                        <th className="pb-3 pr-4 font-bold uppercase">会员档案</th>
                        <th className="pb-3 pr-4 font-bold uppercase">会员编号</th>
                        <th className="pb-3 pr-4 font-bold uppercase">邮箱</th>
                        <th className="pb-3 pr-4 font-bold uppercase text-center">出勤 / 兑换</th>
                        <th className="pb-3 pr-4 font-bold uppercase text-right">累计积分</th>
                        <th className="pb-3 font-bold uppercase text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ocher/10">
                      {filteredAndSortedMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-golden-deep to-ocher-light text-white font-bold shadow-xs">
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-charcoal">{member.name}</p>
                                <p className="text-[11px] text-muted font-mono">{member.memberId}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 pr-4">
                            <span className="font-mono font-bold text-xs bg-golden-deep/10 text-golden-rich px-2.5 py-1 rounded-lg border border-golden-deep/20">
                              {member.memberId}
                            </span>
                          </td>

                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-1 text-xs text-muted">
                              <Mail className="h-3.5 w-3.5" />
                              <span>{member.email || "未绑定邮箱"}</span>
                            </div>
                          </td>

                          <td className="py-3.5 pr-4 text-center">
                            <div className="inline-flex items-center gap-2 text-xs font-mono">
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200" title="出勤次数">
                                {member._count?.attendances ?? 0} 出勤
                              </span>
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200" title="兑换次数">
                                {member._count?.redemptions ?? 0} 兑换
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 pr-4 text-right">
                            <span className="font-mono font-extrabold text-base text-golden-rich">
                              {member.totalPoints.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-muted ml-1">分</span>
                          </td>

                          <td className="py-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setDetailMemberId(member.id)}
                                className="px-2.5 py-1 rounded-lg border border-golden-deep/30 hover:bg-golden-deep/10 text-golden-rich font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <History className="h-3.5 w-3.5" />
                                <span>历史明细</span>
                              </button>

                              {selectedEvent && (
                                <button
                                  onClick={() => executeCheckInForMember(member)}
                                  className="px-2.5 py-1 rounded-lg bg-jade/10 hover:bg-jade/20 text-jade border border-jade/30 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                                  title={`为 ${member.name} 签到当前活动「${selectedEvent}」`}
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                  <span>签到</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            Tab 3: 出勤签到日志 (Attendance History Logs)
           ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === "logs" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-golden-rich" />
                  <h4 className="text-lg font-bold text-charcoal">全社会员出勤签到总日志</h4>
                </div>
                <span className="text-xs text-muted font-mono">共 {recentCheckIns.length} 条记录</span>
              </div>

              {recentCheckIns.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-ocher/20 text-muted text-xs">
                        <th className="pb-3 pr-4 font-semibold uppercase">签到会员</th>
                        <th className="pb-3 pr-4 font-semibold uppercase">活动名称</th>
                        <th className="pb-3 pr-4 font-semibold uppercase">签到时间</th>
                        <th className="pb-3 font-semibold uppercase text-right">获得积分</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ocher/10">
                      {recentCheckIns.map((log) => (
                        <tr key={log.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-3 pr-4">
                            <span className="font-bold text-charcoal">{log.member.name}</span>
                            <span className="ml-1.5 text-xs text-muted font-mono">({log.member.memberId})</span>
                          </td>
                          <td className="py-3 pr-4 text-charcoal font-medium">{log.eventName}</td>
                          <td className="py-3 pr-4 text-muted text-xs font-mono">
                            {new Date(log.dateTime).toLocaleString("zh-CN", { timeZone: "Asia/Kuala_Lumpur" })}
                          </td>
                          <td className="py-3 text-right">
                            <Badge variant="jade">+{log.pointsEarned}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted">暂无签到记录</p>
              )}
            </Card>
          </motion.div>
        )}

        {/* ── 扫码器弹窗 ── */}
        {showScanner && (
          <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
        )}

        {/* ── 会员详细历史档案弹窗 (Member Detail Modal) ── */}
        <AnimatePresence>
          {detailMemberId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.92, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.92, y: 20 }}
                className="w-full max-w-xl rounded-3xl bg-warm-white dark:bg-slate-900 p-6 sm:p-7 shadow-2xl border-2 border-golden-deep/30 text-charcoal dark:text-white max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-ocher/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-golden-deep text-white font-bold text-lg shadow-sm">
                      {memberDetail?.name ? memberDetail.name.charAt(0) : "🪷"}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-serif text-golden-rich">
                        {memberDetail?.name || "会员档案"}
                      </h3>
                      <p className="text-xs text-muted font-mono">{memberDetail?.memberId} · {memberDetail?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDetailMemberId(null)}
                    className="rounded-full p-2 text-muted hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {loadingDetail ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted text-xs">
                    <Loader2 className="h-6 w-6 animate-spin text-golden-rich" />
                    <span>正在加载会员历史档案...</span>
                  </div>
                ) : memberDetail ? (
                  <div className="mt-5 space-y-6">
                    {/* 积分统计卡 */}
                    <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                      <div>
                        <p className="text-[10px] text-muted font-serif">当前累计积分</p>
                        <p className="text-xl font-black font-mono text-golden-rich">{memberDetail.totalPoints}</p>
                      </div>
                      <div className="border-x border-amber-500/20">
                        <p className="text-[10px] text-muted font-serif">出勤总次数</p>
                        <p className="text-xl font-black font-mono text-emerald-600">{memberDetail.attendances?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted font-serif">法宝兑换数</p>
                        <p className="text-xl font-black font-mono text-purple-600">{memberDetail.redemptions?.length || 0}</p>
                      </div>
                    </div>

                    {/* 出勤历史记录 */}
                    <div>
                      <h4 className="font-bold text-xs text-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <CalendarCheck className="h-4 w-4 text-golden-rich" />
                        出勤签到明细 (最近 20 条)
                      </h4>
                      {memberDetail.attendances && memberDetail.attendances.length > 0 ? (
                        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                          {memberDetail.attendances.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-ocher/10 text-xs"
                            >
                              <div>
                                <p className="font-bold text-charcoal dark:text-white">{att.eventName}</p>
                                <p className="text-[10px] text-muted font-mono">
                                  {new Date(att.dateTime).toLocaleString("zh-CN")}
                                </p>
                              </div>
                              <Badge variant="jade">+{att.pointsEarned} 分</Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted py-4 text-center">暂无出勤记录</p>
                      )}
                    </div>

                    {/* 兑换历史记录 */}
                    <div>
                      <h4 className="font-bold text-xs text-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Gift className="h-4 w-4 text-golden-rich" />
                        法宝兑换记录 (最近 10 条)
                      </h4>
                      {memberDetail.redemptions && memberDetail.redemptions.length > 0 ? (
                        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                          {memberDetail.redemptions.map((red) => (
                            <div
                              key={red.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-ocher/10 text-xs"
                            >
                              <div>
                                <p className="font-bold text-charcoal dark:text-white">{red.reward?.name || "法宝结缘品"}</p>
                                <p className="text-[10px] text-muted font-mono">
                                  {new Date(red.createdAt).toLocaleString("zh-CN")}
                                </p>
                              </div>
                              <span className="font-mono font-bold text-amber-600 text-xs">
                                -{red.pointsSpent} 积分
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted py-4 text-center">暂无法宝兑换记录</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 签到成功 Spring 气泡 ── */}
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

function ManualLookup({
  members,
  loading = false,
  onSelectMember,
  onLookup,
}: {
  members: Member[];
  loading?: boolean;
  onSelectMember: (member: Member) => void;
  onLookup: (query: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return members
      .filter((m) => {
        const nameMatch = m.name.toLowerCase().includes(q);
        const idMatch = m.memberId.toLowerCase().includes(q);
        const emailMatch = m.email?.toLowerCase().includes(q);
        return nameMatch || idMatch || emailMatch;
      })
      .slice(0, 6);
  }, [query, members]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (member: Member) => {
    setQuery(`${member.name} (${member.memberId})`);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelectMember(member);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredMembers.length === 0) {
      if (e.key === "Enter" && query.trim()) {
        e.preventDefault();
        onLookup(query);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredMembers.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev <= 0 ? filteredMembers.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredMembers.length) {
        handleSelect(filteredMembers[selectedIndex]);
      } else if (query.trim()) {
        onLookup(query);
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-semibold text-charcoal">手动输入查找签到</label>
        {filteredMembers.length > 0 && isOpen && (
          <span className="text-[11px] font-medium text-golden-rich flex items-center gap-1">
            <Sparkles className="h-3 w-3 animate-pulse" />
            找到 {filteredMembers.length} 位匹配会员
          </span>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="输入会员编号 (如 FXH0001)、姓名或邮箱..."
          className="w-full rounded-xl border border-ocher/40 bg-white/90 px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/60 focus:border-golden-deep focus:outline-none focus:ring-2 focus:ring-golden-deep/20 shadow-xs"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal p-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && filteredMembers.length > 0 && (
        <ul className="absolute z-30 mt-1.5 max-h-60 w-full overflow-y-auto rounded-2xl border border-golden-deep/30 bg-warm-white/95 p-1.5 shadow-xl backdrop-blur-md">
          {filteredMembers.map((member, idx) => (
            <li
              key={member.id}
              onClick={() => handleSelect(member)}
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm transition-colors cursor-pointer ${
                selectedIndex === idx ? "bg-golden-deep/15 text-golden-rich" : "hover:bg-ocher-light/30 text-charcoal"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-golden-deep text-white text-xs font-bold">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <span className="font-bold">{member.name}</span>
                  <span className="ml-1.5 font-mono text-xs text-muted">({member.memberId})</span>
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-golden-rich">
                {member.totalPoints} 积分
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
