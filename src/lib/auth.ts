import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "jbs-zen-society-default-jwt-secret-key-2026";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  console.warn("[Auth Warning] JWT_SECRET 环境变量未配置，使用默认后备秘钥。生产环境请务必配置 JWT_SECRET！");
}

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  memberId?: string | null;
  memberCode?: string | null;
}

/**
 * 签署 7 天有效期的 JWT Session 令牌
 */
export function createSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * 校验并解析 JWT Session 令牌
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * 从 Request 中提取会话信息
 * 优先检查 Header: Authorization: Bearer <token>
 * 其次检查 Cookie: jbs_session_token
 */
export function getAuthSession(request: Request): SessionPayload | null {
  let token: string | null = null;

  // 1. 从 Authorization 头中获取
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }

  // 2. 从 Cookie 头中获取
  if (!token) {
    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/jbs_session_token=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * API 路由鉴权守卫：若未提供有效会话，则返回 401 响应
 */
export function requireAuth(request: Request): {
  session: SessionPayload | null;
  errorResponse?: NextResponse;
} {
  const session = getAuthSession(request);
  if (!session) {
    return {
      session: null,
      errorResponse: NextResponse.json(
        { error: "未经授权的操作：请先登录您的修行账户" },
        { status: 401 }
      ),
    };
  }
  return { session };
}
