"use client";

import React from "react";
import { cn } from "@/lib/utils";

// ── Skeleton 骨架屏 ──────────────────────────────────────────
interface SkeletonProps {
  variant?: "text" | "circle" | "rect";
  width?: string | number;
  height?: string | number;
  className?: string;
  animation?: "pulse" | "shimmer";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "rect",
  width = "100%",
  height,
  className,
  animation = "shimmer",
}) => {
  const defaultHeight =
    variant === "text" ? "1em" : variant === "circle" ? "40px" : "100px";

  const baseStyle: React.CSSProperties = {
    width,
    height: height ?? defaultHeight,
    borderRadius:
      variant === "circle" ? "50%" : variant === "text" ? "4px" : "12px",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-r from-amber-50 via-ocher-light/40 to-amber-50",
        animation === "pulse" && "animate-pulse",
        className
      )}
      style={baseStyle}
    >
      {animation === "shimmer" && (
        <div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
          style={{
            animation: "skeleton-shimmer 1.6s infinite",
          }}
        />
      )}
    </div>
  );
};

// ── Progress Bar 进度条 ──────────────────────────────────────
interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  className,
  barClassName,
  showLabel,
  label,
}) => {
  const percent = Math.min((value / max) * 100, 100);
  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-1 flex items-center justify-between">
          {label && (
            <span className="text-xs font-medium text-muted">{label}</span>
          )}
          <span className="ml-auto text-xs text-muted">
            {Math.round(percent)}%
          </span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-ocher-light/40">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-golden-deep to-golden-candle transition-all duration-500 ease-out",
            barClassName
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

// ── Empty State 空状态 ───────────────────────────────────────
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center py-16 text-center",
      className
    )}
  >
    {icon && (
      <div className="mb-4 text-5xl text-golden-deep/60">{icon}</div>
    )}
    <h3 className="text-base font-semibold text-charcoal">{title}</h3>
    {description && (
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
        {description}
      </p>
    )}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
