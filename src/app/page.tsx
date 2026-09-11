'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
import { ParallaxGrid } from '@/components/ParallaxGrid';
import CylindricalGallery from '@/components/CylindricalGallery';
import ZenPreloader from '@/components/ZenPreloader';
import LegoTypographyCollage from '@/components/LegoTypographyCollage';
import ExploreActivitiesSection from '@/components/ExploreActivitiesSection';
import FinalCTAAndFooter from '@/components/FinalCTAAndFooter';
import { Sparkles, ArrowRight, BookOpen, Calendar, HeartHandshake } from 'lucide-react';

const CLASSES = [
  {
    title: '佛学班例常',
    desc: '适合零基础与进修同学，从佛教基本教义、因果业报与佛法智慧轻松入门，解行并重。',
    tag: '基础入门',
  },
  {
    title: '生活课题班例常',
    desc: '以佛法智慧探讨生活、学业与情绪管理等现实课题，在繁忙学业中安顿身心。',
    tag: '身心止息',
  },
  {
    title: '冬至',
    desc: '岁末传统佳节温馨相聚，共搓汤圆、感念恩德，传递温暖祝福与法喜圆满。',
    tag: '岁末温情',
  },
];

const FIVE_EVENTS = [
  {
    title: '迎新会',
    subtitle: 'Orientation & Welcoming Gathering',
    desc: '诚挚迎接新届佛友融入技大佛学会大家庭，破冰结缘、共勉同行，开启温暖而法喜充盈的大学新旅程。',
  },
  {
    title: '欢乐营',
    subtitle: 'Youth Joy Camp',
    desc: '寓教于乐的青年佛学营，透过创意团康破冰、团队协作与佛法体验，在欢声笑语中增进同修情谊与正向能量。',
  },
  {
    title: '静修营',
    subtitle: 'Zen Meditation Camp',
    desc: '专为大学生打造的止语静心修行营，以坐禅、行禅与正念观照抚平学业浮躁，探寻内心深处的祥和与智慧。',
  },
  {
    title: '卫塞营',
    subtitle: 'Vesak Celebration Camp',
    desc: '纪念佛陀诞生、成道与涅槃的三期同一盛典营，以灌沐如来、传灯发愿与佛法共修，长养慈悲菩提心。',
  },
  {
    title: '传承营',
    subtitle: 'Heritage & Succession Camp',
    desc: '凝聚新老执委与骨干同修的领导力培训营，薪火相传、研讨展望，将正信佛法的利他奉献精神代代延续。',
  },
];


// 主页内容入场动画的统一变体
const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.0,
      ease: [0.22, 1, 0.36, 1] as const,
      delay: 0.2, // 让 Preloader 先开始退场
    },
  },
};

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);

  // -------- 加载状态管理 --------
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  // -------- 锁定 / 解锁 body 滚动 --------
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoading]);

  return (
    <>
      {/* -------- 全局入场 技大佛学会 Logo 闪烁 Preloader -------- */}
      <AnimatePresence mode="wait">
        {isLoading && <ZenPreloader key="landing-preloader" logoSrc="/logo.png" />}
      </AnimatePresence>

      {/* -------- 主页内容（随 Preloader 退场而浮现）-------- */}
      <motion.main
        className="min-h-screen bg-warm-white text-charcoal selection:bg-golden-rich/20 selection:text-charcoal"
        variants={contentVariants}
        initial="hidden"
        animate={isLoading ? 'hidden' : 'visible'}
      >
      {/* 悬浮毛玻璃导航栏 */}
      <Header />

      {/* 核心视差照片墙 */}
      <ParallaxGrid />

      {/* ── 模块：佛学班 ── */}
      <section id="classes" className="mx-auto max-w-6xl px-4 py-24 sm:px-8">
        <SectionHeading eyebrow="常态课程 · 福慧双修" title="佛学班与禅修实践" />
        <div className="grid gap-6 sm:grid-cols-3">
          {CLASSES.map((c) => (
            <div
              key={c.title}
              className="group relative flex flex-col justify-between rounded-3xl border border-ocher/25 bg-warm-cream/40 p-6 sm:p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-golden-rich/40 hover:bg-warm-white hover:shadow-md hover:shadow-golden-rich/5"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-golden-rich/10 px-3 py-1 text-xs font-semibold text-golden-rich">
                    {c.tag}
                  </span>
                  <BookOpen className="h-4 w-4 text-golden-rich/60 transition-transform group-hover:scale-110" />
                </div>
                <h3 className="mt-4 text-xl font-bold tracking-tight text-charcoal group-hover:text-golden-rich transition-colors">
                  {c.title}
                </h3>
                <p className="mt-3.5 text-sm leading-relaxed text-muted">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 模块：3D 轮胎式环形活动画廊 ── */}
      <CylindricalGallery />

      {/* ── 模块：五大活动 ── */}
      <section id="five-events" className="border-y border-ocher/15 bg-warm-cream/40 px-4 py-24 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="年度亮点 · 盛大巡礼" title="技大佛学会五大活动" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {FIVE_EVENTS.map((e, i) => (
              <div
                key={e.title}
                className="group flex flex-col rounded-3xl bg-warm-white p-6 sm:p-7 shadow-sm ring-1 ring-charcoal/5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-golden-rich/10 hover:ring-golden-rich/30"
              >
                <div>
                  <span className="block font-serif text-3xl sm:text-4xl font-black text-golden-rich/70 transition-colors group-hover:text-golden-rich">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="mt-4">
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-charcoal transition-colors group-hover:text-golden-rich">
                      {e.title}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-golden-rich/80 tracking-wide">
                      {e.subtitle}
                    </p>
                    <p className="mt-3.5 text-sm leading-relaxed text-muted">
                      {e.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 模块：乐高拼字照片墙 (LegoTypographyCollage) ── */}
      <LegoTypographyCollage />

      {/* ── 模块：更多活动 (带 2.5D 视差胶囊与磁性按钮特效) ── */}
      <ExploreActivitiesSection />

      {/* ── 模块：最终 CTA 与分层视差页脚 (FinalCTAAndFooter) ── */}
      <FinalCTAAndFooter />
      </motion.main>
    </>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-10">
      <span className="text-xs font-semibold uppercase tracking-widest text-golden-rich">
        {eyebrow}
      </span>
      <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-charcoal">{title}</h2>
    </div>
  );
}
