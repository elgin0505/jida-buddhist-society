"use client";

import { motion } from "framer-motion";

const QUOTES = [
  "若以色见我，以音声求我，是人行邪道，不能见如来。",
  "过去心不可得，现在心不可得，未来心不可得。",
  "一切有为法，如梦幻泡影，如露亦如电，应作如是观。",
  "菩提本无树，明镜亦非台。本来无一物，何处惹尘埃。"
];

export function FloatingDharmaQuote() {
  // 静态选择，也可改为随机提取
  const quote = QUOTES[2];

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 4, ease: "easeOut", delay: 0.5 }}
      className="pointer-events-none absolute left-8 top-16 md:left-24 md:top-24 z-10 hidden sm:block"
      style={{
        writingMode: "vertical-rl",
        textOrientation: "mixed",
        fontFamily: '"STKaiti", "Kaiti TC", "KaiTi", "Songti SC", "SimSun", serif',
        letterSpacing: "0.25em",
        lineHeight: "2",
      }}
    >
      <div
        className="text-2xl md:text-3xl text-amber-50/95 dark:text-white/95"
        style={{
          // 极度轻柔但立体的微阴影，防止吃色 (防白色背景融入)
          textShadow: "0 4px 12px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.3)",
        }}
      >
        {quote}
      </div>
    </motion.div>
  );
}
