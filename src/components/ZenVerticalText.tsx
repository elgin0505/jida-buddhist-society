"use client";

import { motion } from "framer-motion";

interface ZenVerticalTextProps {
  quote: string;
  author: string;
}

export function ZenVerticalText({ quote, author }: ZenVerticalTextProps) {
  return (
    <div className="absolute left-[8%] top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-6 opacity-80 mix-blend-multiply dark:mix-blend-screen dark:opacity-60 transition-all duration-1000 z-0">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="flex gap-4 items-start"
        style={{ writingMode: "vertical-rl" }}
      >
        <p className="text-3xl font-serif tracking-[0.3em] text-slate-800 dark:text-slate-200 drop-shadow-sm">
          {quote}
        </p>
        <div className="flex flex-col items-center mt-12 gap-4">
          <span className="text-sm font-serif tracking-[0.2em] text-slate-600 dark:text-slate-400">
            {author}
          </span>
          {/* Red Stamp SVG */}
          <div className="relative h-10 w-10 opacity-80 mt-2 hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 100" className="w-full h-full text-red-600 dark:text-red-500">
              <rect x="5" y="5" width="90" height="90" rx="8" stroke="currentColor" strokeWidth="6" fill="transparent" />
              {/* Inner stamp archaic script lines (pseudo characters) */}
              <path d="M 25 20 L 45 20 M 35 20 L 35 80 M 25 80 L 45 80 M 30 50 L 40 50" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              <path d="M 60 20 L 80 20 M 70 20 L 70 80 M 60 80 L 80 80 M 65 35 L 75 35 M 65 65 L 75 65" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              {/* Grunge/distress dots */}
              <circle cx="12" cy="12" r="2" fill="currentColor" />
              <circle cx="88" cy="88" r="2" fill="currentColor" />
              <circle cx="15" cy="85" r="1.5" fill="currentColor" />
              <circle cx="85" cy="15" r="1.5" fill="currentColor" />
            </svg>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
