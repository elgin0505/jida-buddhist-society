import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSessionToken } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "请输入邮箱和密码" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. 防暴力破解限流校验 (基于 IP + 邮箱，每 15 分钟最多允许 5 次尝试)
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";
    const rateLimitKey = `login_${clientIp}_${normalizedEmail}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    if (!rateLimit.success) {
      const waitMinutes = Math.max(1, Math.ceil((rateLimit.resetTime - Date.now()) / (60 * 1000)));
      return NextResponse.json(
        { error: `登录尝试次数过多，为保障账户安全，请在 ${waitMinutes} 分钟后再试` },
        { status: 429 }
      );
    }

    // 2. 查找用户
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "邮箱或密码不正确" },
        { status: 401 }
      );
    }

    // 3. 校验密码
    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      const remainingMsg =
        rateLimit.remaining > 0
          ? `，还可尝试 ${rateLimit.remaining} 次`
          : "，次数超限已被临时锁定";
      return NextResponse.json(
        { error: `邮箱或密码不正确${remainingMsg}` },
        { status: 401 }
      );
    }

    // 4. 登录成功，重置限流计数器
    resetRateLimit(rateLimitKey);

    // 5. 查询关联会员档案
    const member = await prisma.member.findUnique({
      where: { email: normalizedEmail },
    });

    const role = member?.role ?? user.role ?? "学员";

    // 6. 生成 7 天有效期的真实 JWT Session Token
    const token = createSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      memberId: member?.id ?? null,
      memberCode: member?.memberId ?? null,
      role,
    });

    const response = NextResponse.json({
      token,
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      memberId: member?.id ?? null,
      memberCode: member?.memberId ?? null,
    });

    // 7. 设置 HTTP-only 安全 Cookie
    response.cookies.set("jbs_session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "登录失败，请稍后重试" },
      { status: 500 }
    );
  }
}
