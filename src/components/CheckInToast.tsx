"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface CheckInToastProps {
  memberName: string;
  memberId: string;
  pointsEarned: number;
  visible: boolean;
  onDismiss: () => void;
}

function CheckmarkIcon() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-jade/15">
      <svg
        className="h-6 w-6 text-jade"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M5 13l4 4L19 7"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
        />
      </svg>
    </div>
  );
}

function LotusSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 36 36" fill="none">
      {Array.from({ length: 6 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 60} 18 18)`}>
          <ellipse cx="18" cy="7" rx="5" ry="11" fill="#c9a227" opacity="0.75" />
        </g>
      ))}
      <circle cx="18" cy="18" r="6" fill="#e8c872" />
    </svg>
  );
}

export function CheckInToast({
  memberName,
  memberId,
  pointsEarned,
  visible,
  onDismiss,
}: CheckInToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onDismiss, 3200);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="checkin-toast"
          // Spring 物理回弹动画：从屏幕底部弹入
          initial={{ y: 140, opacity: 0, scale: 0.88 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 120, opacity: 0, scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 22,
            mass: 0.85,
          }}
          className="fixed bottom-8 left-1/2 z-[9998] -translate-x-1/2"
          style={{ minWidth: 320, maxWidth: "90vw" }}
        >
          <div
            className="flex items-start gap-4 rounded-2xl border border-white/70 px-5 py-4 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.18),0_0_0_1px_rgba(201,162,39,0.15)]"
            style={{
              background: "rgba(255, 252, 245, 0.88)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
            }}
          >
            {/* 勾号图标 */}
            <CheckmarkIcon />

            {/* 文字内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <LotusSmall />
                <p className="text-[11px] font-semibold uppercase tracking-widest text-golden-rich/70">
                  签到成功
                </p>
              </div>
              <p className="text-base font-bold text-charcoal truncate">
                {memberName}
              </p>
              <p className="mt-0.5 text-xs text-muted">{memberId}</p>
            </div>

            {/* 积分徽章 */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.2 }}
              className="flex flex-shrink-0 flex-col items-center justify-center rounded-xl bg-jade/10 px-3 py-2"
            >
              <span className="text-xl font-extrabold leading-none text-jade">
                +{pointsEarned}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold text-jade/70">积分</span>
            </motion.div>

            {/* 关闭按钮 */}
            <button
              onClick={onDismiss}
              className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-muted/50 transition-colors hover:text-charcoal"
              aria-label="关闭"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 底部进度条 */}
          <motion.div
            className="mx-4 h-0.5 rounded-full bg-jade/30"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 3.1, ease: "linear" }}
            style={{ originX: 0 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
