// src/components/FinalCTAAndFooter.tsx
'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  Variants,
} from 'framer-motion';
import { useIsMobile } from '@/hooks/useIsMobile';
import { playSingingBowl } from '@/utils/zenAudio';

// ==================== 磁性按钮 ====================
interface MagneticButtonProps {
  children: React.ReactNode;
  href?: string;
  isMobile?: boolean;
  onClick?: () => void;
  strength?: number;
}

const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  href = '/auth',
  isMobile = false,
  onClick,
  strength = 0.3,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  // 果冻般的回弹
  const sx = useSpring(mx, { stiffness: 150, damping: 15, mass: 0.1 });
  const sy = useSpring(my, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mx.set((e.clientX - cx) * strength);
    my.set((e.clientY - cy) * strength);
  };

  const handleMouseLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const handleClick = () => {
    playSingingBowl(528, 0.28);
    onClick?.();
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: isMobile ? 0 : sx,
        y: isMobile ? 0 : sy,
        willChange: isMobile ? undefined : 'transform',
        display: 'inline-block',
      }}
    >
      <Link href={href} onClick={handleClick} className="block">
        <motion.div
          whileHover={isMobile ? {} : { scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="group relative inline-flex items-center gap-3
                     rounded-full bg-[#B8860B] px-8 py-4
                     text-base font-semibold tracking-wide text-white
                     shadow-[0_10px_30px_-10px_rgba(184,134,11,0.5)]
                     transition-colors duration-300
                     hover:bg-[#C99400]
                     hover:shadow-[0_15px_40px_-8px_rgba(184,134,11,0.7)]"
        >
          {/* 光泽扫过 */}
          <span
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
            aria-hidden="true"
          >
            <span
              className="absolute -inset-x-1 -inset-y-1 rounded-full
                         bg-gradient-to-r from-transparent via-white/25 to-transparent
                         -translate-x-full
                         transition-transform duration-1000 ease-out
                         group-hover:translate-x-full"
            />
          </span>

          {/* Sparkle 图标（上下微浮动 + hover 旋转）*/}
          <motion.span
            className="relative z-10 inline-flex"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.span
              className="inline-block text-lg"
              whileHover={{ rotate: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              aria-hidden="true"
            >
              ✦
            </motion.span>
          </motion.span>

          <span className="relative z-10 whitespace-nowrap">{children}</span>
        </motion.div>
      </Link>
    </motion.div>
  );
};

// ==================== 社交媒体图标 ====================
const SOCIALS = [
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: 'Telegram',
    href: 'https://telegram.org',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M21 4L3 11l5 2 2 6 3-4 6 5z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'WhatsApp',
    href: 'https://whatsapp.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <path d="M20.5 12a8.5 8.5 0 1 1-3.8-7l3.3-.9-.9 3.3A8.5 8.5 0 0 1 20.5 12z" strokeLinejoin="round" />
        <path d="M8.5 9.5c0 3.5 2.5 6 6 6l1.5-1.5-2-1.5-1.5 1c-1-.5-2-1.5-2.5-2.5l1-1.5L9.5 8 8.5 9.5z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

// ==================== 主组件 ====================
export const FinalCTAAndFooter: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // -------- 监听整个区块的滚动进度 --------
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // -------- CTA 卡片视差（浮起）--------
  // y: 80 → 0（进入视口时从下方浮起）
  const cardYRaw = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], [80, 0, 0, -40]);
  const cardScaleRaw = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], [0.95, 1, 1, 0.98]);

  // 移动端降级：幅度减半
  const cardYMapped = useTransform(cardYRaw, (v) => (isMobile ? v * 0.5 : v));
  const cardYSpring = useSpring(cardYMapped, { stiffness: 70, damping: 20, mass: 1.2 });
  const cardScaleSpring = useSpring(cardScaleRaw, { stiffness: 70, damping: 20, mass: 1.2 });

  const cardY = isMobile ? cardYMapped : cardYSpring;
  const cardScale = isMobile ? cardScaleRaw : cardScaleSpring;

  // -------- Footer 层差速：比卡片慢 --------
  const footerYRaw = useTransform(scrollYProgress, [0, 0.5, 1], [40, 0, -20]);
  const footerYSpring = useSpring(footerYRaw, { stiffness: 60, damping: 22, mass: 1.3 });
  const footerY = isMobile ? footerYRaw : footerYSpring;

  // -------- 文本错落入场 --------
  const textContainer: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.15, delayChildren: 0.15 },
    },
  };

  const textChild: Variants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.9, ease: [0.33, 1, 0.68, 1] },
    },
  };

  // -------- 回到顶部 --------
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[#0a0a0a] pt-32 pb-16"
    >
      {/* 背景微弱金色光晕 */}
      <div
        className="pointer-events-none absolute inset-0
                   bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_60%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-6">
        {/* ==================== CTA 悬浮卡片 ==================== */}
        <motion.div
          style={{ y: cardY, scale: cardScale, willChange: isMobile ? undefined : 'transform' }}
          className="relative rounded-3xl bg-[#FDFBF7] px-8 py-14 md:px-16 md:py-20
                     shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]
                     will-change-transform"
        >
          {/* 卡片内层错落文字 */}
          <motion.div
            variants={textContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            className="relative mx-auto max-w-2xl text-center"
          >
            {/* 顶部小标签 */}
            <div className="overflow-hidden">
              <motion.p
                variants={textChild}
                className="mb-4 text-xs font-semibold tracking-[0.4em] text-[#B8860B] uppercase"
              >
                Join the Path
              </motion.p>
            </div>

            {/* 主标题（分行）*/}
            <div className="overflow-hidden">
              <motion.h2
                variants={textChild}
                className="text-3xl font-bold leading-tight text-[#1a1a1a] md:text-5xl font-serif"
              >
                共修菩提，
              </motion.h2>
            </div>
            <div className="mt-2 overflow-hidden">
              <motion.h2
                variants={textChild}
                className="text-3xl font-bold leading-tight text-[#1a1a1a] md:text-5xl font-serif"
              >
                心怀慈悲。
              </motion.h2>
            </div>

            {/* 副标题 */}
            <div className="mt-6 overflow-hidden">
              <motion.p
                variants={textChild}
                className="text-base leading-relaxed text-[#5a5a5a] md:text-lg"
              >
                进入 3D 沉浸式灯海，点亮属于你的那盏心灯，
              </motion.p>
            </div>
            <div className="mt-1 overflow-hidden">
              <motion.p
                variants={textChild}
                className="text-base leading-relaxed text-[#5a5a5a] md:text-lg"
              >
                与同修一同在佛法中安住当下。
              </motion.p>
            </div>

            {/* CTA 按钮 */}
            <motion.div
              variants={textChild}
              className="mt-10 flex justify-center"
            >
              <MagneticButton isMobile={isMobile} href="/auth" strength={0.3}>
                立即登入 / 注册
              </MagneticButton>
            </motion.div>
          </motion.div>

          {/* 卡片角落装饰 */}
          <div
            className="pointer-events-none absolute -top-3 -right-3 h-16 w-16
                       rounded-full bg-[radial-gradient(circle,rgba(184,134,11,0.2),transparent_70%)]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-3 -left-3 h-20 w-20
                       rounded-full bg-[radial-gradient(circle,rgba(184,134,11,0.15),transparent_70%)]"
            aria-hidden="true"
          />
        </motion.div>

        {/* ==================== Footer（层差速揭示）==================== */}
        <motion.footer
          style={{ y: footerY, willChange: isMobile ? undefined : 'transform' }}
          className="mt-20 flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-between"
        >
          {/* 左下：社交图标 */}
          <div className="flex items-center gap-3">
            {SOCIALS.map((social) => (
              <motion.a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="group flex h-11 w-11 items-center justify-center
                           rounded-full border border-white/10 bg-white/[0.04]
                           text-white/60 backdrop-blur-md
                           transition-colors duration-300
                           hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-amber-200"
              >
                {social.icon}
              </motion.a>
            ))}
          </div>

          {/* 中间：Email 与版权 */}
          <div className="text-center md:order-2">
            <a
              href="mailto:jidafxh2014@gmail.com"
              className="text-sm text-white/70 transition-colors hover:text-amber-300"
            >
              jidafxh2014@gmail.com
            </a>
            <p className="mt-2 text-xs text-white/30">
              © {new Date().getFullYear()} 技大佛学会 · Developed by 刘俊宏
            </p>
          </div>

          {/* 右下：回到顶部 */}
          <motion.button
            onClick={scrollToTop}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            aria-label="回到顶部"
            className="group flex h-11 items-center gap-2 rounded-full
                       border border-white/10 bg-white/[0.04] px-4
                       text-sm text-white/60 backdrop-blur-md
                       transition-colors duration-300
                       hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-amber-200
                       md:order-3 cursor-pointer"
          >
            <motion.span
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            >
              ↑
            </motion.span>
            回到顶部
          </motion.button>
        </motion.footer>
      </div>
    </section>
  );
};

export default FinalCTAAndFooter;
