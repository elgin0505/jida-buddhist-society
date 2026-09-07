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
    let isMounted = true;

    async function checkAuth() {
      const isAuthPage = pathname === "/auth" || pathname === "/auth/";

      // 1. 读取本地存储凭据
      let storedUser: any = null;
      try {
        const raw = localStorage.getItem("jbs_auth_user");
        if (raw) storedUser = JSON.parse(raw);
      } catch {
        localStorage.removeItem("jbs_auth_user");
      }

      // 未携带任何本地数据
      if (!storedUser || !storedUser.token) {
        if (isAuthPage) {
          if (isMounted) setAuthorized(true);
        } else {
          if (isMounted) {
            setAuthorized(false);
            router.replace("/auth");
          }
        }
        return;
      }

      // 2. 向服务端验证真实 JWT Session 有效性（彻底杜绝仅凭 DevTools 伪造 localStorage 绕过鉴权）
      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${storedUser.token}`,
          },
        });

        if (!isMounted) return;

        if (res.ok) {
          // Token 真实有效且匹配数据库修行者用户
          if (isAuthPage) {
            setAuthorized(false);
            router.replace("/dashboard");
          } else {
            setAuthorized(true);
          }
        } else {
          // Token 无效或已过期：清除伪造/失效凭据并强制踢回登录页
          localStorage.removeItem("jbs_auth_user");
          localStorage.removeItem("currentMemberId");

          if (isAuthPage) {
            setAuthorized(true);
          } else {
            setAuthorized(false);
            router.replace("/auth");
          }
        }
      } catch (err) {
        // 网络异常时，如果有本地有效 token 则保持降级可用
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
