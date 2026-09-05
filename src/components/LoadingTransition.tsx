"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CanvasLotusLoader } from "./CanvasLotusLoader";

// ── 莲花花瓣路径（8片，围绕中心展开）
const PETAL_COUNT = 8;
function petalPath(index: number) {
  const angle = (index * 360) / PETAL_COUNT;
  return { rotate: angle };
}

export function LotusFlower({ progress = 1 }: { progress?: number }) {
  const petals = Array.from({ length: PETAL_COUNT });

  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
      {/* 外层花瓣 */}
      {petals.map((_, i) => {
        const angle = (i * 360) / PETAL_COUNT;
        const delay = i * 0.06;
        return (
          <motion.g
            key={i}
            style={{ originX: "60px", originY: "60px" }}
            transform={`rotate(${angle} 60 60)`}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{
              scaleY: progress,
              opacity: progress * 0.9,
            }}
            transition={{ delay, duration: 0.4, ease: "easeOut" }}
          >
            <ellipse
              cx="60"
              cy="28"
              rx="9"
              ry="28"
              fill="url(#petalGrad)"
              style={{ transformOrigin: "60px 56px" }}
            />
          </motion.g>
        );
      })}

      {/* 内层小花瓣 */}
      {petals.map((_, i) => {
        const angle = (i * 360) / PETAL_COUNT + 22.5;
        return (
          <motion.g
            key={`inner-${i}`}
            transform={`rotate(${angle} 60 60)`}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: progress * 0.85, opacity: progress * 0.7 }}
            transition={{ delay: 0.3 + i * 0.04, duration: 0.35 }}
          >
            <ellipse cx="60" cy="38" rx="5.5" ry="18" fill="url(#innerPetalGrad)" />
          </motion.g>
        );
      })}

      {/* 花心呼吸光晕 */}
      <motion.circle
        cx="60"
        cy="60"
        r="14"
        fill="url(#heartGrad)"
        animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="60"
        cy="60"
        r="7"
        fill="#c9a227"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />

      {/* 渐变定义 */}
      <defs>
        <radialGradient id="petalGrad" cx="50%" cy="100%" r="100%">
          <stop offset="0%" stopColor="#e8c872" />
          <stop offset="60%" stopColor="#c9a227" />
          <stop offset="100%" stopColor="#b8860b" stopOpacity="0.7" />
        </radialGradient>
        <radialGradient id="innerPetalGrad" cx="50%" cy="100%" r="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#f5e6b8" stopOpacity="0.8" />
        </radialGradient>
        <radialGradient id="heartGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#e8c872" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function LoadingTransition() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);

  useEffect(() => {
    if (pathname !== prevPath) {
      // 路由切换：展示 loading
      setIsVisible(true);

      // 延长一点展示时间以欣赏特效 (2.5秒)
      const hide = setTimeout(() => {
        setIsVisible(false);
        setPrevPath(pathname);
      }, 2500);

      return () => {
        clearTimeout(hide);
      };
    }
  }, [pathname, prevPath]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="loading-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999]"
        >
          <CanvasLotusLoader />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
