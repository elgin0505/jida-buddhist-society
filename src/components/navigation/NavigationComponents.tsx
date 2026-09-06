"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// ── Bottom Tab Bar ───────────────────────────────────────────
interface TabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

interface BottomTabBarProps {
  items: TabItem[];
  className?: string;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  items,
  className,
}) => {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t border-ocher/20 bg-warm-white/90 pb-safe backdrop-blur-md",
        className
      )}
    >
      <div className="mx-auto flex max-w-lg">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 transition-all duration-200",
                isActive ? "text-golden-deep" : "text-muted hover:text-charcoal"
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <span
                className={cn(
                  "text-[10px] font-medium tracking-wide",
                  isActive ? "text-golden-deep" : "text-muted"
                )}
              >
                {item.label}
              </span>
              {/* 激活指示点 */}
              {isActive && (
                <span className="h-0.5 w-4 rounded-full bg-golden-deep" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

// ── Top Nav 顶部导航（含手势右滑返回）────────────────────────
interface TopNavProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  className,
}) => {
  const router = useRouter();

  // 右滑手势返回 (iOS 风格)
  useEffect(() => {
    if (!showBack) return;
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
      // 确保是横向滑动且从屏幕左侧边缘开始
      if (dx > 80 && dy < 50 && touchStartX < 40) {
        onBack ? onBack() : router.back();
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [showBack, onBack, router]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center justify-between border-b border-ocher/20 bg-warm-white/90 px-4 backdrop-blur-md",
        className
      )}
    >
      {/* 左：返回按钮 */}
      <div className="w-10">
        {showBack && (
          <button
            onClick={() => (onBack ? onBack() : router.back())}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-ocher-light/30 hover:text-charcoal active:scale-90"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* 中：标题 */}
      <div className="flex flex-col items-center">
        <h1 className="text-sm font-bold tracking-tight text-charcoal">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[10px] text-muted">{subtitle}</p>
        )}
      </div>

      {/* 右：自定义操作 */}
      <div className="flex w-10 items-center justify-end">
        {rightAction ?? <span />}
      </div>
    </header>
  );
};
