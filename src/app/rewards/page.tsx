"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader, EmptyState } from "@/components/ui";
import { useMember, MemberSelector } from "@/components/MemberContext";
import { PageWrapper } from "@/components/PageWrapper";
import { LotusLoading } from "@/components/LotusLoading";
import { motion } from "framer-motion";
import { RewardsStore } from "@/components/RewardsStore";

interface Reward {
  id: string;
  name: string;
  pointsRequired: number;
  image: string | null;
  description: string | null;
  stock: number;
}

export default function RewardsPage() {
  const { currentMember, refreshMembers } = useMember();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rewards")
      .then((res) => res.json())
      .then((data) => {
        setRewards(data);
        setLoading(false);
      });
  }, []);

  const handleRedeem = async (reward: Reward) => {
    if (!currentMember) throw new Error("您尚未登录或选择身份");

    const res = await fetch("/api/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: currentMember.id, rewardId: reward.id }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "兑换失败，请稍后重试");
    }

    await refreshMembers();
    const updated = await fetch("/api/rewards").then((r) => r.json());
    setRewards(updated);
  };

  if (loading) {
    return (
      <PageWrapper page="rewards">
        <LotusLoading text="福慧增长 · 正在加载积分商城与结缘品..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper page="rewards">
      <PageHeader
        title="积分商城"
        subtitle="使用功德积分兑换精美奖品，回馈您的修行与参与"
        action={<MemberSelector />}
      />

      {currentMember && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="mb-6 flex items-center justify-between bg-gradient-to-r from-warm-white/95 via-warm-cream/90 to-ocher-light/40 border-2 border-golden-deep/35 shadow-md">
            <div>
              <p className="text-xs font-bold text-golden-rich uppercase tracking-wider">当前可用积分</p>
              <motion.p
                key={currentMember.totalPoints}
                initial={{ scale: 1.15, color: "#2d6a4f" }}
                animate={{ scale: 1, color: "#b8860b" }}
                transition={{ duration: 0.4 }}
                className="text-4xl font-extrabold text-golden-rich mt-1"
              >
                {currentMember.totalPoints}
              </motion.p>
            </div>
            <UnalomeDecoration />
          </Card>
        </motion.div>
      )}

      {rewards.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 12v8H4v-8M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
            </svg>
          }
          title="暂无奖品"
          description="积分商城正在筹备中，精彩奖品即将上架"
        />
      ) : (
        <RewardsStore 
          rewards={rewards}
          userPoints={currentMember?.totalPoints || 0}
          onRedeem={handleRedeem}
        />
      )}
    </PageWrapper>
  );
}

function UnalomeDecoration() {
  return (
    <svg className="h-12 w-12 text-golden-deep/20" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M24 42V28c0-4 4-6 4-10 0-3-2-5-4-6-2 1-4 3-4 6 0 4 4 6 4 10v14" />
      <path d="M24 8c-2 0-4 1.5-4 3.5" />
      <circle cx="24" cy="6" r="2" fill="currentColor" />
    </svg>
  );
}
