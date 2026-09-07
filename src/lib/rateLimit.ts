interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// 全局内存缓存：记录不同 key 的尝试次数与重置时间
const rateLimitStore = new Map<string, RateLimitRecord>();

// 定期清理过期记录，防止内存泄漏 (每 2 分钟清理一次)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 2 * 60 * 1000);
}

/**
 * 内存滑动窗口限流器 (Brute-force 防暴力破解)
 * @param key 标识键（例如 IP + 邮箱）
 * @param limit 时间窗口内最大允许尝试次数，默认 5 次
 * @param windowMs 时间窗口长度（毫秒），默认 15 分钟
 */
export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // 首次或已过期，初始化记录
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, resetTime: now + windowMs };
  }

  if (record.count >= limit) {
    // 达到上限，拒绝请求
    return { success: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count, resetTime: record.resetTime };
}

/**
 * 重置指定 key 的限流计数（例如用户成功登录后调用）
 */
export function resetRateLimit(key: string) {
  rateLimitStore.delete(key);
}
