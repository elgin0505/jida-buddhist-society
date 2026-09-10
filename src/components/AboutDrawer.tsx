'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Sparkles, Send, Mail, Code, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface AboutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

export function AboutDrawer({ isOpen, onClose }: AboutDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 (Backdrop) */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-sm"
          />

          {/* 侧边滑出面板 (Drawer) */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col justify-between border-l border-ocher/30 bg-warm-white/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl"
          >
            {/* 头部区 */}
            <div>
              <div className="flex items-center justify-between border-b border-ocher/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border border-golden-rich/40 bg-warm-cream shadow-sm">
                    <Image
                      src="/logo.png"
                      alt="技大佛学会 Logo"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-charcoal sm:text-lg">技大佛学会</h3>
                    <p className="text-xs text-muted">UTeM Buddhist Society</p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  aria-label="关闭关于面板"
                  className="rounded-full p-2 text-muted transition-colors hover:bg-ocher/20 hover:text-charcoal cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 宗旨与简介 */}
              <div className="mt-6 space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-golden-rich/10 px-3 py-1 text-xs font-semibold text-golden-rich">
                  <Sparkles className="h-3 w-3" />
                  弘扬正信 · 启迪慧命
                </span>
                <p className="text-sm leading-relaxed text-charcoal/80">
                  技大佛学会创立于马六甲马来西亚技术大学（UTeM）。我们致力于为校园青年提供一个修习佛法、安顿身心、实践慈悲的温暖殿堂。通过定期佛学班、禅修营及公益活动，携手同修福慧双修。
                </p>
              </div>

              {/* 醒目开发者致敬卡片 */}
              <div className="mt-6 rounded-2xl border border-golden-rich/25 bg-gradient-to-br from-warm-cream/80 via-warm-white to-ocher-light/20 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-golden-rich">
                  <Code className="h-3.5 w-3.5" />
                  系统开发与设计致敬
                </div>

                <div className="mt-3 flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-black tracking-tight text-charcoal sm:text-xl">
                      Developed by 刘俊宏
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      Full-Stack Architecture & 3D Interactive Design
                    </p>
                  </div>
                  <div className="rounded-full bg-golden-rich/15 p-2 text-golden-rich">
                    <Heart className="h-4 w-4 fill-golden-rich" />
                  </div>
                </div>

                <div className="mt-3.5 border-t border-ocher/20 pt-3 text-xs text-muted leading-relaxed">
                  本平台采用 Next.js App Router、Framer Motion 视差流体动画与 Three.js 沉浸式禅境技术栈构建，以数字美学传递静谧与庄严。
                </div>
              </div>

              {/* 官方社交媒体矩阵 */}
              <div className="mt-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-golden-rich">
                  关注我们 · 社交媒体矩阵
                </h4>

                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <a
                    href="https://t.me/jidabuddhistsociety"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl border border-ocher/20 bg-warm-white p-3 text-xs font-medium text-charcoal transition-all hover:border-golden-rich hover:bg-warm-cream/60 hover:shadow-sm"
                  >
                    <div className="rounded-lg bg-[#229ED9]/10 p-1.5 text-[#229ED9]">
                      <Send className="h-4 w-4" />
                    </div>
                    <span>Telegram 频道</span>
                    <ExternalLink className="ml-auto h-3 w-3 text-muted/60" />
                  </a>

                  <a
                    href="https://instagram.com/utem_buddhist"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 rounded-xl border border-ocher/20 bg-warm-white p-3 text-xs font-medium text-charcoal transition-all hover:border-golden-rich hover:bg-warm-cream/60 hover:shadow-sm"
                  >
                    <div className="rounded-lg bg-[#E1306C]/10 p-1.5 text-[#E1306C]">
                      <InstagramIcon className="h-4 w-4" />
                    </div>
                    <span>Instagram</span>
                    <ExternalLink className="ml-auto h-3 w-3 text-muted/60" />
                  </a>

                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="col-span-2 flex items-center gap-2.5 rounded-xl border border-ocher/20 bg-warm-white p-3 text-xs font-medium text-charcoal transition-all hover:border-golden-rich hover:bg-warm-cream/60 hover:shadow-sm"
                  >
                    <div className="rounded-lg bg-[#25D366]/10 p-1.5 text-[#25D366]">
                      <WhatsAppIcon className="h-4 w-4" />
                    </div>
                    <span>WhatsApp</span>
                    <ExternalLink className="ml-auto h-3 w-3 text-muted/60" />
                  </a>

                  <a
                    href="mailto:jidafxh2014@gmail.com"
                    className="col-span-2 flex items-center gap-2.5 rounded-xl border border-ocher/20 bg-warm-white p-3 text-xs font-medium text-charcoal transition-all hover:border-golden-rich hover:bg-warm-cream/60 hover:shadow-sm"
                  >
                    <div className="rounded-lg bg-golden-rich/10 p-1.5 text-golden-rich">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span>jidafxh2014@gmail.com</span>
                    <ExternalLink className="ml-auto h-3 w-3 text-muted/60" />
                  </a>
                </div>
              </div>
            </div>

            {/* 底部信息 */}
            <div className="mt-8 border-t border-ocher/20 pt-4 text-center">
              <p className="text-[11px] text-muted">
                © {new Date().getFullYear()} 技大佛学会 (UTeM Buddhist Society). All rights reserved.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
