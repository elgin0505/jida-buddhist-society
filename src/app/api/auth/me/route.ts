import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = getAuthSession(request);
  if (!session) {
    return NextResponse.json(
      { error: "未登录或登录会话已过期失效" },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { member: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "用户信息不存在或已被移除" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.member?.role ?? user.role ?? "学员",
      memberId: user.member?.id ?? null,
      memberCode: user.member?.memberId ?? null,
      totalPoints: user.member?.totalPoints ?? 0,
      photo: user.member?.photo ?? null,
    });
  } catch (error) {
    console.error("[AuthMe API Error]", error);
    return NextResponse.json(
      { error: "服务器内部异常" },
      { status: 500 }
    );
  }
}
