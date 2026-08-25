import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/game/leaderboard: 获取木鱼音游精进榜 Top 10
export async function GET() {
  try {
    const scores = await prisma.zenGameScore.findMany({
      take: 10,
      orderBy: { score: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    const leaderboard = scores.map((s, idx) => ({
      rank: idx + 1,
      id: s.id,
      userId: s.userId,
      name: s.user?.name || "同修",
      score: s.score,
      maxCombo: s.maxCombo,
      achievedAt: s.achievedAt,
      title:
        s.score >= 8000
          ? "金刚妙觉"
          : s.score >= 5000
          ? "破迷居士"
          : s.score >= 3000
          ? "随喜行者"
          : "初发心",
    }));

    return NextResponse.json({ success: true, leaderboard });
  } catch (e: any) {
    console.error("[GameLeaderboard GET Error]", e?.message || e);
    return NextResponse.json(
      { error: "获取排行榜失败", leaderboard: [] },
      { status: 500 }
    );
  }
}

// POST /api/game/leaderboard: 提交新的修持成绩
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, userEmail, score, maxCombo } = body;

    if (typeof score !== "number" || typeof maxCombo !== "number") {
      return NextResponse.json({ error: "成绩数据无效" }, { status: 400 });
    }

    // 查找匹配的用户
    let targetUser = null;
    if (userId) {
      targetUser = await prisma.user.findFirst({
        where: { OR: [{ id: userId }, { email: userEmail }] },
      });
    }

    if (!targetUser && userEmail) {
      targetUser = await prisma.user.findUnique({
        where: { email: userEmail },
      });
    }

    if (targetUser) {
      // 记录成绩
      await prisma.zenGameScore.create({
        data: {
          userId: targetUser.id,
          score: Math.max(0, Math.floor(score)),
          maxCombo: Math.max(0, Math.floor(maxCombo)),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[GameLeaderboard POST Error]", e?.message || e);
    return NextResponse.json(
      { error: "保存成绩失败" },
      { status: 500 }
    );
  }
}
