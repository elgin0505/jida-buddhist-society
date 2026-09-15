import { useCallback, useSyncExternalStore } from 'react';

const mqlCache = new Map<number, MediaQueryList>();

function getMediaQuery(breakpoint: number): MediaQueryList | null {
  if (typeof window === 'undefined') return null;
  let mql = mqlCache.get(breakpoint);
  if (!mql) {
    mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    mqlCache.set(breakpoint, mql);
  }
  return mql;
}

/**
 * 响应式移动端设备检测 Hook
 * 基于 useSyncExternalStore 实现客户端同步求值，彻底解决 SSR 初始挂载水合竞态导致的桌面端全量高开销资源突发展开
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mql = getMediaQuery(breakpoint);
      if (!mql) return () => {};

      if (mql.addEventListener) {
        mql.addEventListener('change', callback);
        return () => mql.removeEventListener('change', callback);
      } else {
        // 兼容老版本 iOS Safari
        (mql as any).addListener(callback);
        return () => (mql as any).removeListener(callback);
      }
    },
    [breakpoint]
  );

  const getSnapshot = useCallback(() => {
    const mql = getMediaQuery(breakpoint);
    return mql ? mql.matches : false;
  }, [breakpoint]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};

export default useIsMobile;

