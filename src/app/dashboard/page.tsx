"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Card,
  StatCard,
  PageHeader,
  Badge,
  MemberAvatar,
  EmptyState,
} from "@/components/ui";
import { useMember, MemberSelector } from "@/components/MemberContext";
import { PageWrapper } from "@/components/PageWrapper";
import { Leaderboard } from "@/components/Leaderboard";
import { motion, AnimatePresence } from "framer-motion";

interface AttendanceRecord {
  id: string;
  dateTime: string;
  eventName: string;
  pointsEarned: number;
}

interface MemberDetail {
  attendances: AttendanceRecord[];
  redemptions: {
    id: string;
    pointsSpent: number;
    createdAt: string;
    reward: { name: string };
  }[];
}

export default function DashboardPage() {
  const { currentMember, members, loading, refreshMembers } = useMember();
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "leaderboard">("history");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentMember) return;

    fetch(`/api/members/${currentMember.id}`)
      .then((res) => res.json())
      .then(setDetail);

    fetch(`/api/qrcode?memberId=${currentMember.memberId}`)
      .then((res) => res.json())
      .then((data) => setQrCode(data.qrDataUrl));
  }, [currentMember]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentMember) return;

    if (!file.type.startsWith("image/")) {
      setUploadMsg("请上传图片文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadMsg("图片大小不能超过 5MB");
      return;
    }

    setUploading(true);
    setUploadMsg(null);
    const form = new FormData();
    form.append("avatar", file);

    try {
      const res = await fetch(`/api/members/${currentMember.id}/avatar`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (res.ok) {
        await refreshMembers();
        setUploadMsg("头像已更新！");
      } else {
        setUploadMsg(data.error || "上传失败");
      }
    } catch {
      setUploadMsg("上传失败，请稍后重试");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <PageWrapper page="dashboard">
        <div className="space-y-6">
          <div className="h-10 w-64 animate-pulse rounded-xl bg-ocher-light/30" />
          <div className="h-48 animate-pulse rounded-2xl bg-ocher-light/20" />
        </div>
      </PageWrapper>
    );
  }

  if (!currentMember) {
    return (
      <PageWrapper page="dashboard">
        <EmptyState
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          title="暂无会员数据"
          description="请先添加会员或运行数据库种子脚本"
        />
      </PageWrapper>
    );
  }

  const attendanceCount = detail?.attendances.length ?? 0;
  const redemptionCount = detail?.redemptions.length ?? 0;

  return (
    <PageWrapper page="dashboard">
      <PageHeader
        title="会员仪表板"
        subtitle="查看个人资料、积分汇总与出勤记录"
        action={<MemberSelector />}
      />

      {/* 会员信息卡 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Card className="relative mb-8 overflow-hidden">
          <div className="absolute -right-8 -top-8 h-40 w-40 opacity-[0.05]">
            <Image src="/logo.png" alt="" fill className="object-contain" />
          </div>

          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* 头像 + 上传按钮 */}
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <MemberAvatar
                name={currentMember.name}
                photo={currentMember.photo}
                size="lg"
              />
              {/* 相机悬浮层 */}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-charcoal/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {uploading ? (
                  <svg className="h-6 w-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-2xl font-bold text-charcoal">
                {currentMember.name}
              </h3>
              <p className="mt-1 text-sm text-muted">{currentMember.email}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge variant="golden">{currentMember.memberId}</Badge>
                <Badge variant="jade">活跃会员</Badge>
              </div>
              <AnimatePresence>
                {uploadMsg && (
                  <motion.p
                    key="upload-msg"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 text-xs text-jade font-medium"
                  >
                    {uploadMsg}
                  </motion.p>
                )}
              </AnimatePresence>
              <p className="mt-1 text-[10px] text-muted/60">点击头像更换照片</p>
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-muted">总积分</p>
              <motion.p
                key={currentMember.totalPoints}
                initial={{ scale: 1.2, color: "#2d6a4f" }}
                animate={{ scale: 1, color: "#b8860b" }}
                transition={{ duration: 0.4 }}
                className="text-5xl font-bold tracking-tight"
              >
                {currentMember.totalPoints}
              </motion.p>
              <p className="mt-1 text-xs text-muted">功德积分</p>
            </div>

            {qrCode && (
              <div className="flex flex-col items-center">
                <img
                  src={qrCode}
                  alt="会员二维码"
                  className="h-28 w-28 rounded-xl ring-2 ring-ocher/30"
                />
                <p className="mt-2 text-[10px] text-muted">签到二维码</p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* 统计卡 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
        className="mb-8 grid gap-4 sm:grid-cols-3"
      >
        <StatCard
          label="总积分"
          value={currentMember.totalPoints}
          accent="golden"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          }
        />
        <StatCard
          label="出勤次数"
          value={attendanceCount}
          accent="jade"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />
        <StatCard
          label="兑换次数"
          value={redemptionCount}
          accent="sapphire"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 12v8H4v-8M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
            </svg>
          }
        />
      </motion.div>

      {/* 视图切换 Tabs: 个人记录 vs 精进功德榜 */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-2xl bg-white/70 p-1.5 shadow-sm border border-ocher/20 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              activeTab === "history"
                ? "bg-golden-deep text-white shadow-md"
                : "text-muted hover:text-charcoal"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            个人出勤与兑换
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
              activeTab === "leaderboard"
                ? "bg-golden-deep text-white shadow-md"
                : "text-muted hover:text-charcoal"
            }`}
          >
            <span>🏆</span>
            精进功德榜
          </button>
        </div>
      </div>

      {/* 切换展示区域 */}
      <AnimatePresence mode="wait">
        {activeTab === "history" ? (
          <motion.div
            key="history-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid gap-6 lg:grid-cols-2"
          >
            <Card>
              <h4 className="mb-4 text-lg font-semibold text-charcoal">最近出勤记录</h4>
              {detail?.attendances.length ? (
                <div className="space-y-3">
                  {detail.attendances.map((record, i) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between rounded-xl bg-warm-cream/50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-charcoal">{record.eventName}</p>
                        <p className="text-xs text-muted">{new Date(record.dateTime).toLocaleString("zh-CN")}</p>
                      </div>
                      <Badge variant="jade">+{record.pointsEarned}</Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted">暂无出勤记录</p>
              )}
            </Card>

            <Card>
              <h4 className="mb-4 text-lg font-semibold text-charcoal">兑换历史</h4>
              {detail?.redemptions.length ? (
                <div className="space-y-3">
                  {detail.redemptions.map((record, i) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between rounded-xl bg-warm-cream/50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-charcoal">{record.reward.name}</p>
                        <p className="text-xs text-muted">{new Date(record.createdAt).toLocaleString("zh-CN")}</p>
                      </div>
                      <Badge variant="carmine">-{record.pointsSpent}</Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted">暂无兑换记录</p>
              )}
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="leaderboard-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <Leaderboard members={members} currentMemberId={currentMember?.id} />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
