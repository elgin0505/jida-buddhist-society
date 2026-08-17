"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. 注册 Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // 2. 检测是否已经处于独立 App 模式运行 (Standalone)
    const isApp =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isApp);

    // 3. 检测 iOS 设备
    const isIosDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(isIosDevice);

    // 4. 监听 Chrome/Android 平台的 PWA 安装事件
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 如果是 iOS 且不是 Standalone 且未被用户手动关闭过，可显示安装提示
    if (isIosDevice && !isApp) {
      const dismissed = sessionStorage.getItem("jbs_pwa_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem("jbs_pwa_dismissed", "true");
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      {/* 底部居中的精美 PWA 安装引导浮条 */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          className="pointer-events-auto flex items-center justify-between rounded-2xl border border-white/80 bg-warm-white/95 p-3.5 shadow-[0_16px_40px_-6px_rgba(201,162,39,0.3)] backdrop-blur-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-golden-deep/15 text-xl shadow-inner">
              🪷
            </div>
            <div>
              <p className="text-xs font-bold text-charcoal">安装佛学会桌面 App</p>
              <p className="text-[10px] text-muted">添加到手机主屏幕，全屏秒开体验</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="rounded-xl bg-golden-deep px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition-all hover:bg-golden-rich active:scale-95"
            >
              一键添加
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg p-1 text-muted hover:text-charcoal"
              title="稍后再说"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      </div>

      {/* iOS Safari 添加主屏幕图文指引弹窗 */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSModal(false)}
              className="absolute inset-0 bg-charcoal/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-white/80 bg-warm-white/95 p-6 shadow-2xl backdrop-blur-2xl text-center"
            >
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-golden-deep/15 text-2xl">
                📱
              </div>

              <h4 className="text-lg font-bold text-charcoal">在 iPhone / iPad 上安装</h4>
              <p className="mt-1 text-xs text-muted">只需两步，即可将佛学会系统添加至主屏幕：</p>

              <div className="my-5 space-y-3 rounded-2xl bg-white/70 p-4 text-left text-xs text-charcoal border border-ocher/20">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-golden-deep text-[10px] font-bold text-white">
                    1
                  </span>
                  <p>
                    点击 Safari 浏览器底部的 <strong>「分享」</strong> 按钮（带有向上的箭头图标 <span className="inline-block px-1">⎋</span>）。
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-golden-deep text-[10px] font-bold text-white">
                    2
                  </span>
                  <p>
                    在弹出菜单中向下滑动，选择 <strong>「添加到主屏幕」</strong>（Add to Home Screen）。
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full rounded-xl bg-golden-deep py-3 text-xs font-bold text-white shadow-md hover:bg-golden-rich"
              >
                我已明白 · 开始使用
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
