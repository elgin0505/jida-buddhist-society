"use client";

import { useEffect, useState } from "react";
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
  const { currentMember, loading } = useMember();
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    if (!currentMember) return;

    fetch(`/api/members/${currentMember.id}`)
      .then((res) => res.json())
      .then(setDetail);

    fetch(`/api/qrcode?memberId=${currentMember.memberId}`)
      .then((res) => res.json())
      .then((data) => setQrCode(data.qrDataUrl));
  }, [currentMember]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-ocher-light/30" />
        <div className="h-48 animate-pulse rounded-2xl bg-ocher-light/20" />
      </div>
    );
  }

  if (!currentMember) {
    return (
      <EmptyState
        icon={
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
        title="暂无会员数据"
        description="请先添加会员或运行数据库种子脚本"
      />
    );
  }

  const attendanceCount = detail?.attendances.length ?? 0;
  const redemptionCount = detail?.redemptions.length ?? 0;

  return (
    <div>
      <PageHeader
        title="会员仪表板"
        subtitle="查看个人资料、积分汇总与出勤记录"
        action={<MemberSelector />}
      />

      <Card className="relative mb-8 overflow-hidden">
        <div className="absolute -right-8 -top-8 h-40 w-40 opacity-[0.06]">
          <Image src="/logo.png" alt="" fill className="object-contain" />
        </div>

        <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <MemberAvatar
            name={currentMember.name}
            photo={currentMember.photo}
            size="lg"
          />

          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-2xl font-bold text-charcoal">
              {currentMember.name}
            </h3>
            <p className="mt-1 text-sm text-muted">{currentMember.email}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Badge variant="golden">{currentMember.memberId}</Badge>
              <Badge variant="jade">活跃会员</Badge>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-muted">总积分</p>
            <p className="text-5xl font-bold tracking-tight text-golden-rich">
              {currentMember.totalPoints}
            </p>
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

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h4 className="mb-4 text-lg font-semibold text-charcoal">
            最近出勤记录
          </h4>
          {detail?.attendances.length ? (
            <div className="space-y-3">
              {detail.attendances.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-xl bg-warm-cream/50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-charcoal">
                      {record.eventName}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(record.dateTime).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <Badge variant="jade">+{record.pointsEarned}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted">暂无出勤记录</p>
          )}
        </Card>

        <Card>
          <h4 className="mb-4 text-lg font-semibold text-charcoal">
            兑换历史
          </h4>
          {detail?.redemptions.length ? (
            <div className="space-y-3">
              {detail.redemptions.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-xl bg-warm-cream/50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-charcoal">
                      {record.reward.name}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(record.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <Badge variant="carmine">-{record.pointsSpent}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted">暂无兑换记录</p>
          )}
        </Card>
      </div>
    </div>
  );
}
