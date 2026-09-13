import { useState, useEffect } from 'react';

/**
 * useIsMounted
 * 安全的客户端挂载检测钩子，确保首次 SSR 与客户端首次渲染完全匹配，
 * 避免在组件初次渲染期间读取浏览器特有属性引起的 Hydration Mismatch。
 */
export function useIsMounted(): boolean {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}

export default useIsMounted;
