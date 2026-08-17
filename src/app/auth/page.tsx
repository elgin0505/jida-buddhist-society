"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Loader2, Sparkles, Calendar } from "lucide-react";
import { toast } from "sonner";

type Mode = "login" | "register";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* ── 禅意背景层 ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* 暖色光晕底纹 */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 50% 0%, rgba(201, 162, 39, 0.15) 0%, transparent 80%),
              radial-gradient(ellipse 50% 60% at 100% 100%, rgba(45, 106, 79, 0.08) 0%, transparent 70%),
              radial-gradient(ellipse 50% 50% at 0% 50%, rgba(232, 200, 114, 0.10) 0%, transparent 70%)
            `,
          }}
        />
        {/* 金色莲花 SVG 水印 */}
        <svg
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.035]"
          width="680"
          height="680"
          viewBox="0 0 200 200"
          fill="none"
        >
          <path
            d="M100 20 C100 20, 120 55, 120 80 C120 95, 110 105, 100 110 C90 105, 80 95, 80 80 C80 55, 100 20, 100 20Z"
            fill="#c9a227"
          />
          <path
            d="M100 20 C100 20, 140 45, 150 70 C155 85, 145 100, 130 108 C120 100, 115 85, 115 75 C115 50, 100 20, 100 20Z"
            fill="#c9a227"
            opacity="0.8"
          />
          <path
            d="M100 20 C100 20, 60 45, 50 70 C45 85, 55 100, 70 108 C80 100, 85 85, 85 75 C85 50, 100 20, 100 20Z"
            fill="#c9a227"
            opacity="0.8"
          />
          <path
            d="M100 20 C100 20, 155 35, 170 60 C180 78, 165 98, 150 105 C140 95, 135 78, 135 68 C135 45, 100 20, 100 20Z"
            fill="#c9a227"
            opacity="0.55"
          />
          <path
            d="M100 20 C100 20, 45 35, 30 60 C20 78, 35 98, 50 105 C60 95, 65 78, 65 68 C65 45, 100 20, 100 20Z"
            fill="#c9a227"
            opacity="0.55"
          />
          <circle cx="100" cy="85" r="8" fill="#c9a227" opacity="0.3" />
          <path
            d="M100 110 L100 180"
            stroke="#c9a227"
            strokeWidth="3"
            opacity="0.25"
          />
          <path
            d="M100 140 C100 140, 85 150, 80 160"
            stroke="#c9a227"
            strokeWidth="2"
            opacity="0.2"
            fill="none"
          />
          <path
            d="M100 155 C100 155, 115 162, 120 170"
            stroke="#c9a227"
            strokeWidth="2"
            opacity="0.2"
            fill="none"
          />
        </svg>
      </div>

      {/* ── 顶部标题区 ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mb-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-golden-deep to-ocher shadow-lg shadow-golden-deep/20">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-charcoal dark:text-white sm:text-3xl">
          技大佛学会
        </h1>
        <p className="mt-1.5 text-sm text-muted dark:text-slate-400">
          出勤与积分追踪 · 会员系统
        </p>
      </motion.div>

      {/* ── 表单卡片（登录 / 注册 切换） ── */}
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

      {/* ── 底部装饰文字 ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 mt-10 text-center text-xs text-muted/60"
      >
        🪷 以慈悲心行善，以智慧心修行
      </motion.p>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  登录卡片
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function LoginCard({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
      <div className="rounded-3xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-800/80 p-8 shadow-[0_16px_64px_-12px_rgba(201,162,39,0.18),0_4px_24px_-4px_rgba(0,0,0,0.06)] ring-1 ring-white/50 dark:ring-white/5 backdrop-blur-xl">
        <h2 className="mb-1 text-xl font-bold text-charcoal dark:text-white">登录您的账户</h2>
        <p className="mb-7 text-sm text-muted dark:text-slate-400">
          输入您的邮箱和密码，继续您的修行之旅
        </p>

        {/* 邮箱 */}
        <div className="mb-5">
          <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold text-charcoal/70 dark:text-slate-300">
            电子邮箱
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/50" />
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl border border-ocher/25 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 pl-11 pr-4 text-sm text-charcoal dark:text-white shadow-inner shadow-white/50 dark:shadow-none outline-none transition-all placeholder:text-muted/40 focus:border-golden-deep/50 focus:ring-2 focus:ring-golden-deep/15"
            />
          </div>
        </div>

        {/* 密码 */}
        <div className="mb-7">
          <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold text-charcoal/70 dark:text-slate-300">
            密码
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/50" />
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 w-full rounded-xl border border-ocher/25 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 pl-11 pr-12 text-sm text-charcoal dark:text-white shadow-inner shadow-white/50 dark:shadow-none outline-none transition-all placeholder:text-muted/40 focus:border-golden-deep/50 focus:ring-2 focus:ring-golden-deep/15"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted/40 transition-colors hover:text-golden-rich"
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
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-golden-deep to-golden-rich py-3 text-sm font-bold text-white shadow-lg shadow-golden-deep/25 transition-all disabled:opacity-60"
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
        </motion.button>

        {/* 切换至注册 */}
        <p className="mt-6 text-center text-sm text-muted dark:text-slate-400">
          还没有账号？{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="font-semibold text-golden-rich underline-offset-2 transition-colors hover:text-golden-deep hover:underline"
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
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
        body: JSON.stringify({ name, email, password, birthday: birthday || undefined }),
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
      <div className="rounded-3xl border border-white/50 dark:border-white/10 bg-white/70 dark:bg-slate-800/80 p-8 shadow-[0_16px_64px_-12px_rgba(201,162,39,0.18),0_4px_24px_-4px_rgba(0,0,0,0.06)] ring-1 ring-white/50 dark:ring-white/5 backdrop-blur-xl">
        <h2 className="mb-1 text-xl font-bold text-charcoal dark:text-white">创建新账户</h2>
        <p className="mb-7 text-sm text-muted dark:text-slate-400">
          加入技大佛学会，开启功德积分之旅
        </p>

        {/* 姓名 */}
        <div className="mb-5">
          <label htmlFor="register-name" className="mb-1.5 block text-xs font-semibold text-charcoal/70 dark:text-slate-300">
            姓名
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/50" />
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="您的法名或本名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 w-full rounded-xl border border-ocher/25 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 pl-11 pr-4 text-sm text-charcoal dark:text-white shadow-inner shadow-white/50 dark:shadow-none outline-none transition-all placeholder:text-muted/40 focus:border-golden-deep/50 focus:ring-2 focus:ring-golden-deep/15"
            />
          </div>
        </div>

        {/* 邮箱 */}
        <div className="mb-5">
          <label htmlFor="register-email" className="mb-1.5 block text-xs font-semibold text-charcoal/70 dark:text-slate-300">
            电子邮箱
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/50" />
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl border border-ocher/25 bg-white/80 pl-11 pr-4 text-sm text-charcoal shadow-inner shadow-white/50 outline-none transition-all placeholder:text-muted/40 focus:border-golden-deep/50 focus:ring-2 focus:ring-golden-deep/15 dark:border-white/10 dark:bg-slate-800/80 dark:text-white"
            />
          </div>
        </div>

        {/* 生日 */}
        <div className="mb-5">
          <label htmlFor="register-birthday" className="mb-1.5 flex items-center justify-between text-xs font-semibold text-charcoal/70 dark:text-slate-300">
            <span>出生日期 (选填)</span>
            <span className="text-[10px] font-normal text-golden-rich">✨ 生日当天有惊喜</span>
          </label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/50" />
            <input
              id="register-birthday"
              name="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="h-12 w-full rounded-xl border border-ocher/25 bg-white/80 pl-11 pr-4 text-sm text-charcoal shadow-inner shadow-white/50 outline-none transition-all focus:border-golden-deep/50 focus:ring-2 focus:ring-golden-deep/15 dark:border-white/10 dark:bg-slate-800/80 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
        </div>

        {/* 密码 */}
        <div className="mb-3">
          <label htmlFor="register-password" className="mb-1.5 block text-xs font-semibold text-charcoal/70 dark:text-slate-300">
            设置密码
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/50" />
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
              className="h-12 w-full rounded-xl border border-ocher/25 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 pl-11 pr-12 text-sm text-charcoal dark:text-white shadow-inner shadow-white/50 dark:shadow-none outline-none transition-all placeholder:text-muted/40 focus:border-golden-deep/50 focus:ring-2 focus:ring-golden-deep/15"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted/40 transition-colors hover:text-golden-rich"
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
                      : "#e5e0d8",
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
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-golden-deep to-golden-rich py-3 text-sm font-bold text-white shadow-lg shadow-golden-deep/25 transition-all disabled:opacity-60"
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
        </motion.button>

        {/* 切换至登录 */}
        <p className="mt-6 text-center text-sm text-muted dark:text-slate-400">
          已有账号？{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="font-semibold text-golden-rich underline-offset-2 transition-colors hover:text-golden-deep hover:underline"
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
