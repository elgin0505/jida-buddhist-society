"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, KeyRound, ArrowLeft, Loader2, Eye, EyeOff, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { InkRippleButton } from "@/components/InkRippleButton";
import { useZenAudio } from "@/hooks/useZenAudio";

interface ForgotPasswordCardProps {
  onBackToLogin: () => void;
}

const GLASS_CARD_CLASS =
  "rounded-3xl border border-white/80 " +
  "bg-white/90 backdrop-blur-2xl " +
  "p-8 " +
  "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.7)_inset]";

const INPUT_CLASS =
  "h-12 w-full rounded-xl " +
  "border border-stone-200/90 " +
  "bg-white/95 " +
  "pl-11 pr-4 text-sm text-stone-800 font-medium " +
  "shadow-inner shadow-black/[0.03] " +
  "outline-none transition-all " +
  "placeholder:text-stone-400 " +
  "focus:border-golden-deep focus:ring-2 focus:ring-golden-deep/20 focus:bg-white " +
  "backdrop-blur-sm";

const INPUT_PW_CLASS =
  "h-12 w-full rounded-xl " +
  "border border-stone-200/90 " +
  "bg-white/95 " +
  "pl-11 pr-12 text-sm text-stone-800 font-medium " +
  "shadow-inner shadow-black/[0.03] " +
  "outline-none transition-all " +
  "placeholder:text-stone-400 " +
  "focus:border-golden-deep focus:ring-2 focus:ring-golden-deep/20 focus:bg-white " +
  "backdrop-blur-sm";

const LABEL_CLASS = "mb-1.5 block text-xs font-bold text-stone-700";

export function ForgotPasswordCard({ onBackToLogin }: ForgotPasswordCardProps) {
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { playZenSound } = useZenAudio();

  // 验证码倒计时处理 (60s)
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // 1. 发送 6 位 OTP 验证码
  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!email || !email.trim()) {
      toast.error("请输入注册时使用的电子邮箱");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "获取验证码失败");
        return;
      }

      playZenSound();
      if (data.devCode) {
        setCode(data.devCode);
        toast.info(`【调试模式】验证码为：${data.devCode}（已自动为您填入）`, {
          duration: 8000,
          icon: "🔑",
        });
      } else {
        toast.success("验证码已发送至您的邮箱！", {
          description: "请查收 6 位数字验证码（10 分钟内有效）。",
          icon: "🪷",
        });
      }

      setCountdown(60);
      setStep("reset");
    } catch {
      toast.error("网络连接异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 2. 校验验证码并重置密码
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || !code.trim()) {
      toast.error("请输入邮箱收到的 6 位验证码");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error("新密码长度不能少于 6 位");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("两次输入的密码不一致，请核对");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "重置密码失败");
        return;
      }

      playZenSound();
      toast.success("🎉 密码重置成功！", {
        description: "请使用您的新密码登录账户。",
        icon: "🪷",
      });

      setTimeout(() => {
        onBackToLogin();
      }, 600);
    } catch {
      toast.error("网络连接异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={GLASS_CARD_CLASS}>
      {/* 顶部返回导航 */}
      <button
        type="button"
        onClick={onBackToLogin}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-golden-deep transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回登录
      </button>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
          <span>找回修持密码</span>
          <ShieldCheck className="h-5 w-5 text-golden-deep" />
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          {step === "email"
            ? "输入您的注册邮箱，我们将发送 6 位安全验证码"
            : `验证码已发送至 ${email}`}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === "email" ? (
          /* ── 步骤一：输入邮箱获取验证码 ── */
          <motion.form
            key="step-email"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onSubmit={handleSendCode}
          >
            <div className="mb-6">
              <label htmlFor="forgot-email" className={LABEL_CLASS}>
                电子邮箱
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="forgot-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <InkRippleButton
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-golden-deep via-golden-rich to-ocher py-3 text-sm font-bold text-white shadow-lg shadow-golden-deep/30 transition-all disabled:opacity-60"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    正在发送验证码…
                  </>
                ) : (
                  "获取 6 位验证码"
                )}
              </span>
            </InkRippleButton>
          </motion.form>
        ) : (
          /* ── 步骤二：输入验证码与新密码 ── */
          <motion.form
            key="step-reset"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            onSubmit={handleResetPassword}
          >
            {/* 6 位 OTP 验证码 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="otp-code" className={LABEL_CLASS}>
                  6 位数字验证码
                </label>
                <button
                  type="button"
                  disabled={countdown > 0 || loading}
                  onClick={() => handleSendCode()}
                  className="text-xs font-semibold text-golden-deep hover:text-ocher transition-colors disabled:text-stone-400 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `重新发送 (${countdown}s)` : "重新发送验证码"}
                </button>
              </div>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-golden-deep" />
                <input
                  id="otp-code"
                  type="text"
                  maxLength={6}
                  required
                  placeholder="6 位验证码 (如 839201)"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className={`${INPUT_CLASS} font-mono tracking-widest text-base font-bold text-golden-rich`}
                />
              </div>
            </div>

            {/* 新密码 */}
            <div className="mb-4">
              <label htmlFor="new-password" className={LABEL_CLASS}>
                新密码
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="至少 6 位字符"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={INPUT_PW_CLASS}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-stone-400 transition-colors hover:text-golden-deep"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 确认新密码 */}
            <div className="mb-6">
              <label htmlFor="confirm-new-password" className={LABEL_CLASS}>
                确认新密码
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="confirm-new-password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="再次输入新密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={INPUT_PW_CLASS}
                />
              </div>
            </div>

            <InkRippleButton
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-golden-deep via-golden-rich to-ocher py-3 text-sm font-bold text-white shadow-lg shadow-golden-deep/30 transition-all disabled:opacity-60"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    正在重设密码…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    确认重设密码
                  </>
                )}
              </span>
            </InkRippleButton>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
