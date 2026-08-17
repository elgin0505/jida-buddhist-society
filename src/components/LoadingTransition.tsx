"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

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
  const [petalProgress, setPetalProgress] = useState(0);
  const [prevPath, setPrevPath] = useState(pathname);

  useEffect(() => {
    if (pathname !== prevPath) {
      // 路由切换：展示 loading
      setIsVisible(true);
      setPetalProgress(0);

      // 莲花绽放
      const bloom = setTimeout(() => setPetalProgress(1), 50);
      // 650ms 后隐藏
      const hide = setTimeout(() => {
        setIsVisible(false);
        setPetalProgress(0);
        setPrevPath(pathname);
      }, 680);

      return () => {
        clearTimeout(bloom);
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
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(250,247,242,0.97) 0%, rgba(245,239,228,0.95) 100%)",
            backdropFilter: "blur(12px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.25, ease: "backOut" }}
            className="flex flex-col items-center gap-4"
          >
            <LotusFlower progress={petalProgress} />
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.3 }}
              className="text-xs font-medium tracking-widest text-golden-rich/70"
            >
              技大佛学会
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
