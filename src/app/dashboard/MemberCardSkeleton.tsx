import React from "react";

/**
 * 仪表板骨架屏组件：在首屏服务端渲染（SSR）或数据加载中时展示，
 * 确保会员卡外框、金色脉冲微光呼吸层和菜单占位立即上屏，杜绝全屏黑屏与阻断式遮罩。
 */
export function MemberCardSkeleton() {
  return (
    <div className="w-full">
      {/* 3D 会员卡骨架屏 */}
      <div className="mb-8">
        <div className="relative p-6 sm:p-8 overflow-hidden rounded-[22px] bg-gradient-to-br from-amber-50/60 via-warm-cream/70 to-amber-100/40 border border-amber-300/40 shadow-lg">
          {/* 金色脉冲微光呼吸层 */}
          <div className="pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.35)_0%,rgba(245,158,11,0.15)_45%,transparent_70%)] blur-2xl animate-pulse" />

          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* 头像骨架 */}
            <div className="h-24 w-24 rounded-full bg-amber-200/50 animate-pulse shrink-0" />

            {/* 信息骨架 */}
            <div className="flex-1 space-y-3 text-center sm:text-left w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                <div className="h-7 w-36 rounded-lg bg-amber-200/60 animate-pulse mx-auto sm:mx-0" />
                <div className="h-5 w-24 rounded-full bg-amber-200/40 animate-pulse mx-auto sm:mx-0" />
              </div>
              <div className="h-4 w-48 rounded-lg bg-amber-200/30 animate-pulse mx-auto sm:mx-0" />
              <div className="flex gap-2 justify-center sm:justify-start pt-1">
                <div className="h-6 w-20 rounded-full bg-amber-200/40 animate-pulse" />
                <div className="h-6 w-24 rounded-full bg-amber-200/40 animate-pulse" />
                <div className="h-6 w-16 rounded-full bg-amber-200/40 animate-pulse" />
              </div>
            </div>

            {/* 累积积分骨架 */}
            <div className="flex flex-col items-center shrink-0">
              <div className="h-3 w-12 rounded bg-amber-200/40 mb-2 animate-pulse" />
              <div className="h-20 w-20 rounded-2xl bg-amber-200/30 animate-pulse" />
            </div>

            {/* 二维码骨架 */}
            <div className="hidden sm:flex flex-col items-center shrink-0">
              <div className="h-28 w-28 rounded-2xl bg-amber-200/40 animate-pulse" />
              <div className="h-3 w-16 rounded bg-amber-200/30 mt-2 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* 3D 菜单骨架 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-xs border border-ocher/10 animate-pulse p-4 flex flex-col justify-between"
          >
            <div className="h-4 w-16 rounded bg-amber-200/40" />
            <div className="h-6 w-20 rounded bg-amber-200/50" />
          </div>
        ))}
      </div>

      {/* Tabs 骨架 */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-2xl bg-white/70 dark:bg-slate-800/80 p-1.5 shadow-sm border border-ocher/20 dark:border-white/10 backdrop-blur-md gap-2">
          <div className="h-10 w-32 rounded-xl bg-golden-deep/30 animate-pulse" />
          <div className="h-10 w-28 rounded-xl bg-amber-200/20 animate-pulse" />
          <div className="h-10 w-28 rounded-xl bg-amber-200/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default MemberCardSkeleton;
