"use client";

import { motion } from "framer-motion";

interface LotusLoadingProps {
  text?: string;
  className?: string;
}

const PETAL_COUNT = 8;

export function LotusLoading({ text = "静心加载中...", className = "py-20" }: LotusLoadingProps) {
  const petals = Array.from({ length: PETAL_COUNT });

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative flex items-center justify-center">
        <svg width="90" height="90" viewBox="0 0 120 120" fill="none">
          {/* 外层花瓣 */}
          {petals.map((_, i) => {
            const angle = (i * 360) / PETAL_COUNT;
            return (
              <motion.g
                key={`outer-${i}`}
                style={{ originX: "60px", originY: "60px" }}
                transform={`rotate(${angle} 60 60)`}
                animate={{
                  scaleY: [0.4, 1, 0.4],
                  opacity: [0.5, 0.95, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.15,
                }}
              >
                <ellipse
                  cx="60"
                  cy="28"
                  rx="9"
                  ry="28"
                  fill="url(#loadingPetalGrad)"
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
                animate={{
                  scaleY: [0.6, 1, 0.6],
                  opacity: [0.4, 0.85, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.2 + i * 0.15,
                }}
              >
                <ellipse cx="60" cy="38" rx="5.5" ry="18" fill="url(#loadingInnerPetalGrad)" />
              </motion.g>
            );
          })}

          {/* 花心呼吸光晕 */}
          <motion.circle
            cx="60"
            cy="60"
            r="14"
            fill="url(#loadingHeartGrad)"
            animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx="60"
            cy="60"
            r="7"
            fill="#c9a227"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />

          <defs>
            <radialGradient id="loadingPetalGrad" cx="50%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#e8c872" />
              <stop offset="60%" stopColor="#c9a227" />
              <stop offset="100%" stopColor="#b8860b" stopOpacity="0.8" />
            </radialGradient>
            <radialGradient id="loadingInnerPetalGrad" cx="50%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#f5e6b8" stopOpacity="0.9" />
            </radialGradient>
            <radialGradient id="loadingHeartGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#e8c872" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      <motion.p
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="mt-4 text-xs font-semibold tracking-widest text-golden-rich"
      >
        {text}
      </motion.p>
    </div>
  );
}
