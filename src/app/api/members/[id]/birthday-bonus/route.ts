import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { verifyAdminPin } from "@/lib/adminAuth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 查询会员
    const member = await prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json({ error: "会员档案不存在" }, { status: 404 });
    }

    // 2. 鉴权：会员本人或管理员
    const adminAuth = verifyAdminPin(request);
    if (!adminAuth.isValid) {
      const { session, errorResponse } = requireAuth(request);
      if (errorResponse) return errorResponse;

      if (
        session?.memberId &&
        session.memberId !== member.id &&
        session.userId !== member.userId
      ) {
        return NextResponse.json(
          { error: "越权操作拒绝：仅允许为本人领取生辰福气积分" },
          { status: 403 }
        );
      }
    }

    // 3. 防刷限制：检查当年是否已领取过生辰积分
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    const alreadyClaimed = await prisma.attendanceLog.findFirst({
      where: {
        memberId: id,
        eventName: "生辰福气积分",
        dateTime: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    if (alreadyClaimed) {
      return NextResponse.json(
        { error: "您今年已领取过生辰福气积分，明年再来结缘吧！" },
        { status: 400 }
      );
    }

    // 4. 发放 2 积分并记录日志
    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        totalPoints: { increment: 2 },
      },
    });

    await prisma.attendanceLog.create({
      data: {
        memberId: id,
        eventName: "生辰福气积分",
        pointsEarned: 2,
        dateTime: new Date(),
      },
    });

    return NextResponse.json(
      { message: "生辰福气积分领取成功！法喜充满", totalPoints: updatedMember.totalPoints },
      { status: 200 }
    );
  } catch (error) {
    console.error("Birthday bonus error:", error);
    return NextResponse.json(
      { error: "发发生辰积分失败，请稍后重试" },
      { status: 500 }
    );
  }
}
