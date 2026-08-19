"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { ZenLogo3D } from "@/components/ZenLogo3D";
import { InkRippleButton } from "@/components/InkRippleButton";
import { FloatingDharmaQuote } from "@/components/FloatingDharmaQuote";
import { useZenAudio } from "@/hooks/useZenAudio";

// Dynamic import MindfulJourney (佛陀与十大弟子的恒河行脚)
const MindfulJourney = dynamic(
  () => import("@/components/MindfulJourney").then((mod) => ({ default: mod.MindfulJourney })),
  { ssr: false }
);

type Mode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* ── 1. 佛陀与十大弟子的恒河行脚 · 视差互动背景 ── */}
      <Suspense fallback={null}>
        <MindfulJourney />
      </Suspense>

      {/* ── 1.5. 侘寂浮空文字 (Wabi-Sabi Whitespace) ── */}
      <FloatingDharmaQuote />

      {/* ── 2. 3D 悬浮 Logo ── */}
      <ZenLogo3D />

      {/* ── 3. 极致玻璃态前景表单卡片 ── */}
      <div className="relative z-10 w-full max-w-[420px]">
        <AnimatePresence mode="wait">
          {mode === "login" ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, rotateY: -90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 90 }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              style={{ perspective: 1200 }}
            >
              <LoginCard onSwitch={() => setMode("register")} />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, rotateY: 90 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -90 }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
              style={{ perspective: 1200 }}
            >
              <RegisterCard onSwitch={() => setMode("login")} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  玻璃态卡片样式 (共用)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const GLASS_CARD_CLASS =
  "rounded-3xl border border-white/40 dark:border-white/20 " +
  "bg-white/20 dark:bg-black/30 " +
  "p-8 " +
  "shadow-[0_16px_64px_-12px_rgba(0,0,0,0.25),0_4px_24px_-4px_rgba(0,0,0,0.15)] " +
  "backdrop-blur-2xl";

const INPUT_CLASS =
  "h-12 w-full rounded-xl " +
  "border border-black/10 dark:border-white/10 dark:border-white/10 " +
  "bg-black/[0.04] dark:bg-white/[0.06] " +
  "pl-11 pr-4 text-sm text-black dark:text-white " +
  "shadow-inner shadow-black/10 " +
  "outline-none transition-all " +
  "placeholder:text-black/40 dark:text-white/30 " +
  "focus:border-golden-deep/60 focus:ring-2 focus:ring-golden-deep/25 focus:bg-black/[0.06] dark:focus:bg-white/15 " +
  "backdrop-blur-sm";

const INPUT_PW_CLASS =
  "h-12 w-full rounded-xl " +
  "border border-black/10 dark:border-white/10 dark:border-white/10 " +
  "bg-black/[0.04] dark:bg-white/[0.06] " +
  "pl-11 pr-12 text-sm text-black dark:text-white " +
  "shadow-inner shadow-black/10 " +
  "outline-none transition-all " +
  "placeholder:text-black/40 dark:text-white/30 " +
  "focus:border-golden-deep/60 focus:ring-2 focus:ring-golden-deep/25 focus:bg-black/[0.06] dark:focus:bg-white/15 " +
  "backdrop-blur-sm";

