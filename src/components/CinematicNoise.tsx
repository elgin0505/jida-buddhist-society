"use client";

import React from "react";

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  电影级物理噪点遮罩层 (Cinematic Film Grain & Dithering Overlay)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 核心原理：
 * 1. 使用纯 SVG 原生 <feTurbulence> 实时生成高频分形噪点，0 外部图片资源，0 网络开销。
 * 2. 彻底消除 CSS 大面积渐变背景下的“色彩圈/断层阶梯” (Color Banding)。
 * 3. 赋予页面犹如宣纸 (Xuan Paper) 与 35mm 电影胶片般的温润微质感。
 * 4. 样式配置：pointer-events-none (穿透点击) + z-[9999] (最顶层) + 3.8% 极微透明度 + mix-blend-overlay。
 */
export function CinematicNoise() {
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
