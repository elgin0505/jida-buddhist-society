"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card3D } from "./Card3D";
import { GoldShimmerBorder } from "./GoldShimmerBorder";
import { Badge } from "./ui";

interface Reward {
  id: string;
  name: string;
  pointsRequired: number;
  image: string | null;
  description: string | null;
  stock: number;
}

interface RewardsStoreProps {
  rewards: Reward[];
  userPoints: number;
  onRedeem: (reward: Reward) => Promise<void>;
}

export function RewardsStore({ rewards, userPoints, onRedeem }: RewardsStoreProps) {
  // 自动分级逻辑
  const tiers = useMemo(() => {
    const tier1 = rewards.filter(r => r.pointsRequired <= 50);
    const tier2 = rewards.filter(r => r.pointsRequired > 50 && r.pointsRequired <= 200);
    const tier3 = rewards.filter(r => r.pointsRequired > 200);
    return [
      { id: 'tier1', title: '日常结缘', items: tier1 },
      { id: 'tier2', title: '精进修行', items: tier2 },
      { id: 'tier3', title: '圆满大赏', items: tier3 }
    ].filter(t => t.items.length > 0);
  }, [rewards]);

  return (
    <div className="space-y-16 mt-8">
      {tiers.map((tier, tierIdx) => (
        <section key={tier.id}>
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-golden-rich animate-pulse shadow-[0_0_8px_rgba(201,162,39,0.6)]" />
            <h2 className="text-2xl font-bold text-charcoal dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-golden-deep to-ocher-light">{tier.title}</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-golden-rich/30 to-transparent" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tier.items.map((reward, i) => (
              <RewardCard 
                key={reward.id} 
                reward={reward} 
                userPoints={userPoints} 
                onRedeem={onRedeem} 
                isHighestTier={tier.id === 'tier3'}
                delay={i * 0.1 + tierIdx * 0.2}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function RewardCard({ reward, userPoints, onRedeem, isHighestTier, delay }: { reward: Reward; userPoints: number; onRedeem: (reward: Reward) => Promise<void>; isHighestTier: boolean; delay: number }) {
  const [redeeming, setRedeeming] = useState(false);
  const canAfford = userPoints >= reward.pointsRequired;
  const inStock = reward.stock > 0;
  
  const handleRedeem = async () => {
    if (!canAfford || !inStock) return;
    setRedeeming(true);
    try {
      await onRedeem(reward);
      toast.success(`成功兑换「${reward.name}」！`, {
        description: "功德无量，请前往学会领取结缘品。",
        icon: "🪷",
      });
    } catch (e) {
      toast.error("兑换失败", { description: "请稍后重试或联系管理员。" });
    } finally {
      setRedeeming(false);
    }
  };

  const progressPercentage = Math.min(100, Math.max(0, (userPoints / reward.pointsRequired) * 100));

  const CardContent = (
    <div className="flex flex-col h-full bg-gradient-to-br from-warm-white/95 via-warm-cream/90 to-ocher-light/40 backdrop-blur-md rounded-[22px] p-5 shadow-sm border-2 border-golden-deep/30">
      <div className="mb-4 flex h-40 items-center justify-center rounded-xl bg-gradient-to-br from-ocher-light/30 to-warm-cream overflow-hidden border border-ocher/20">
        {reward.image ? (
          <img
            src={reward.image}
            alt={reward.name}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
          />
        ) : (
          <RewardPlaceholderIcon />
        )}
      </div>

      <div className="flex-1">
        <h4 className="text-lg font-bold text-charcoal">{reward.name}</h4>
        {reward.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted line-clamp-2">
            {reward.description}
          </p>
        )}
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="golden">{reward.pointsRequired} 积分</Badge>
          <span className="text-xs font-semibold text-muted">库存 {reward.stock}</span>
        </div>
        
        {/* 智能进度条与互动按钮 */}
        <div className="pt-2 border-t border-ocher/20">
          {!canAfford ? (
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-bold text-muted">
                <span>当前: {userPoints}</span>
                <span>还差: {reward.pointsRequired - userPoints}</span>
              </div>
              <div className="h-2.5 w-full bg-ocher-light/40 rounded-full overflow-hidden shadow-inner border border-ocher/30">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-golden-deep to-golden-rich rounded-full"
                />
              </div>
              <button disabled className="mt-2 w-full rounded-xl py-2.5 text-sm font-bold bg-ocher-light/30 text-muted/70 cursor-not-allowed transition-all border border-ocher/20">
                积分不足
              </button>
            </div>
          ) : !inStock ? (
             <button disabled className="mt-2 w-full rounded-xl py-2.5 text-sm font-bold bg-ocher-light/30 text-muted/70 cursor-not-allowed transition-all border border-ocher/20">
                已兑完
              </button>
          ) : (
            <div className="space-y-2">
               <div className="h-2.5 w-full bg-golden-rich rounded-full overflow-hidden shadow-[0_0_8px_rgba(201,162,39,0.4)]" />
               <motion.button
                 whileHover={{ scale: 1.02 }}
                 whileTap={{ scale: 0.97 }}
                 onClick={handleRedeem}
                 disabled={redeeming}
                 className="mt-2 w-full rounded-xl py-2.5 text-sm font-bold btn-primary shadow-lg shadow-golden-deep/20 relative overflow-hidden group"
               >
                 <span className="relative z-10">{redeeming ? "兑换中..." : "立即兑换"}</span>
                 {/* 呼吸发光动画 (Pulse effect) */}
                 <motion.div 
                   animate={{ opacity: [0, 0.4, 0] }}
                   transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                   className="absolute inset-0 bg-white/30 z-0 pointer-events-none"
                 />
               </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 100 }}
      className="h-full"
    >
      <Card3D intensity={12} className="h-full">
        {isHighestTier ? (
          <GoldShimmerBorder glowOpacity={0.6} className="h-full">
            {CardContent}
          </GoldShimmerBorder>
        ) : (
          CardContent
        )}
      </Card3D>
    </motion.div>
  );
}

function RewardPlaceholderIcon() {
  return (
    <svg className="h-16 w-16 text-golden-deep/20" viewBox="0 0 64 64" fill="none">
      <path d="M32 56c-8-4-14-10-14-18 0 0 6-4 14-4s14 4 14 4c0 8-6 14-14 18z" stroke="currentColor" strokeWidth="2" />
      <path d="M32 30c-4-2-7-6-7-11S28 12 32 12s7 4 7 7-3 9-7 11z" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="8" r="3" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
