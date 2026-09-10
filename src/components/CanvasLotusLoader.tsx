"use client";

import React, { useEffect, useRef } from "react";

export function CanvasLotusLoader({ duration = 1000 }: { duration?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let W: number, H: number, centerX: number, centerY: number, baseSize: number;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      centerX = W * 0.5;
      centerY = H * 0.5;
      baseSize = Math.min(W, H) * 0.38; // 莲花基础半径
    };

    window.addEventListener("resize", resize);
    resize();

    // ========== 动画状态 ==========
    const startTime = performance.now();
    const DURATION = duration; // 完整绽放周期（毫秒），循环往复
    const PARTICLE_COUNT = 80; // 粒子数量

    // ========== 粒子系统 ==========
    class Particle {
      x: number = 0;
      y: number = 0;
      vx: number = 0;
      vy: number = 0;
      life: number = 0;
      maxLife: number = 0;
      size: number = 0;
      hue: number = 0;

      constructor() {
        this.reset();
      }
      reset() {
        // 初始在莲花中心附近
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 20;
        this.x = centerX + Math.cos(angle) * radius;
        this.y = centerY + Math.sin(angle) * radius;
        // 随机速度方向，向外飘散
        const speed = 0.2 + Math.random() * 0.8;
        const dir = Math.random() * Math.PI * 2;
        this.vx = Math.cos(dir) * speed;
        this.vy = Math.sin(dir) * speed - 0.15; // 略微向上
        this.life = 0;
        this.maxLife = 80 + Math.random() * 120; // 存活帧数
        this.size = 1 + Math.random() * 2.5;
        this.hue = 35 + Math.random() * 25; // 金色到暖黄
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.002; // 轻微重力
        this.life++;
        if (
          this.life > this.maxLife ||
          this.x < -50 ||
          this.x > W + 50 ||
          this.y < -50 ||
          this.y > H + 50
        ) {
          this.reset();
        }
      }
      draw(ctx: CanvasRenderingContext2D) {
        const alpha = 1 - this.life / this.maxLife;
        const flicker = 0.6 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.arc(
          this.x,
          this.y,
          this.size * (1 - (this.life / this.maxLife) * 0.5),
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${alpha * flicker})`;
        ctx.shadowColor = `hsla(${this.hue}, 80%, 60%, ${alpha * 0.6})`;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }

    // ========== 工具函数 ==========
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // ========== 绘制莲花花瓣 ==========
    const drawPetal = (
      ctx: CanvasRenderingContext2D,
      angle: number,
      outerRadius: number,
      innerRadius: number,
      petalWidth: number,
      colorTop: string,
      colorBottom: string,
      alpha: number,
      rotationAngle: number
    ) => {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotationAngle);

      const mid = (outerRadius + innerRadius) / 2;
      const width = petalWidth;

      const cp1x = 0,
        cp1y = -innerRadius;
      const cp2x = width * 0.7,
        cp2y = -innerRadius * 0.6;
      const cp3x = width,
        cp3y = -mid;
      const cp4x = width * 0.6,
        cp4y = -outerRadius * 0.9;
      const cp5x = 0,
        cp5y = -outerRadius;

      const gradient = ctx.createLinearGradient(0, -innerRadius, 0, -outerRadius);
      gradient.addColorStop(0, colorBottom);
      gradient.addColorStop(1, colorTop);

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(0, -innerRadius);
      // 左侧曲线
      ctx.bezierCurveTo(-cp2x, cp2y, -cp3x, -mid, -cp4x, cp5y);
      // 顶部尖点
      ctx.quadraticCurveTo(0, -outerRadius * 1.05, cp4x * 0.8, -outerRadius * 0.95);
      // 右侧曲线
      ctx.bezierCurveTo(cp3x, -mid, cp2x, cp2y, 0, -innerRadius);
      ctx.closePath();

      ctx.fillStyle = gradient;
      ctx.fill();

      // 边缘高光
      ctx.strokeStyle = `rgba(255, 230, 180, ${alpha * 0.5})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // 花瓣脉络
      ctx.globalAlpha = alpha * 0.25;
      ctx.beginPath();
      ctx.moveTo(0, -innerRadius);
      ctx.quadraticCurveTo(0, -mid, 0, -outerRadius * 0.9);
      ctx.strokeStyle = "rgba(255, 240, 200, 0.5)";
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.globalAlpha = alpha;

      ctx.restore();
    };

    // 绘制整朵莲花
    const drawLotus = (progress: number, rotation: number) => {
      const ease = easeInOutCubic(progress);

      // 外层花瓣
      const outerPetalCount = 8;
      const outerMaxRadius = baseSize;
      const outerMinRadius = baseSize * 0.1;
      const outerCurrentRadius = lerp(outerMinRadius, outerMaxRadius, ease);
      const outerWidth = baseSize * 0.22 * (0.5 + ease * 0.5);
      const outerAlpha = Math.min(1, progress * 1.5) * 0.95;

      for (let i = 0; i < outerPetalCount; i++) {
        const angleOffset = (i / outerPetalCount) * Math.PI * 2;
        const colorTop = `rgba(250, 220, 180, ${0.9})`;
        const colorBottom = `rgba(200, 150, 100, ${0.8})`;
        const spreadAngle = 0.1 * ease;
        drawPetal(
          ctx,
          angleOffset,
          outerCurrentRadius,
          outerCurrentRadius * 0.25,
          outerWidth,
          colorTop,
          colorBottom,
          outerAlpha,
          angleOffset + rotation + (i % 2 === 0 ? spreadAngle : -spreadAngle)
        );
      }

      // 内层花瓣
      const innerPetalCount = 8;
      const innerMaxRadius = baseSize * 0.7;
      const innerMinRadius = baseSize * 0.08;
      const innerCurrentRadius = lerp(innerMinRadius, innerMaxRadius, ease);
      const innerWidth = baseSize * 0.16 * (0.4 + ease * 0.6);
      const innerAlpha = Math.min(1, progress * 1.8) * 0.98;

      for (let i = 0; i < innerPetalCount; i++) {
        const angleOffset =
          (i / innerPetalCount) * Math.PI * 2 + Math.PI / innerPetalCount;
        const colorTop = `rgba(255, 235, 200, ${0.95})`;
        const colorBottom = `rgba(235, 180, 130, ${0.85})`;
        const spreadAngle = 0.15 * ease;
        drawPetal(
          ctx,
          angleOffset,
          innerCurrentRadius,
          innerCurrentRadius * 0.2,
          innerWidth,
          colorTop,
          colorBottom,
          innerAlpha,
          angleOffset + rotation * 0.7 + (i % 2 === 0 ? -spreadAngle : spreadAngle)
        );
      }

      // 花心
      const heartRadius = baseSize * 0.12 * (0.4 + ease * 0.6);
      const heartGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        heartRadius * 2
      );
      heartGradient.addColorStop(0, "rgba(255, 240, 190, 0.95)");
      heartGradient.addColorStop(0.5, "rgba(220, 170, 80, 0.9)");
      heartGradient.addColorStop(1, "rgba(160, 110, 50, 0.7)");
      ctx.beginPath();
      ctx.arc(centerX, centerY, heartRadius * 2, 0, Math.PI * 2);
      ctx.fillStyle = heartGradient;
      ctx.fill();

      // 莲子点
      const seedCount = 5;
      for (let s = 0; s < seedCount; s++) {
        const seedAngle = (s / seedCount) * Math.PI * 2 + rotation;
        const seedDist = heartRadius * 1.2;
        const seedX = centerX + Math.cos(seedAngle) * seedDist;
        const seedY = centerY + Math.sin(seedAngle) * seedDist;
        ctx.beginPath();
        ctx.arc(seedX, seedY, heartRadius * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(90, 60, 20, 0.7)";
        ctx.fill();
      }
    };

    // ========== 绘制中心光晕 ==========
    const drawGlow = (progress: number) => {
      const ease = easeInOutCubic(progress);
      const glowRadius =
        baseSize * (0.5 + ease * 0.8) * (1 + Math.sin(progress * Math.PI * 2) * 0.1);
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        glowRadius
      );
      gradient.addColorStop(0, `rgba(255, 220, 150, ${0.3 + ease * 0.3})`);
      gradient.addColorStop(0.4, `rgba(255, 180, 100, ${0.15 + ease * 0.2})`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(
        centerX - glowRadius,
        centerY - glowRadius,
        glowRadius * 2,
        glowRadius * 2
      );
    };

    // ========== 绘制背景 ==========
    const drawBackground = () => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      const vignetteGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        Math.min(W, H) * 0.2,
        centerX,
        centerY,
        Math.max(W, H) * 0.8
      );
      vignetteGradient.addColorStop(0, "rgba(0,0,0,0)");
      vignetteGradient.addColorStop(1, "rgba(0,0,0,0.7)");
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "rgba(255,255,255,0.02)";
      for (let i = 0; i < 15; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        ctx.fillRect(x, y, 1, 1);
      }
    };

    // ========== 动画循环 ==========
    const animate = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      let progress;
      const cycle = elapsed % (DURATION * 1.8);
      if (cycle < DURATION) {
        progress = cycle / DURATION;
      } else if (cycle < DURATION * 1.25) {
        progress = 1;
      } else {
        const closeTime = cycle - DURATION * 1.25;
        const closeDuration = DURATION * 0.55;
        progress = 1 - closeTime / closeDuration;
        progress = Math.max(0, progress);
      }

      const rotation = elapsed * 0.00015;

      drawBackground();
      drawGlow(progress);
      drawLotus(progress, rotation);

      for (const p of particles) {
        p.update();
        p.draw(ctx);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute bottom-[12%] text-[rgba(200,180,140,0.8)] tracking-[6px] text-sm animate-pulse">
        莲 · 生
      </div>
    </div>
  );
}
