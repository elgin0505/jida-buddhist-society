import React from "react";
import { BreathingLotusLoader } from "@/components/BreathingLotusLoader";

/**
 * 🪷 Next.js App Router 全局路由加载界面 (Root Loading UI)
 * 当页面路由切换、数据异步加载或 Suspense 挂起时自动呈现禅意呼吸莲花
 */
export default function Loading() {
  return <BreathingLotusLoader fullScreen />;
}
