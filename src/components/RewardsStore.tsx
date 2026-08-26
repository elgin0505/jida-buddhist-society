"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Card3D } from "./Card3D";
import { GoldShimmerBorder } from "./GoldShimmerBorder";
import { Badge } from "./ui";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  X,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";

export interface Reward {
  id: string;
  name: string;
  pointsRequired: number;
  image: string | null;
  description: string | null;
  stock: number;
}

export interface CartItem {
  reward: Reward;
  quantity: number;
}

interface RewardsStoreProps {
  rewards: Reward[];
  userPoints: number;
  onRedeem: (reward: Reward, quantity: number) => Promise<void>;
  onBatchRedeem?: (items: Array<{ rewardId: string; quantity: number }>) => Promise<void>;
}

export function RewardsStore({
  rewards,
  userPoints,
  onRedeem,
  onBatchRedeem,
}: RewardsStoreProps) {
  // 选中的批量结缘物品清单 (Multi-select Cart)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 单品快速结缘弹窗 (Quick Single Item Modal)
  const [selectedRewardModal, setSelectedRewardModal] = useState<Reward | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // 自动分级逻辑
  const tiers = useMemo(() => {
    const tier1 = rewards.filter((r) => r.pointsRequired <= 50);
    const tier2 = rewards.filter((r) => r.pointsRequired > 50 && r.pointsRequired <= 200);
    const tier3 = rewards.filter((r) => r.pointsRequired > 200);
    return [
      { id: "tier1", title: "日常结缘", items: tier1 },
      { id: "tier2", title: "精进修行", items: tier2 },
      { id: "tier3", title: "圆满大赏", items: tier3 },
    ].filter((t) => t.items.length > 0);
  }, [rewards]);

  // 计算多选福袋的总件数与总积分
  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const totalCartPoints = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.reward.pointsRequired * item.quantity,
      0
    );
  }, [cart]);

  // 添加或修改福袋中的物品数量
  const addToCart = (reward: Reward, quantity = 1) => {
    if (reward.stock <= 0) {
      toast.error("该法宝已结缘完毕，暂无库存");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((it) => it.reward.id === reward.id);
      if (existing) {
        const nextQty = Math.min(reward.stock, existing.quantity + quantity);
        return prev.map((it) =>
          it.reward.id === reward.id ? { ...it, quantity: nextQty } : it
        );
      } else {
        return [...prev, { reward, quantity: Math.min(reward.stock, quantity) }];
      }
    });

    toast.success(`已将「${reward.name}」加入结缘福袋`, {
      description: "可点击右下角福袋随时调整数量或批量结缘。",
      icon: "🪷",
    });
  };

  const updateCartQuantity = (rewardId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((it) => {
          if (it.reward.id === rewardId) {
            const nextQty = it.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > it.reward.stock) {
              toast.warning(`「${it.reward.name}」已达最大库存上限 (${it.reward.stock}件)`);
              return it;
            }
            return { ...it, quantity: nextQty };
          }
          return it;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (rewardId: string) => {
    setCart((prev) => prev.filter((it) => it.reward.id !== rewardId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // 执行单品兑换
  const handleSingleRedeemConfirm = async () => {
    if (!selectedRewardModal) return;
    const requiredTotal = selectedRewardModal.pointsRequired * modalQuantity;

    if (userPoints < requiredTotal) {
      toast.error("积分不足", {
        description: `共需 ${requiredTotal} 积分，当前拥有 ${userPoints} 积分。`,
      });
      return;
    }

    if (modalQuantity > selectedRewardModal.stock) {
      toast.error("库存不足", {
        description: `当前库存仅剩 ${selectedRewardModal.stock} 件。`,
      });
      return;
    }

    setModalSubmitting(true);
    try {
      await onRedeem(selectedRewardModal, modalQuantity);
      toast.success(`成功兑换「${selectedRewardModal.name}」 × ${modalQuantity}！`, {
        description: "功德无量，请前往学会领取结缘品，库存与积分已自动扣减。",
        icon: "🪷",
      });
      setSelectedRewardModal(null);
    } catch (e: any) {
      toast.error("兑换失败", { description: e?.message || "请稍后重试。" });
    } finally {
      setModalSubmitting(false);
    }
  };

  // 执行批量多选兑换
  const handleBatchRedeemConfirm = async () => {
    if (cart.length === 0) return;

    if (userPoints < totalCartPoints) {
      toast.error("积分不足", {
        description: `福袋总需 ${totalCartPoints} 积分，当前仅拥有 ${userPoints} 积分。`,
      });
      return;
    }

    setBatchSubmitting(true);
    try {
      if (onBatchRedeem) {
        await onBatchRedeem(
          cart.map((c) => ({ rewardId: c.reward.id, quantity: c.quantity }))
        );
      } else {
        for (const item of cart) {
          await onRedeem(item.reward, item.quantity);
        }
      }

      toast.success(`成功批量兑换 ${cart.length} 种法宝（共 ${totalCartCount} 件）！`, {
        description: `共消耗 ${totalCartPoints} 积分，各法宝库存已自动扣除并同步至云端表格。`,
        icon: "🪷",
      });
      setCart([]);
      setIsDrawerOpen(false);
    } catch (e: any) {
      toast.error("批量兑换失败", { description: e?.message || "请稍后重试。" });
    } finally {
      setBatchSubmitting(false);
    }
  };

  return (
    <div className="space-y-16 mt-8 relative">
      {/* ── 各级法宝商品展示 ── */}
      {tiers.map((tier, tierIdx) => (
        <section key={tier.id}>
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-golden-rich animate-pulse shadow-[0_0_8px_rgba(201,162,39,0.6)]" />
            <h2 className="text-2xl font-bold text-charcoal dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-golden-deep to-ocher-light">
              {tier.title}
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-golden-rich/30 to-transparent" />
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tier.items.map((reward, i) => {
              const inCartItem = cart.find((it) => it.reward.id === reward.id);
              return (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  userPoints={userPoints}
                  inCartQuantity={inCartItem ? inCartItem.quantity : 0}
                  onOpenModal={() => {
                    setSelectedRewardModal(reward);
                    setModalQuantity(1);
                  }}
                  onAddToCart={() => addToCart(reward, 1)}
                  isHighestTier={tier.id === "tier3"}
                  delay={i * 0.08 + tierIdx * 0.15}
                />
              );
            })}
          </div>
        </section>
      ))}

      {/* ── 悬浮多选结缘福袋按钮 (Floating Cart Trigger) ── */}
      {cart.length > 0 && (
        <motion.div
          initial={{ scale: 0, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: 50 }}
          className="fixed bottom-6 right-6 z-40"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-6 py-3.5 text-stone-950 font-bold shadow-[0_10px_30px_rgba(217,119,6,0.45)] border-2 border-amber-300 ring-4 ring-amber-400/20 backdrop-blur-md cursor-pointer group"
          >
            <div className="relative">
              <ShoppingBag className="h-6 w-6" />
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-md">
                {totalCartCount}
              </span>
            </div>
            <div className="text-left leading-tight">
              <p className="text-xs font-serif">结缘福袋 · 多选清单</p>
              <p className="text-sm font-black font-mono">共需 {totalCartPoints} 积分</p>
            </div>
          </motion.button>
        </motion.div>
      )}

      {/* ── 单品数量加减与快速兑换弹窗 ── */}
      <AnimatePresence>
        {selectedRewardModal && (
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
              className="w-full max-w-md rounded-3xl bg-gradient-to-b from-warm-white via-warm-cream to-ocher-light/30 dark:from-slate-900 dark:to-slate-800 p-6 sm:p-7 shadow-2xl border-2 border-golden-deep/30 text-charcoal dark:text-white"
            >
              {/* 弹窗头部 */}
              <div className="flex items-center justify-between border-b border-ocher/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🪷</span>
                  <h3 className="text-lg font-bold font-serif text-golden-rich">
                    结缘法宝 · 数量选择
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedRewardModal(null)}
                  className="rounded-full p-1.5 text-muted hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 法宝信息预览 */}
              <div className="my-4 flex items-center gap-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 p-3 border border-ocher/20">
                <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-ocher-light/20 flex items-center justify-center border border-ocher/20">
                  {selectedRewardModal.image ? (
                    <img
                      src={selectedRewardModal.image}
                      alt={selectedRewardModal.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">🎁</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm truncate">{selectedRewardModal.name}</h4>
                  <p className="text-xs text-golden-deep font-bold font-mono mt-0.5">
                    {selectedRewardModal.pointsRequired} 积分 / 件
                  </p>
                  <p className="text-[11px] text-muted">当前库存: {selectedRewardModal.stock} 件</p>
                </div>
              </div>

              {/* 数量调节 Stepper */}
              <div className="my-6 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 p-4 border border-amber-500/20 text-center">
                <p className="text-xs font-serif text-muted mb-3">选择兑换数量 (自由多选)</p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                    disabled={modalQuantity <= 1}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-slate-700 shadow-md hover:bg-amber-100 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed border border-ocher/30 transition-all cursor-pointer"
                  >
                    <Minus className="h-5 w-5 text-charcoal dark:text-white" />
                  </button>

                  <div className="flex flex-col items-center min-w-[70px]">
                    <span className="text-3xl font-black font-mono text-golden-rich">
                      {modalQuantity}
                    </span>
                    <span className="text-[10px] text-muted">件</span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setModalQuantity((q) => Math.min(selectedRewardModal.stock, q + 1))
                    }
                    disabled={modalQuantity >= selectedRewardModal.stock}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-slate-700 shadow-md hover:bg-amber-100 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed border border-ocher/30 transition-all cursor-pointer"
                  >
                    <Plus className="h-5 w-5 text-charcoal dark:text-white" />
                  </button>
                </div>

                {/* 动态计算总需积分 */}
                <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs font-serif px-2">
                  <span className="text-muted">总计需消耗：</span>
                  <span className="text-lg font-black font-mono text-golden-rich">
                    {selectedRewardModal.pointsRequired * modalQuantity} 积分
                  </span>
                </div>
              </div>

              {/* 积分余量对比 */}
              <div className="mb-6 flex items-center justify-between text-xs px-2">
                <span className="text-muted">当前可用积分: {userPoints}</span>
                <span
                  className={
                    userPoints >= selectedRewardModal.pointsRequired * modalQuantity
                      ? "text-emerald-600 dark:text-emerald-400 font-bold"
                      : "text-red-500 font-bold"
                  }
                >
                  兑换后剩余: {userPoints - selectedRewardModal.pointsRequired * modalQuantity}
                </span>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    addToCart(selectedRewardModal, modalQuantity);
                    setSelectedRewardModal(null);
                  }}
                  className="px-4 py-3 rounded-xl border border-golden-deep/40 hover:bg-golden-deep/10 text-golden-rich font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>入福袋</span>
                </button>

                <button
                  type="button"
                  onClick={handleSingleRedeemConfirm}
                  disabled={
                    modalSubmitting ||
                    userPoints < selectedRewardModal.pointsRequired * modalQuantity ||
                    selectedRewardModal.stock <= 0
                  }
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-golden-deep to-golden-rich text-white font-bold text-sm shadow-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {modalSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>正在扣减库存并结缘...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        确认兑换 ({selectedRewardModal.pointsRequired * modalQuantity} 积分)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 结缘福袋 (多选批量兑换抽屉 / Modal) ── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="h-full w-full max-w-md bg-warm-white dark:bg-slate-900 p-6 shadow-2xl flex flex-col justify-between border-l border-ocher/30 text-charcoal dark:text-white"
            >
              {/* 福袋头部 */}
              <div>
                <div className="flex items-center justify-between border-b border-ocher/20 pb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-6 w-6 text-golden-rich" />
                    <h3 className="text-xl font-bold font-serif text-golden-rich">
                      结缘福袋 · 多选清册
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="rounded-full p-2 text-muted hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between py-3 text-xs text-muted">
                  <span>已选择 {cart.length} 种法宝（共 {totalCartCount} 件）</span>
                  <button
                    onClick={clearCart}
                    className="text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    清空福袋
                  </button>
                </div>

                {/* 物品列表 */}
                <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.reward.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 dark:bg-slate-800/70 p-3 border border-ocher/20 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-ocher-light/20 flex items-center justify-center border border-ocher/20">
                          {item.reward.image ? (
                            <img
                              src={item.reward.image}
                              alt={item.reward.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xl">🎁</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs truncate">{item.reward.name}</h4>
                          <p className="text-[11px] text-golden-deep font-mono">
                            {item.reward.pointsRequired} 积分 × {item.quantity} ={" "}
                            <span className="font-bold">
                              {item.reward.pointsRequired * item.quantity}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* 数量 Stepper */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.reward.id, -1)}
                          className="h-7 w-7 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-amber-100 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-mono font-bold text-sm w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.reward.id, 1)}
                          disabled={item.quantity >= item.reward.stock}
                          className="h-7 w-7 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-amber-100 disabled:opacity-40 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 福袋结算区域 */}
              <div className="border-t border-ocher/20 pt-4 space-y-4">
                <div className="rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 p-4 border border-amber-500/20 space-y-2">
                  <div className="flex justify-between text-xs text-muted">
                    <span>当前拥有积分:</span>
                    <span className="font-mono font-bold">{userPoints}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>福袋总需消耗:</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      - {totalCartPoints}
                    </span>
                  </div>
                  <div className="h-px bg-amber-500/20 my-1" />
                  <div className="flex justify-between text-sm font-bold">
                    <span>兑换后结余:</span>
                    <span
                      className={
                        userPoints >= totalCartPoints
                          ? "text-emerald-600 dark:text-emerald-400 font-mono"
                          : "text-red-500 font-mono"
                      }
                    >
                      {userPoints - totalCartPoints} 积分
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleBatchRedeemConfirm}
                  disabled={batchSubmitting || userPoints < totalCartPoints || cart.length === 0}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-golden-deep to-golden-rich text-white font-bold text-sm shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {batchSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>正在处理批量结缘并同步云端表格...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        一键结缘所选法宝 (共 {totalCartCount} 件 · {totalCartPoints} 积分)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 单个法宝卡片组件 ──
function RewardCard({
  reward,
  userPoints,
  inCartQuantity,
  onOpenModal,
  onAddToCart,
  isHighestTier,
  delay,
}: {
  reward: Reward;
  userPoints: number;
  inCartQuantity: number;
  onOpenModal: () => void;
  onAddToCart: () => void;
  isHighestTier: boolean;
  delay: number;
}) {
  const [imageError, setImageError] = useState(false);
  const canAfford = userPoints >= reward.pointsRequired;
  const inStock = reward.stock > 0;
  const progressPercentage = Math.min(
    100,
    Math.max(0, (userPoints / reward.pointsRequired) * 100)
  );

  const CardContent = (
    <div className="flex flex-col h-full bg-gradient-to-br from-warm-white/95 via-warm-cream/90 to-ocher-light/40 backdrop-blur-md rounded-[22px] p-5 shadow-sm border-2 border-golden-deep/30 relative">
      {/* 已加入福袋徽章 */}
      {inCartQuantity > 0 && (
        <span className="absolute top-3 right-3 z-10 px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-bold text-[10px] shadow-sm font-mono flex items-center gap-1">
          <span>福袋 ×</span>
          <span>{inCartQuantity}</span>
        </span>
      )}

      {/* 法宝图片 */}
      <div className="mb-4 flex h-40 items-center justify-center rounded-xl bg-gradient-to-br from-ocher-light/30 to-warm-cream overflow-hidden border border-ocher/20">
        {reward.image && !imageError ? (
          <img
            src={reward.image}
            alt={reward.name}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <RewardPlaceholderIcon />
        )}
      </div>

      {/* 描述与名称 */}
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
          <Badge variant="golden">{reward.pointsRequired} 积分 / 件</Badge>
          <span
            className={`text-xs font-semibold ${
              reward.stock <= 3 ? "text-red-500 font-bold" : "text-muted"
            }`}
          >
            {reward.stock <= 0 ? "已兑完" : `库存 ${reward.stock} 件`}
          </span>
        </div>

        {/* 进度与交互按钮 */}
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
              <button
                disabled
                className="mt-2 w-full rounded-xl py-2.5 text-sm font-bold bg-ocher-light/30 text-muted/70 cursor-not-allowed transition-all border border-ocher/20"
              >
                积分不足
              </button>
            </div>
          ) : !inStock ? (
            <button
              disabled
              className="mt-2 w-full rounded-xl py-2.5 text-sm font-bold bg-ocher-light/30 text-muted/70 cursor-not-allowed transition-all border border-ocher/20"
            >
              已结缘完毕
            </button>
          ) : (
            <div className="flex gap-2">
              {/* 加入多选福袋 */}
              <button
                type="button"
                onClick={onAddToCart}
                title="加入批量结缘福袋"
                className="px-3 rounded-xl border border-golden-deep/30 hover:bg-golden-deep/15 text-golden-rich transition-colors flex items-center justify-center cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>

              {/* 立即兑换 / 选数量 */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenModal}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold btn-primary shadow-lg shadow-golden-deep/20 relative overflow-hidden group cursor-pointer"
              >
                <span className="relative z-10 flex items-center justify-center gap-1">
                  <span>结缘 / 选数量</span>
                  <span>➔</span>
                </span>
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
export default RewardsStore;
