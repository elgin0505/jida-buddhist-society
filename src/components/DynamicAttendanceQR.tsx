"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

const REFRESH_MS = 15000;
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface Props {
  eventId: string;
  /** 签到落地页的域名，不传则取当前 window.location.origin */
  baseUrl?: string;
  size?: number;
}

export function DynamicAttendanceQR({ eventId, baseUrl, size = 160 }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15);

  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      setError(false);
      const pin = typeof window !== "undefined" ? sessionStorage.getItem("jbs_admin_pin") || "" : "";
      const res = await fetch("/api/admin/qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(pin ? { "x-admin-pin": pin } : {}),
        },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) throw new Error("请求失败");
      const data = await res.json();
      setToken(data.token);
      setSecondsLeft(15);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(true);
      setLoading(false);
    }
  }, [eventId]);

  // 15 秒轮询：拿新 token
  useEffect(() => {
    fetchToken();
    refreshTimer.current = setInterval(fetchToken, REFRESH_MS);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [fetchToken]);

  // 每秒更新中心数字（纯展示，不发请求）
  useEffect(() => {
    tickTimer.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      if (tickTimer.current) clearInterval(tickTimer.current);
    };
  }, []);

  const handleRetry = () => {
    setLoading(true);
    fetchToken();
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(fetchToken, REFRESH_MS);
  };

  const origin = baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
  const qrValue = token ? `${origin}/attend?token=${token}` : "";

  // 动态尺寸计算
  const containerSize = Math.max(132, size + 36);
  const centerPos = containerSize / 2;
  const computedRadius = (containerSize - 20) / 2;
  const computedCircumference = 2 * Math.PI * computedRadius;

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      <div
        className="relative flex items-center justify-center"
        style={{ width: containerSize, height: containerSize }}
      >
        {/* 环形倒计时进度条：key=token 让每次刷新时动画从头播放 */}
        <svg
          width={containerSize}
          height={containerSize}
          className="absolute -rotate-90 pointer-events-none"
        >
          <circle
            cx={centerPos}
            cy={centerPos}
            r={computedRadius}
            stroke="#e5e7eb"
            strokeWidth={6}
            fill="none"
          />
          {token && !error && (
            <motion.circle
              key={token}
              cx={centerPos}
              cy={centerPos}
              r={computedRadius}
              stroke="#c9a227"
              strokeWidth={6}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={computedCircumference}
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: computedCircumference }}
              transition={{ duration: 15, ease: "linear" }}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          {loading ? (
            <div
              className="animate-pulse rounded-2xl bg-warm-cream/60 flex items-center justify-center text-xs text-golden-rich"
              style={{ width: size, height: size }}
            >
              生成动态码中...
            </div>
          ) : error ? (
            <button
              onClick={handleRetry}
              className="flex flex-col items-center justify-center rounded-2xl border border-red-300 bg-red-50 text-xs text-red-600 hover:bg-red-100 p-4 transition-colors"
              style={{ width: size, height: size }}
            >
              <span className="font-bold">加载失败</span>
              <span className="mt-1 text-[11px] underline">点击重试</span>
            </button>
          ) : (
            <div className="rounded-2xl bg-white p-2.5 shadow-lg border border-golden-deep/30">
              <QRCodeSVG value={qrValue} size={size} level="M" />
            </div>
          )}
        </div>
      </div>

      {!loading && !error && (
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-golden-rich/10 border border-golden-rich/25 text-xs font-semibold text-golden-deep">
            <span className="inline-block w-2 h-2 rounded-full bg-golden-deep animate-ping" />
            <span>{secondsLeft}s 后自动刷新</span>
          </div>
          <p className="mt-1.5 text-xs text-muted">防截图动态验证码 · 同修扫描后完成签到</p>
        </div>
      )}
    </div>
  );
}

export default DynamicAttendanceQR;
