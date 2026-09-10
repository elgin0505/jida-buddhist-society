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

  const isAuthPage = pathname === "/auth" || pathname === "/auth/";
  const isLandingPage = pathname === "/" || pathname === "";
  const isPublicPage = isAuthPage || isLandingPage;

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      // 1. 读取本地存储凭据
      let storedUser: any = null;
      try {
        const raw = localStorage.getItem("jbs_auth_user");
        if (raw) storedUser = JSON.parse(raw);
      } catch {
        localStorage.removeItem("jbs_auth_user");
      }

      // 未登录状态
      if (!storedUser || !storedUser.token) {
        if (isPublicPage) {
          if (isMounted) setAuthorized(true);
        } else {
          if (isMounted) {
            setAuthorized(false);
            router.replace("/auth");
          }
        }
        return;
      }

      // 2. 向服务端验证真实 JWT Session 有效性
      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${storedUser.token}`,
          },
        });

        if (!isMounted) return;

        if (res.ok) {
          // Token 有效：若在登录页，已登录用户自动跳转至仪表板；若在主页或其他页面，允许通行
          if (isAuthPage) {
            setAuthorized(false);
            router.replace("/dashboard");
          } else {
            setAuthorized(true);
          }
        } else {
          // Token 无效：清除凭据
          localStorage.removeItem("jbs_auth_user");
          localStorage.removeItem("currentMemberId");

          if (isPublicPage) {
            setAuthorized(true);
          } else {
            setAuthorized(false);
            router.replace("/auth");
          }
        }
      } catch (err) {
        // 网络异常时降级处理
        if (!isMounted) return;
        if (isAuthPage) {
          setAuthorized(false);
          router.replace("/dashboard");
        } else {
          setAuthorized(true);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, router, isAuthPage, isPublicPage]);

  // 公开页面（落地页与登录页）直接放行，避免首屏阻塞或加载闪烁
  if (isPublicPage) {
    return <>{children}</>;
  }

  // 私密页面鉴权中状态：展示禅意莲花加载动效
  if (authorized === null || !authorized) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <LotusLoading text="正念觉照 · 正在验证修行者身份..." />
      </div>
    );
  }

  return <>{children}</>;
}
