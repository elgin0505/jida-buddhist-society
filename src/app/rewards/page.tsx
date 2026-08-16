"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader, Badge, EmptyState } from "@/components/ui";
import { useMember, MemberSelector } from "@/components/MemberContext";

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
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/rewards")
      .then((res) => res.json())
      .then((data) => {
        setRewards(data);
        setLoading(false);
      });
  }, []);

  const handleRedeem = async (reward: Reward) => {
    if (!currentMember) return;

    setRedeeming(reward.id);
    setMessage(null);

    try {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: currentMember.id,
          rewardId: reward.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
      } else {
        setMessage({ type: "success", text: `成功兑换「${reward.name}」！` });
        await refreshMembers();
        const updated = await fetch("/api/rewards").then((r) => r.json());
        setRewards(updated);
      }
    } catch {
      setMessage({ type: "error", text: "兑换失败，请稍后重试" });
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-ocher-light/20" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="积分商城"
        subtitle="使用功德积分兑换精美奖品，回馈您的修行与参与"
        action={<MemberSelector />}
      />

      {currentMember && (
        <Card className="mb-6 flex items-center justify-between bg-gradient-to-r from-golden-deep/5 to-ocher-light/20">
          <div>
            <p className="text-sm text-muted">当前可用积分</p>
            <p className="text-3xl font-bold text-golden-rich">
              {currentMember.totalPoints}
            </p>
          </div>
          <UnalomeDecoration />
        </Card>
      )}

      {message && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-jade/10 text-jade"
              : "bg-carmine/10 text-carmine"
          }`}
        >
          {message.text}
        </div>
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((reward) => {
            const canAfford =
              currentMember &&
              currentMember.totalPoints >= reward.pointsRequired;
            const inStock = reward.stock > 0;

            return (
              <Card key={reward.id} hover className="flex flex-col">
                <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-ocher-light/40 to-warm-cream">
                  {reward.image ? (
                    <img
                      src={reward.image}
                      alt={reward.name}
                      className="h-full w-full rounded-xl object-cover"
                    />
                  ) : (
                    <RewardPlaceholderIcon />
                  )}
                </div>

                <h4 className="text-lg font-semibold text-charcoal">
                  {reward.name}
                </h4>

                {reward.description && (
                  <p className="mt-1 flex-1 text-sm leading-relaxed text-muted line-clamp-2">
                    {reward.description}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <Badge variant="golden">{reward.pointsRequired} 积分</Badge>
                  <span className="text-xs text-muted">
                    库存 {reward.stock}
                  </span>
                </div>

                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={
                    !canAfford || !inStock || redeeming === reward.id
                  }
                  className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
                    canAfford && inStock
                      ? "btn-primary"
                      : "cursor-not-allowed bg-ocher-light/30 text-muted"
                  }`}
                >
                  {redeeming === reward.id
                    ? "兑换中..."
                    : !inStock
                      ? "已兑完"
                      : !canAfford
                        ? "积分不足"
                        : "立即兑换"}
                </button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RewardPlaceholderIcon() {
  return (
    <svg className="h-16 w-16 text-golden-deep/30" viewBox="0 0 64 64" fill="none">
      <path
        d="M32 56c-8-4-14-10-14-18 0 0 6-4 14-4s14 4 14 4c0 8-6 14-14 18z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M32 30c-4-2-7-6-7-11S28 12 32 12s7 4 7 7-3 9-7 11z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="32" cy="8" r="3" fill="currentColor" opacity="0.4" />
    </svg>
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
