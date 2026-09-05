"use client";

import React, { useRef, useEffect } from "react";

interface Dashboard3DMenuProps {
  points: number;
  attendanceCount: number;
  liveEventsCount: number;
  registeredMembersCount: number;
  onOpenScan: () => void;
}

export function Dashboard3DMenu({
  points,
  attendanceCount,
  liveEventsCount,
  registeredMembersCount,
  onOpenScan,
}: Dashboard3DMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dashboard = containerRef.current;
    if (!dashboard) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = dashboard.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const x = ((e.clientX - centerX) / window.innerWidth) * 20;
      const y = ((e.clientY - centerY) / window.innerHeight) * 20;
      
      const rotateX = Math.max(-15, Math.min(15, -y * 2));
      const rotateY = Math.max(-15, Math.min(15, x * 2));

      dashboard.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = dashboard.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const x = ((e.touches[0].clientX - centerX) / window.innerWidth) * 20;
        const y = ((e.touches[0].clientY - centerY) / window.innerHeight) * 20;

        const rotateX = Math.max(-15, Math.min(15, -y * 2));
        const rotateY = Math.max(-15, Math.min(15, x * 2));

        dashboard.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
      }
    };

    const handleReset = () => {
      dashboard.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg)`;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleReset);
    window.addEventListener("mouseleave", handleReset);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleReset);
      window.removeEventListener("mouseleave", handleReset);
    };
  }, []);

  return (
    <div className="w-full flex justify-center perspective-[1000px] mb-8">
      <div
        ref={containerRef}
        className="relative w-full max-w-[400px]"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.1s ease-out",
        }}
      >
        {/* 2x2 网格：展示 4 个基础信息卡片 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 表盘1：总积分 */}
          <div
            className="dashboard-card group relative overflow-hidden flex flex-col items-center justify-center p-5 rounded-3xl"
            style={{
              background: "rgba(255, 253, 245, 0.95)",
              boxShadow:
                "0 15px 35px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
              border: "1px solid rgba(255,255,255,0.4)",
              aspectRatio: "1",
              transform: "translateZ(30px)",
              transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease",
            }}
          >
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="card-icon w-12 h-12 rounded-full bg-gradient-to-br from-[#F2C94C] to-[#E9B44C] flex justify-center items-center text-xl text-white shadow-[0_5px_15px_rgba(233,180,76,0.5)] mb-3 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
              ⭐
            </div>
            <div className="font-bold text-[#332b22] text-[14px]">总积分</div>
            <div className="text-xs text-[#8a7a63] mt-1">{points} 分</div>
          </div>

          {/* 表盘2：出勤打卡 */}
          <div
            className="dashboard-card group relative overflow-hidden flex flex-col items-center justify-center p-5 rounded-3xl"
            style={{
              background: "rgba(255, 253, 245, 0.95)",
              boxShadow:
                "0 15px 35px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
              border: "1px solid rgba(255,255,255,0.4)",
              aspectRatio: "1",
              transform: "translateZ(30px)",
              transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease",
            }}
          >
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="card-icon w-12 h-12 rounded-full bg-gradient-to-br from-[#F2C94C] to-[#E9B44C] flex justify-center items-center text-xl text-white shadow-[0_5px_15px_rgba(233,180,76,0.5)] mb-3 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
              ✅
            </div>
            <div className="font-bold text-[#332b22] text-[14px]">出勤打卡</div>
            <div className="text-xs text-[#8a7a63] mt-1">共 {attendanceCount} 次</div>
          </div>

          {/* 表盘3：近期活动 */}
          <div
            className="dashboard-card group relative overflow-hidden flex flex-col items-center justify-center p-5 rounded-3xl"
            style={{
              background: "rgba(255, 253, 245, 0.95)",
              boxShadow:
                "0 15px 35px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
              border: "1px solid rgba(255,255,255,0.4)",
              aspectRatio: "1",
              transform: "translateZ(30px)",
              transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease",
            }}
          >
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="card-icon w-12 h-12 rounded-full bg-gradient-to-br from-[#F2C94C] to-[#E9B44C] flex justify-center items-center text-xl text-white shadow-[0_5px_15px_rgba(233,180,76,0.5)] mb-3 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
              🔥
            </div>
            <div className="font-bold text-[#332b22] text-[14px]">近期活动</div>
            <div className="text-xs text-[#8a7a63] mt-1">{liveEventsCount} 个进行中</div>
          </div>

          {/* 表盘4：注册人数 */}
          <div
            className="dashboard-card group relative overflow-hidden flex flex-col items-center justify-center p-5 rounded-3xl"
            style={{
              background: "rgba(255, 253, 245, 0.95)",
              boxShadow:
                "0 15px 35px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.8)",
              border: "1px solid rgba(255,255,255,0.4)",
              aspectRatio: "1",
              transform: "translateZ(30px)",
              transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease",
            }}
          >
            <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="card-icon w-12 h-12 rounded-full bg-gradient-to-br from-[#F2C94C] to-[#E9B44C] flex justify-center items-center text-xl text-white shadow-[0_5px_15px_rgba(233,180,76,0.5)] mb-3 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
              👥
            </div>
            <div className="font-bold text-[#332b22] text-[14px]">注册人数</div>
            <div className="text-xs text-[#8a7a63] mt-1">共 {registeredMembersCount} 人</div>
          </div>
        </div>

        {/* 夹在正中间的扫描按钮 (独立层级，更高突起) */}
        <div
          onClick={onOpenScan}
          className="dashboard-card cursor-pointer group absolute overflow-hidden flex flex-col items-center justify-center rounded-full z-10"
          style={{
            top: "50%",
            left: "50%",
            width: "110px",
            height: "110px",
            /* 绚丽的渐变翡翠色渲染 */
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            boxShadow:
              "0 20px 40px rgba(16, 185, 129, 0.35), 0 8px 15px rgba(16, 185, 129, 0.2), inset 0 2px 4px rgba(255,255,255,0.4)",
            border: "2px solid rgba(255,255,255,0.6)",
            // 使用 CSS transform 将其居中并赋予极高 Z 轴突起
            transform: "translate(-50%, -50%) translateZ(60px)",
            transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease",
          }}
        >
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.4)_0%,transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="text-white text-3xl drop-shadow-md mb-1 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">
            📷
          </div>
          <div className="font-bold text-white text-[12px] drop-shadow-sm tracking-wider">
            快速签到
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .dashboard-card {
          /* allow hover but no cursor */
        }
        .dashboard-card.cursor-pointer {
          pointer-events: auto;
        }
        /* 中间悬浮按钮特效强化 */
        .dashboard-card.cursor-pointer:hover {
          transform: translate(-50%, -50%) translateZ(80px) translateY(-5px) scale(1.05) !important;
          box-shadow: 0 30px 60px rgba(16, 185, 129, 0.4), 0 10px 20px rgba(16, 185, 129, 0.3) !important;
        }
        .dashboard-card.cursor-pointer:active {
          transform: translate(-50%, -50%) translateZ(30px) scale(0.95) !important;
          box-shadow: 0 5px 15px rgba(16, 185, 129, 0.4) !important;
        }
      `}} />
    </div>
  );
}
