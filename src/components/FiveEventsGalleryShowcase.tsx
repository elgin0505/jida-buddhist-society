'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Image from 'next/image';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
} from 'framer-motion';

/* ══════════════════════════════════════════════════
   类型定义
══════════════════════════════════════════════════ */
export interface EventPhoto {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface EventData {
  id: string;
  name: string;
  subtitle: string;   // 例如 "迎新会 / Orientation"
  cover: string;
  coverAlt: string;
  photos: EventPhoto[];
}

interface Props {
  events?: EventData[];
}

/* ══════════════════════════════════════════════════
   Spring 曲线 —— 手风琴的“呼吸感”来源
══════════════════════════════════════════════════ */
const EASE_SOFT: [number, number, number, number] = [0.32, 0.72, 0, 1];

/* ══════════════════════════════════════════════════
   默认五大活动数据（技大佛学会年度五大盛事）
══════════════════════════════════════════════════ */
export const DEFAULT_FIVE_EVENTS: EventData[] = [
  {
    id: 'orientation',
    name: '迎新会',
    subtitle: 'Orientation · 欢喜结缘',
    cover: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    coverAlt: '迎新会合影与欢喜结缘',
    photos: [
      { id: 'ori-1', src: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80', alt: '迎新相聚 · 破冰破局', width: 1200, height: 800 },
      { id: 'ori-2', src: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80', alt: '学长姐温情关怀', width: 1200, height: 800 },
      { id: 'ori-3', src: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=1200&q=80', alt: '小组互动研讨', width: 1200, height: 800 },
      { id: 'ori-4', src: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80', alt: '团队共聚一堂', width: 1200, height: 800 },
      { id: 'ori-5', src: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80', alt: '新春与新生欢聚分享', width: 1200, height: 800 },
      { id: 'ori-6', src: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80', alt: '温馨素食茶歇结缘', width: 1200, height: 800 },
    ],
  },
  {
    id: 'joy-camp',
    name: '欢乐营',
    subtitle: 'Youth Joy Camp · 青春破冰',
    cover: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80',
    coverAlt: '欢乐营大自然探索与团队拓展',
    photos: [
      { id: 'joy-1', src: 'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=1200&q=80', alt: '户外破冰探索', width: 1200, height: 800 },
      { id: 'joy-2', src: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80', alt: '创意晚会与法喜欢笑', width: 1200, height: 800 },
      { id: 'joy-3', src: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80', alt: '青春跃动与团队默契', width: 1200, height: 800 },
      { id: 'joy-4', src: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80', alt: '团队协作突破挑战', width: 1200, height: 800 },
      { id: 'joy-5', src: 'https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?auto=format&fit=crop&w=1200&q=80', alt: '营员真诚互助合影', width: 1200, height: 800 },
      { id: 'joy-6', src: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=80', alt: '朝阳晨光下的希望与活力', width: 1200, height: 800 },
    ],
  },
  {
    id: 'zen-camp',
    name: '静修营',
    subtitle: 'Zen Camp · 止语禅心',
    cover: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    coverAlt: '静修营止语坐禅与安住当下',
    photos: [
      { id: 'zen-1', src: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80', alt: '晨曦坐禅觉照', width: 1200, height: 800 },
      { id: 'zen-2', src: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&q=80', alt: '禅茶一味 · 专注当下', width: 1200, height: 800 },
      { id: 'zen-3', src: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=1200&q=80', alt: '林间行禅与正念步伐', width: 1200, height: 800 },
      { id: 'zen-4', src: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?auto=format&fit=crop&w=1200&q=80', alt: '心香一瓣 · 凝神静虑', width: 1200, height: 800 },
      { id: 'zen-5', src: 'https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?auto=format&fit=crop&w=1200&q=80', alt: '清晨钟声与自性澄澈', width: 1200, height: 800 },
      { id: 'zen-6', src: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1200&q=80', alt: '静水流深之禅意意境', width: 1200, height: 800 },
    ],
  },
  {
    id: 'vesak-camp',
    name: '卫塞营',
    subtitle: 'Vesak Camp · 浴佛传灯',
    cover: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80',
    coverAlt: '卫塞节传灯祈福之夜',
    photos: [
      { id: 'vesak-1', src: 'https://images.unsplash.com/photo-1609137144820-22d7c2a71f0a?auto=format&fit=crop&w=1200&q=80', alt: '清净莲花供奉', width: 1200, height: 800 },
      { id: 'vesak-2', src: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80', alt: '万盏心灯齐放光明', width: 1200, height: 800 },
      { id: 'vesak-3', src: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80', alt: '虔诚发愿 · 功德回向', width: 1200, height: 800 },
      { id: 'vesak-4', src: 'https://images.unsplash.com/photo-1473081556163-2a17de81fc97?auto=format&fit=crop&w=1200&q=80', alt: '庄严道场与吉祥法喜', width: 1200, height: 800 },
      { id: 'vesak-5', src: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80', alt: '喜迎佛诞 · 三期同一庆', width: 1200, height: 800 },
      { id: 'vesak-6', src: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1200&q=80', alt: '慈悲之光普照人间', width: 1200, height: 800 },
    ],
  },
  {
    id: 'heritage-camp',
    name: '传承营',
    subtitle: 'Heritage Camp · 薪火相传',
    cover: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
    coverAlt: '传承营骨干齐聚与薪火相传',
    photos: [
      { id: 'her-1', src: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80', alt: '骨干同修领袖研讨会', width: 1200, height: 800 },
      { id: 'her-2', src: 'https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=1200&q=80', alt: '新老执委策划与交接', width: 1200, height: 800 },
      { id: 'her-3', src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80', alt: '正信佛法弘传规划', width: 1200, height: 800 },
      { id: 'her-4', src: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80', alt: '师长前辈智慧倾囊相授', width: 1200, height: 800 },
      { id: 'her-5', src: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80', alt: '同修共勉 · 砥砺同行', width: 1200, height: 800 },
      { id: 'her-6', src: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1200&q=80', alt: '携手筑梦 · 菩提道永续', width: 1200, height: 800 },
    ],
  },
];

/* ══════════════════════════════════════════════════
   主组件
══════════════════════════════════════════════════ */
export function FiveEventsGalleryShowcase({ events = DEFAULT_FIVE_EVENTS }: Props) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [activeId, setActiveId] = useState<string>(events[0]?.id ?? '');
  const [lightbox, setLightbox] = useState<{ eventId: string; photoId: string } | null>(null);

  /* ── 响应式守卫（SSR 安全） ── */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  /* ── 光箱状态派生 ── */
  const currentEvent = useMemo(
    () => (lightbox ? events.find((e) => e.id === lightbox.eventId) ?? null : null),
    [lightbox, events],
  );
  const currentPhoto = useMemo(() => {
    if (!currentEvent || !lightbox) return null;
    return currentEvent.photos.find((p) => p.id === lightbox.photoId) ?? null;
  }, [currentEvent, lightbox]);

  const currentIndex = currentEvent && currentPhoto
    ? currentEvent.photos.findIndex((p) => p.id === currentPhoto.id)
    : -1;

  /* ── 光箱控制 ── */
  const openLightbox = useCallback((eventId: string, photoId: string) => {
    setLightbox({ eventId, photoId });
  }, []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const step = useCallback((dir: 1 | -1) => {
    setLightbox((prev) => {
      if (!prev) return prev;
      const ev = events.find((e) => e.id === prev.eventId);
      if (!ev) return prev;
      const idx = ev.photos.findIndex((p) => p.id === prev.photoId);
      const next = (idx + dir + ev.photos.length) % ev.photos.length;
      return { ...prev, photoId: ev.photos[next].id };
    });
  }, [events]);

  /* ── 键盘 & 滚动锁 ── */
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox, closeLightbox, step]);

  return (
    <section className="relative w-full overflow-hidden bg-[#0a0a0a]" id="five-events-gallery">
      {/* ═══════ 模块三 · 顶部竹林融合 ═══════
          向上延伸 96px，把上一节的竹林山水柔和过渡到本节的深色底。 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-24 z-10
                   bg-gradient-to-b from-transparent to-[#0a0a0a]"
      />

      <div className="relative pt-20 pb-20 md:pt-28 md:pb-28">
        {/* ── 标题 ── */}
        <div className="relative z-20 mx-auto mb-10 max-w-6xl px-6 text-center md:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.7, ease: EASE_SOFT }}
            className="text-[10px] uppercase tracking-[0.5em] text-amber-200/60 md:text-xs"
          >
            Five Moments · 五大活动
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.1, ease: EASE_SOFT }}
            className="mt-4 text-3xl font-black tracking-tight text-white/95 md:text-5xl font-serif"
          >
            五大盛事 · 时光画廊
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE_SOFT }}
            className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/45 md:text-base"
          >
            点击任意照片，放大细看每一帧的温暖与法喜
          </motion.p>
        </div>

        {/* ── 画廊主体与共享布局 ── */}
        <LayoutGroup id="five-events-gallery-group">
          {isMobile === null ? (
            <div className="mx-auto h-[60vh] w-full max-w-6xl px-6" aria-hidden />
          ) : isMobile ? (
            <MobileStack events={events} onPhotoOpen={openLightbox} />
          ) : (
            <DesktopAccordion
              events={events}
              activeId={activeId}
              onActiveChange={setActiveId}
              onPhotoOpen={openLightbox}
            />
          )}

          {/* ═══════ 模块二 · 全屏光箱 ═══════ */}
          <AnimatePresence>
            {lightbox && currentPhoto && currentEvent && (
              <Lightbox
                photo={currentPhoto}
                eventName={currentEvent.name}
                index={currentIndex}
                total={currentEvent.photos.length}
                onClose={closeLightbox}
                onPrev={() => step(-1)}
                onNext={() => step(1)}
              />
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════
   桌面端 · 横向手风琴
══════════════════════════════════════════════════ */
function DesktopAccordion({
  events,
  activeId,
  onActiveChange,
  onPhotoOpen,
}: {
  events: EventData[];
  activeId: string;
  onActiveChange: (id: string) => void;
  onPhotoOpen: (eventId: string, photoId: string) => void;
}) {
  return (
    <div className="relative mx-auto flex h-[68vh] min-h-[500px] w-full max-w-[1400px] gap-2.5 px-6">
      {events.map((ev) => {
        const isActive = ev.id === activeId;
        return (
          <motion.div
            key={ev.id}
            /* ★ 关键：flexGrow 由 Framer 插值，实现 5 列自动均分与平滑扩张 */
            style={{ flexBasis: 0, flexShrink: 1, minWidth: 0 }}
            initial={false}
            animate={{ flexGrow: isActive ? 6 : 1 }}
            transition={{ duration: 0.7, ease: EASE_SOFT }}
            onHoverStart={() => onActiveChange(ev.id)}
            onFocus={() => onActiveChange(ev.id)}
            onClick={() => onActiveChange(ev.id)}
            tabIndex={0}
            className="relative isolate cursor-pointer overflow-hidden rounded-2xl
                       border border-white/[0.08] outline-none
                       focus-visible:ring-1 focus-visible:ring-amber-200/40"
          >
            {/* ── 背景封面：激活时轻微放大，制造纵深 ── */}
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ scale: isActive ? 1.08 : 1 }}
              transition={{ duration: 1.1, ease: EASE_SOFT }}
            >
              <Image
                src={ev.cover}
                alt={ev.coverAlt}
                fill
                sizes="(max-width: 1400px) 60vw, 800px"
                className="object-cover"
              />
            </motion.div>

            {/* ── 暗色遮罩：激活时变浅，让照片呼吸 ── */}
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ backgroundColor: isActive ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.72)' }}
              transition={{ duration: 0.6, ease: EASE_SOFT }}
            />

            {/* ── 活动名：非激活时居中，激活时置于底部栏 ── */}
            <motion.div
              className="pointer-events-none absolute inset-x-0 z-35"
              style={{ y: '-50%' }}
              initial={false}
              animate={{ top: isActive ? '88%' : '50%' }}
              transition={{ duration: 0.55, ease: EASE_SOFT }}
            >
              <div className="px-4 text-center">
                <motion.p
                  initial={false}
                  animate={{ opacity: isActive ? 1 : 0, height: isActive ? 'auto' : 0 }}
                  transition={{ duration: 0.4, ease: EASE_SOFT }}
                  className="overflow-hidden text-[10px] uppercase tracking-[0.45em] text-amber-200/80 font-medium"
                >
                  {ev.subtitle}
                </motion.p>
                <motion.h3
                  initial={false}
                  animate={{ fontSize: isActive ? '1.5rem' : '1.05rem' }}
                  transition={{ duration: 0.55, ease: EASE_SOFT }}
                  className="mt-1 whitespace-nowrap font-bold leading-tight text-white
                             [text-shadow:0_2px_18px_rgba(0,0,0,0.85)] font-serif"
                >
                  {ev.name}
                </motion.h3>
              </div>
            </motion.div>

            {/* ── 展开的照片网格 ── */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  key="photos"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.45, delay: 0.18, ease: EASE_SOFT }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 z-30 overflow-y-auto overscroll-contain
                             px-5 pb-20 pt-6 [scrollbar-width:thin]
                             [&::-webkit-scrollbar]:w-1
                             [&::-webkit-scrollbar-thumb]:rounded-full
                             [&::-webkit-scrollbar-thumb]:bg-amber-200/25"
                >
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    {ev.photos.map((photo, i) => (
                      <PhotoTile
                        key={photo.id}
                        photo={photo}
                        index={i}
                        onClick={() => onPhotoOpen(ev.id, photo.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── 底部金线，激活时亮起 ── */}
            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-px"
              initial={false}
              animate={{ opacity: isActive ? 1 : 0 }}
              transition={{ duration: 0.5 }}
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(247,220,138,0.7), transparent)',
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   通用 · 网格缩略图
   —— 带 layoutId，供光箱共享布局动画使用
══════════════════════════════════════════════════ */
function PhotoTile({
  photo,
  index,
  onClick,
}: {
  photo: EventPhoto;
  index: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      layoutId={`photo-${photo.id}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: EASE_SOFT }}
      whileTap={{ scale: 0.985 }}
      className="group relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl
                 ring-1 ring-white/10 transition-shadow duration-500
                 hover:ring-amber-200/50
                 hover:shadow-[0_10px_36px_-12px_rgba(247,220,138,0.35)]"
      aria-label={photo.alt}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="(max-width: 768px) 45vw, (max-width: 1400px) 22vw, 320px"
        className="object-cover transition-[transform,filter] duration-700 ease-out
                   group-hover:scale-[1.05] group-hover:brightness-110"
      />
      {/* 高级相纸质感的极细内描边 */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl
                   ring-1 ring-inset ring-white/5 group-hover:ring-white/20
                   transition-colors duration-500"
      />
    </motion.button>
  );
}

/* ══════════════════════════════════════════════════
   移动端 · 竖向折叠卡片 + 横向 snap 照片流
══════════════════════════════════════════════════ */
function MobileStack({
  events,
  onPhotoOpen,
}: {
  events: EventData[];
  onPhotoOpen: (eventId: string, photoId: string) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(events[0]?.id ?? null);

  return (
    <div className="mx-auto max-w-md space-y-4 px-5">
      {events.map((ev) => {
        const isOpen = openId === ev.id;
        return (
          <motion.div
            key={ev.id}
            layout
            transition={{ duration: 0.5, ease: EASE_SOFT }}
            className="overflow-hidden rounded-2xl border border-white/[0.08]
                       bg-white/[0.03] backdrop-blur-sm"
          >
            {/* ── 卡片头图 ── */}
            <motion.button
              type="button"
              layout="position"
              onClick={() => setOpenId(isOpen ? null : ev.id)}
              className="relative block h-44 w-full text-left"
            >
              <Image
                src={ev.cover}
                alt={ev.coverAlt}
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute inset-x-5 bottom-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-amber-200/80">
                    {ev.subtitle}
                  </p>
                  <h3 className="mt-1 text-xl font-bold text-white font-serif">{ev.name}</h3>
                </div>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.4, ease: EASE_SOFT }}
                  className="mb-1 text-lg text-amber-200/90"
                  aria-hidden
                >
                  ▾
                </motion.span>
              </div>
            </motion.button>

            {/* ── 折叠区：横向 snap 照片流 ── */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE_SOFT }}
                  className="overflow-hidden"
                >
                  <div
                    className="flex snap-x snap-mandatory gap-3 overflow-x-auto
                               px-4 py-4 [scrollbar-width:none]
                               [&::-webkit-scrollbar]:hidden"
                  >
                    {ev.photos.map((photo) => (
                      <motion.button
                        key={photo.id}
                        type="button"
                        layoutId={`photo-${photo.id}`}
                        onClick={() => onPhotoOpen(ev.id, photo.id)}
                        whileTap={{ scale: 0.97 }}
                        className="relative h-40 w-32 shrink-0 snap-start overflow-hidden
                                   rounded-xl ring-1 ring-white/10
                                   transition-shadow duration-500
                                   active:ring-amber-200/40"
                        aria-label={photo.alt}
                      >
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          fill
                          sizes="128px"
                          className="object-cover"
                        />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   模块二 · 电影级全屏光箱
══════════════════════════════════════════════════ */
function Lightbox({
  photo,
  eventName,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  photo: EventPhoto;
  eventName: string;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  /* 依据原图宽高比 + 视口，算出“恰好撑满且不裁切”的尺寸 */
  const aspect = photo.width / photo.height;
  const widthCSS = `min(90vw, ${(85 * aspect).toFixed(3)}vh)`;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center
                 bg-black/85 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: EASE_SOFT }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* ── 顶部信息条 ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="pointer-events-none absolute inset-x-0 top-6 z-10 flex justify-center
                   px-16 text-center text-[11px] uppercase tracking-[0.4em] text-white/60"
      >
        <span className="truncate font-medium">
          {eventName} · {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </motion.div>

      {/* ── 关闭 ── */}
      <motion.button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center
                   rounded-full border border-white/15 bg-white/[0.06] text-white/75
                   backdrop-blur-md transition-colors hover:bg-white/12 hover:text-white"
        aria-label="关闭"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </motion.button>

      {/* ── 上一张 / 下一张 ── */}
      {total > 1 && (
        <>
          <NavButton side="left" onClick={(e) => { e.stopPropagation(); onPrev(); }} />
          <NavButton side="right" onClick={(e) => { e.stopPropagation(); onNext(); }} />
        </>
      )}

      {/* ═══════ 共享布局放大：layoutId 与网格缩略图一一对应 ═══════ */}
      <motion.div
        layoutId={`photo-${photo.id}`}
        onClick={(e) => e.stopPropagation()}
        transition={{ type: 'spring', stiffness: 280, damping: 32, mass: 0.9 }}
        className="relative overflow-hidden rounded-2xl
                   ring-1 ring-white/12
                   shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85)]"
        style={{ width: widthCSS, aspectRatio: `${photo.width} / ${photo.height}` }}
      >
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="90vw"
          className="object-cover"
          priority
        />
        {/* 金线描边，与画廊整体语言呼应 */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl
                     ring-1 ring-inset ring-amber-200/15"
        />
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   光箱左右导航按钮
══════════════════════════════════════════════════ */
function NavButton({
  side,
  onClick,
}: {
  side: 'left' | 'right';
  onClick: (e: React.MouseEvent) => void;
}) {
  const isLeft = side === 'left';
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className={`absolute z-20 flex h-11 w-11 items-center justify-center rounded-full
                  border border-white/15 bg-white/[0.06] text-white/75 backdrop-blur-md
                  transition-colors hover:bg-white/12 hover:text-white
                  ${isLeft ? 'left-4 md:left-8' : 'right-4 md:right-8'}`}
      aria-label={isLeft ? '上一张' : '下一张'}
    >
      <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden>
        <path
          d={isLeft ? 'M8 1L1 8L8 15' : 'M2 1L9 8L2 15'}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );
}

export default FiveEventsGalleryShowcase;
