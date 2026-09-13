'use client';

import React, { useEffect } from 'react';
import { RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#FAF7F2] via-[#F6F1E5] to-[#F2EAE0] px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-golden-rich/10 border border-golden-rich/30 text-3xl shadow-sm mb-6">
        🪷
      </div>
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-charcoal font-serif mb-3">
        正念觉照 · 页面稍作休憩
      </h2>
      <p className="max-w-md text-xs sm:text-sm text-muted leading-relaxed mb-6">
        检测到网络环境或设备渲染突发微扰，无需担心，您可以尝试重新载入圣境或刷新页面。
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-full bg-golden-rich px-5 py-2.5 text-xs sm:text-sm font-semibold text-warm-white shadow-sm hover:bg-golden-deep transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          <span>重新载入</span>
        </button>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') window.location.href = '/';
          }}
          className="inline-flex items-center gap-2 rounded-full border border-ocher/30 bg-warm-white px-5 py-2.5 text-xs sm:text-sm font-medium text-charcoal hover:bg-ocher/10 transition-all active:scale-95 cursor-pointer"
        >
          <Home className="h-4 w-4" />
          <span>返回主页</span>
        </button>
      </div>
    </div>
  );
}
