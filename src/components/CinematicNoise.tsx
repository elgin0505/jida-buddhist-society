"use client";

import React from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  电影级物理噪点遮罩层 (Cinematic Film Grain & Dithering Overlay)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export function CinematicNoise() {
  const isMobile = useIsMobile();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // 未挂载或处于移动端时，由于 GPU 显存和性能限制，全屏 feTurbulence 滤镜极易导致 Chrome 浏览器直接崩溃渲染失败，因此移动端直接移除该噪点层
  if (!isMounted || isMobile) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] h-full w-full opacity-[0.038] mix-blend-overlay select-none"
      aria-hidden="true"
    >
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <filter id="zen-film-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#zen-film-grain)" />
      </svg>
    </div>
  );
}
