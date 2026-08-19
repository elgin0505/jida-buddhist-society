"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminPinLockProps {
  children: ReactNode;
}

const DEFAULT_PIN = "1080"; // 默认 4 位管理员密码 (常用于佛教 108 寓意)
const PIN_LENGTH = 4;

export function AdminPinLock({ children }: AdminPinLockProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState(false);
  const [isSettingNewPin, setIsSettingNewPin] = useState(false);
  const [customPin, setCustomPin] = useState<string>(DEFAULT_PIN);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查本地是否有保存自定义密码
    const savedPin = localStorage.getItem("jbs_admin_custom_pin") || DEFAULT_PIN;
    setCustomPin(savedPin);

    // 检查当前 session 是否已解锁
    const sessionAuth = sessionStorage.getItem("jbs_admin_authenticated");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleKeyPress = (num: string) => {
    if (pin.length < PIN_LENGTH) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === PIN_LENGTH) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin("");
    setError(false);
  };

  const verifyPin = (inputPin: string) => {
    if (inputPin === customPin) {
      // 验证成功
      setIsAuthenticated(true);
      sessionStorage.setItem("jbs_admin_authenticated", "true");
      setPin("");
    } else {
      // 密码错误：触发抖动
      setError(true);
      setTimeout(() => {
        setPin("");
      }, 500);
    }
  };

  const handleLock = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("jbs_admin_authenticated");
    setPin("");
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-golden-deep border-t-transparent" />
      </div>
    );
  }

  // 已解锁状态：渲染管理员页面，并在右上角显示锁定按钮
  if (isAuthenticated) {
    return (
      <div className="relative">
        {/* 顶部管理员状态提示栏 */}
        <div className="mb-4 flex items-center justify-between rounded-xl bg-jade/10 px-4 py-2 text-xs font-medium text-jade border border-jade/20">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-jade animate-pulse" />
            管理员权限已解锁 (当前会话有效)
          </span>
          <button
            onClick={handleLock}
            className="rounded-lg bg-white/80 px-2.5 py-1 font-semibold text-charcoal shadow-sm transition-all hover:bg-white active:scale-95"
          >
            🔒 锁定退出
          </button>
        </div>
        {children}
      </div>
    );
  }

  // 未解锁状态：渲染佛学会专属 PIN 码安全锁屏
  return (
    <div className="flex min-h-[550px] items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm rounded-3xl border border-white/80 bg-white/75 p-8 shadow-[0_24px_64px_-8px_rgba(201,162,39,0.25)] backdrop-blur-2xl text-center"
      >
        {/* 顶部图标 */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-golden-deep/15 text-golden-rich shadow-inner">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>

        <h3 className="text-xl font-bold text-charcoal">管理员安全验证</h3>
        <p className="mt-1 text-xs text-muted">
          请输入 4 位管理员通行码进入签到系统
        </p>

        {/* 4 位指示圆点 (含错误抖动动画) */}
        <motion.div
          animate={error ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="my-6 flex justify-center gap-4"
        >
          {Array.from({ length: PIN_LENGTH }).map((_, index) => {
            const isFilled = index < pin.length;
            return (
              <motion.div
                key={index}
                animate={{
                  scale: isFilled ? [1, 1.25, 1] : 1,
                  backgroundColor: error
                    ? "#c1121f"
                    : isFilled
                    ? "#b8860b"
                    : "rgba(232, 200, 114, 0.3)",
                }}
                transition={{ duration: 0.2 }}
                className="h-4 w-4 rounded-full border-2 border-golden-deep/40 shadow-inner"
              />
            );
          })}
        </motion.div>

        {/* 错误提示 */}
        <div className="h-6 mb-2">
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs font-semibold text-carmine"
              >
                通行码错误，请重新输入
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* 数字按键九宫格 */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <motion.button
              key={num}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleKeyPress(num)}
              className="flex h-14 w-full items-center justify-center rounded-2xl border border-ocher/30 bg-white/90 text-lg font-bold text-charcoal shadow-sm transition-all hover:bg-golden-deep/10 active:bg-golden-deep/20"
            >
              {num}
            </motion.button>
          ))}

          {/* 清空按钮 */}
          <button
            onClick={handleClear}
            className="flex h-14 w-full items-center justify-center rounded-2xl text-xs font-semibold text-muted transition-colors hover:text-charcoal"
          >
            清空
          </button>

          {/* 0 按键 */}
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => handleKeyPress("0")}
            className="flex h-14 w-full items-center justify-center rounded-2xl border border-ocher/30 bg-white/90 text-lg font-bold text-charcoal shadow-sm transition-all hover:bg-golden-deep/10 active:bg-golden-deep/20"
          >
            0
          </motion.button>

          {/* 退格删除按钮 */}
          <button
            onClick={handleDelete}
            className="flex h-14 w-full items-center justify-center rounded-2xl text-xs font-semibold text-muted transition-colors hover:text-charcoal"
            title="删除"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" />
              <line x1="18" y1="9" x2="12" y2="15" />
              <line x1="12" y1="9" x2="18" y2="15" />
            </svg>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
