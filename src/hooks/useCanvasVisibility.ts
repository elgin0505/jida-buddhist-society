'use client';

import { useState, useEffect, RefObject } from 'react';

/**
 * 视口交汇与页面可见性挂起 Hook (Viewport & Tab Suspension Hook)
 *
 * 满足 Requirement R4 与 PROJECT.md 接口契约：
 * 1. 当容器滚出视口（离屏）或浏览器标签页处于后台（!document.hidden 为 false）时，返回 false；
 * 2. 供 3D Canvas / R3F 组件动态切换 frameloop="demand" 或停止渲染循环，彻底消除离屏 GPU 算力占用与显存泄漏；
 * 3. 重新回到视口且切回前台时，自动唤醒渲染循环。
 *
 * @param containerRef 包含 Canvas 画布的外层容器 DOM 引用
 * @returns boolean true 表示画布在视口内且标签页在前台处于激活渲染状态；false 表示处于挂起节流状态
 */
export function useCanvasVisibility<T extends HTMLElement = HTMLElement>(
  containerRef: RefObject<T | null>
): boolean {
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let inView = true;
    let docVisible = typeof document !== 'undefined' ? !document.hidden : true;

    const updateState = () => {
      setIsActive(inView && docVisible);
    };

    // 1. 视口交叉监听 (IntersectionObserver)
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined' && containerRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
          updateState();
        },
        { rootMargin: '100px' }
      );
      observer.observe(containerRef.current);
    }

    // 2. 浏览器标签页切换/后台挂起监听 (visibilitychange)
    const handleVisibilityChange = () => {
      docVisible = !document.hidden;
      updateState();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 初始状态评估
    updateState();

    return () => {
      if (observer) {
        observer.disconnect();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [containerRef]);

  return isActive;
}

export default useCanvasVisibility;
