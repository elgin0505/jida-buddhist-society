import React from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { PageHeader } from "@/components/ui";
import { MemberCardSkeleton } from "./MemberCardSkeleton";

export default function DashboardLoading() {
  return (
    <PageWrapper page="dashboard">
      <PageHeader
        title="会员仪表板"
        subtitle="查看个人资料、修持境界、积分汇总与出勤记录"
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
        <MemberCardSkeleton />
      </div>
    </PageWrapper>
  );
}