const LABEL_CLASS = "mb-1.5 block text-xs font-semibold text-black/70 dark:text-white/70";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  登录卡片
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function LoginCard({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { playZenSound } = useZenAudio();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("请填写完整的登录信息");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "登录失败");
        return;
      }

      // Store login session
      localStorage.setItem("jbs_auth_user", JSON.stringify(data));
      if (data.memberId) {
        localStorage.setItem("currentMemberId", data.memberId);
      }

      playZenSound(); // 触发空灵音效

      toast.success(`欢迎回来，${data.name}！`, {
        description: "正在跳转到仪表板…",
        icon: "🪷",
      });

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    } catch {
      toast.error("网络错误，请检查您的连接");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="on">
      <div className={GLASS_CARD_CLASS}>
        <h2 className="mb-1 text-xl font-bold text-black dark:text-white">登录您的账户</h2>
        <p className="mb-7 text-sm text-black/60 dark:text-white/50">
          输入您的邮箱和密码，继续您的修行之旅
        </p>

        {/* 邮箱 */}
        <div className="mb-5">
          <label htmlFor="login-email" className={LABEL_CLASS}>
            电子邮箱
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/35" />
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* 密码 */}
        <div className="mb-7">
          <label htmlFor="login-password" className={LABEL_CLASS}>
            密码
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/35" />
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_PW_CLASS}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-black/40 dark:text-white/30 transition-colors hover:text-golden-deep"
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
            >
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </div>

        {/* 提交按钮 */}
        <InkRippleButton
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-golden-deep to-golden-rich py-3 text-sm font-bold text-white shadow-lg shadow-golden-deep/30 transition-all disabled:opacity-60 dark:shadow-[0_0_24px_rgba(255,193,7,0.3)]"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                登录中…
              </>
            ) : (
              "登 录"
            )}
          </span>
          {/* 呼吸发光 */}
          {!loading && (
            <motion.div
              animate={{ opacity: [0, 0.15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-white"
            />
          )}
        </InkRippleButton>

        {/* 切换至注册 */}
        <p className="mt-6 text-center text-sm text-black/60 dark:text-white/45">
          还没有账号？{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="font-semibold text-golden-deep underline-offset-2 transition-colors hover:text-ocher hover:underline"
          >
            立即注册
          </button>
        </p>
      </div>
    </form>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  注册卡片
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function RegisterCard({ onSwitch }: { onSwitch: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { playZenSound } = useZenAudio();

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error("请填写完整的注册信息");
      return;
    }

    if (password.length < 6) {
      toast.error("密码长度至少为 6 个字符");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, birthday: (birthYear && birthMonth && birthDay) ? `${birthYear}-${birthMonth}-${birthDay}` : undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "注册失败");
        return;
      }

      // 注册成功，直接写入认证会话
      localStorage.setItem("jbs_auth_user", JSON.stringify(data));
      if (data.memberId) {
        localStorage.setItem("currentMemberId", data.memberId);
      }

      playZenSound(); // 触发空灵音效

      toast.success("注册成功，法喜充满！", {
        description: `您的专属会员编号为 ${data.memberCode || data.memberId}，正在为您开启修行空间…`,
        icon: "🪷",
        duration: 4000,
      });

      // 直接进入内部系统
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch {
      toast.error("网络错误，请检查您的连接");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="on">
      <div className={GLASS_CARD_CLASS}>
        <h2 className="mb-1 text-xl font-bold text-black dark:text-white">创建新账户</h2>
        <p className="mb-7 text-sm text-black/60 dark:text-white/50">
          加入技大佛学会，开启功德积分之旅
        </p>

        {/* 姓名 */}
        <div className="mb-5">
          <label htmlFor="register-name" className={LABEL_CLASS}>
            姓名
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/35" />
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="您的法名或本名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* 邮箱 */}
        <div className="mb-5">
          <label htmlFor="register-email" className={LABEL_CLASS}>
            电子邮箱
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/35" />
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* 生日 */}
        <div className="mb-5">
          <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-black/70 dark:text-white/70">
            <span>出生日期 (选填)</span>
            <span className="text-[10px] font-normal text-golden-deep">✨ 生日当天有惊喜</span>
          </label>
          <div className="flex gap-2 relative">
            <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/35 z-10" />
            <select
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className={`${INPUT_CLASS} !pl-9 !pr-2 w-1/3 text-center appearance-none cursor-pointer bg-no-repeat bg-[right_0.2rem_center] bg-[url('data:image/svg+xml;utf8,<svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>')]`}
            >
              <option value="" className="text-black">年</option>
              {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y} className="text-black">{y}</option>
              ))}
            </select>
            <select
              value={birthMonth}
              onChange={(e) => setBirthMonth(e.target.value)}
              className={`${INPUT_CLASS} !pl-2 !pr-2 w-1/3 text-center appearance-none cursor-pointer bg-no-repeat bg-[right_0.2rem_center] bg-[url('data:image/svg+xml;utf8,<svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>')]`}
            >
              <option value="" className="text-black">月</option>
              {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                <option key={m} value={m} className="text-black">{m}月</option>
              ))}
            </select>
            <select
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
              className={`${INPUT_CLASS} !pl-2 !pr-2 w-1/3 text-center appearance-none cursor-pointer bg-no-repeat bg-[right_0.2rem_center] bg-[url('data:image/svg+xml;utf8,<svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>')]`}
            >
              <option value="" className="text-black">日</option>
              {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => (
                <option key={d} value={d} className="text-black">{d}日</option>
              ))}
            </select>
          </div>
        </div>

        {/* 密码 */}
        <div className="mb-3">
          <label htmlFor="register-password" className={LABEL_CLASS}>
            设置密码
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/35" />
            <input
              id="register-password"
              name="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="至少 6 个字符"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_PW_CLASS}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-black/40 dark:text-white/30 transition-colors hover:text-golden-deep"
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
            >
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </div>

        {/* 密码强度指示器 */}
        <div className="mb-7">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((level) => (
              <motion.div
                key={level}
                className="h-1 flex-1 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{
                  scaleX: password.length > 0 ? 1 : 0,
                  backgroundColor:
                    passwordStrength >= level
                      ? passwordStrength <= 1
                        ? "#c1121f"
                        : passwordStrength <= 2
                        ? "#e07a5f"
                        : passwordStrength <= 3
                        ? "#c9a227"
                        : "#2d6a4f"
                      : "rgba(255,255,255,0.12)",
                }}
                transition={{ duration: 0.3, delay: level * 0.05 }}
                style={{ originX: 0 }}
              />
            ))}
          </div>
          {password.length > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1.5 text-[11px] font-medium"
              style={{
                color:
                  passwordStrength <= 1
                    ? "#c1121f"
                    : passwordStrength <= 2
                    ? "#e07a5f"
                    : passwordStrength <= 3
                    ? "#c9a227"
                    : "#2d6a4f",
              }}
            >
              {passwordStrength <= 1
                ? "弱 — 建议使用更复杂的密码"
                : passwordStrength <= 2
                ? "一般 — 可加入数字或符号"
                : passwordStrength <= 3
                ? "良好 — 安全性尚可"
                : "强 — 非常安全"}
            </motion.p>
          )}
        </div>

        {/* 提交按钮 */}
        <InkRippleButton
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-golden-deep to-golden-rich py-3 text-sm font-bold text-white shadow-lg shadow-golden-deep/30 transition-all disabled:opacity-60 dark:shadow-[0_0_24px_rgba(255,193,7,0.3)]"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                注册中…
              </>
            ) : (
              "创建账户"
            )}
          </span>
          {/* 呼吸发光 */}
          {!loading && (
            <motion.div
              animate={{ opacity: [0, 0.15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-white"
            />
          )}
        </InkRippleButton>

        {/* 切换至登录 */}
        <p className="mt-6 text-center text-sm text-black/60 dark:text-white/45">
          已有账号？{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="font-semibold text-golden-deep underline-offset-2 transition-colors hover:text-ocher hover:underline"
          >
            立即登录
          </button>
        </p>
      </div>
    </form>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  密码强度计算
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function getPasswordStrength(password: string): number {
  if (password.length === 0) return 0;

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return Math.min(4, score);
}
