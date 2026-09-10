'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import {
  toggleAmbientSoundscape,
  subscribeAmbientState,
  playSingingBowl,
} from '@/utils/zenAudio';

interface ZenSoundToggleProps {
  className?: string;
  showText?: boolean;
}

export const ZenSoundToggle: React.FC<ZenSoundToggleProps> = ({
  className = '',
  showText = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const unsub = subscribeAmbientState(setIsPlaying);
    return () => unsub();
  }, []);

  const handleToggle = () => {
    const nextState = toggleAmbientSoundscape();
    if (nextState) {
      // 开启时伴随一声温润空灵的 432Hz 颂钵引磬，安抚身心
      playSingingBowl(432, 0.28);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isPlaying ? '静音禅意音效' : '开启禅意流水微风白噪音与清磬'}
      aria-pressed={isPlaying}
      title={isPlaying ? '点击静音' : '开启沉浸禅意声场（微风流水）'}
      className={`group relative inline-flex items-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all duration-300 whitespace-nowrap shrink-0 ${
        isPlaying
          ? 'border-golden-rich/50 bg-golden-rich/15 text-golden-deep shadow-sm shadow-golden-rich/20'
          : 'border-ocher/35 bg-warm-white/80 text-charcoal/70 hover:border-golden-rich/40 hover:text-charcoal hover:bg-warm-white'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center shrink-0">
        {isPlaying ? (
          <div className="flex items-center gap-0.5 text-golden-rich">
            {/* 动态音波律动 */}
            <motion.span
              animate={{ height: ['4px', '12px', '4px'] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              className="inline-block w-0.5 rounded-full bg-golden-rich"
            />
            <motion.span
              animate={{ height: ['8px', '16px', '6px', '8px'] }}
              transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut', delay: 0.2 }}
              className="inline-block w-0.5 rounded-full bg-golden-rich"
            />
            <motion.span
              animate={{ height: ['5px', '10px', '5px'] }}
              transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut', delay: 0.4 }}
              className="inline-block w-0.5 rounded-full bg-golden-rich"
            />
          </div>
        ) : (
          <VolumeX className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
        )}
      </div>

      {showText && (
        <span className="hidden lg:inline tracking-wide font-serif text-[11px] whitespace-nowrap select-none">
          {isPlaying ? '禅音悠扬' : '禅音静候'}
        </span>
      )}

      {/* 激活光晕 */}
      {isPlaying && (
        <motion.span
          layoutId="zenSoundGlow"
          className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-golden-rich/30 animate-pulse"
        />
      )}
    </button>
  );
};

export default ZenSoundToggle;
