'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Info } from 'lucide-react';
import { AboutDrawer } from '@/components/AboutDrawer';
import { ZenSoundToggle } from '@/components/ZenSoundToggle';

export function Header() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: '主页', href: '#top' },
    { label: '佛学班', href: '#classes' },
    { label: '五大活动', href: '#five-events' },
    { label: '更多活动', href: '#more-events' },
  ];

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-40 border-b border-ocher/20 bg-warm-white/80 backdrop-blur-md transition-all duration-300">
        <div className="mx-auto flex h-16 sm:h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-8">
          {/* ── 1. 左上角 (Logo & 组织名称) ── */}
          <Link href="#top" className="group flex items-center gap-2.5 sm:gap-3">
            <div className="relative h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-full border border-golden-rich/30 bg-warm-cream shadow-sm transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="技大佛学会 Logo"
                fill
                priority
                className="object-cover"
              />
            </div>
            <div>
              <span className="block text-sm sm:text-base font-bold text-charcoal tracking-tight">
                技大佛学会
              </span>
              <span className="hidden sm:block text-[10px] text-muted -mt-0.5 tracking-wider uppercase">
                UTeM Buddhist Society
              </span>
            </div>
          </Link>

          {/* ── 2. 居中交互按钮 (Pill Navigation 胶囊导航) ── */}
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-ocher/35 bg-warm-white/90 p-1.5 shadow-sm shadow-charcoal/5 backdrop-blur-xl">
            {navLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-charcoal/80 transition-all hover:bg-ocher/25 hover:text-charcoal"
              >
                {item.label}
              </a>
            ))}
            <button
              onClick={() => setIsAboutOpen(true)}
              className="flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-semibold text-golden-rich transition-all hover:bg-golden-rich/10 hover:text-golden-rich cursor-pointer"
            >
              <Info className="h-3 w-3" />
              <span>关于</span>
            </button>
          </nav>

          {/* ── 3. 右上角 (声场开关 & 登入/注册 按钮) ── */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ZenSoundToggle />
            <Link
              href="/auth"
              className="inline-flex items-center rounded-full bg-golden-rich px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold text-warm-white shadow-sm shadow-golden-rich/30 transition-all duration-300 hover:bg-golden-deep hover:scale-[1.03] active:scale-[0.98]"
            >
              <span>登入/注册</span>
            </Link>

            {/* 移动端菜单切换按钮 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-full p-2 text-charcoal transition-colors hover:bg-ocher/20 md:hidden cursor-pointer"
              aria-label="打开导航菜单"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* 移动端折叠菜单 (Mobile Dropdown) */}
        {mobileMenuOpen && (
          <div className="border-t border-ocher/20 bg-warm-white/95 px-4 py-4 shadow-lg backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-2">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-charcoal transition-colors hover:bg-ocher/20"
                >
                  {item.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsAboutOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-golden-rich transition-colors hover:bg-golden-rich/10 text-left cursor-pointer"
              >
                <Info className="h-4 w-4" />
                <span>关于技大佛学会 & 开发者</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* “关于” 抽屉模态框 */}
      <AboutDrawer isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
}
