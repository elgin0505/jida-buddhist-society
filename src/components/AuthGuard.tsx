"use client";

import { useEffect, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LotusLoading } from "@/components/LotusLoading";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // 检查本地登录会话凭据
    let isAuthenticated = false;
    try {
      const authData = localStorage.getItem("jbs_auth_user");
      isAuthenticated = !!authData;
    } catch (e) {
      console.warn("localStorage access denied or failed", e);
    }

    const isAuthPage = pathname === "/auth" || pathname === "/auth/";

    if (isAuthPage) {
      if (isAuthenticated) {
        // 已登录用户访问登录页 -> 自动重定向至会员仪表板
        setAuthorized(false);
        router.replace("/dashboard");
      } else {
        // 未登录用户允许停留在登录/注册页
        setAuthorized(true);
      }
    } else {
      if (!isAuthenticated) {
        // 未登录用户访问任何受保护页面 -> 强行拦截并重定向至 /auth
        setAuthorized(false);
        router.replace("/auth");
      } else {
        // 已认证用户允许访问内部页面
        setAuthorized(true);
      }
    }
  }, [pathname, router]);

  // 鉴权中状态：展示优雅的禅意莲花加载动效，避免任何页面私密内容闪烁
  if (authorized === null || !authorized) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <LotusLoading text="正念觉照 · 正在验证修行者身份..." />
      </div>
    );
  }

  return <>{children}</>;
}
