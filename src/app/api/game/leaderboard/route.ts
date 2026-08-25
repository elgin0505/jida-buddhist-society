import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  GET /api/game/leaderboard: 获取真实注册玩家的精进排行榜 Top 10
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export async function GET() {
  try {
    const scores = await prisma.zenGameScore.findMany({
      take: 10,
      orderBy: { score: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const leaderboard = scores.map((item, index) => {
      const score = item.score;
      let title = "初发心";
      if (score >= 8000) title = "金刚妙觉";
      else if (score >= 5000) title = "破迷居士";
      else if (score >= 3000) title = "随喜行者";

      return {
        rank: index + 1,
        id: item.id,
        userId: item.userId,
        name: item.user?.name || "精进同修",
        userEmail: item.user?.email || "",
        score: item.score,
        maxCombo: item.maxCombo,
        trackName: item.trackName || "常规修持",
        achievedAt: item.achievedAt,
        title,
      };
    });

    return NextResponse.json({
      success: true,
      leaderboard,
    });
  } catch (error: any) {
    console.error("❌ [Leaderboard API GET Error]:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "获取排行榜数据失败", leaderboard: [] },
      { status: 500 }
    );
  }
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  POST /api/game/leaderboard: 保存玩家的真实木鱼音游修持战绩
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userEmail, score, maxCombo, trackName } = body;

    if (typeof score !== "number" || typeof maxCombo !== "number") {
      return NextResponse.json(
        { success: false, error: "分数与连击数必须为有效数字" },
        { status: 400 }
      );
    }

    // 1. 根据 userId 或 email 查找对应真实注册用户
    let targetUser = null;
    if (userId) {
      targetUser = await prisma.user.findUnique({
        where: { id: userId },
      });
    }

    if (!targetUser && userEmail) {
      targetUser = await prisma.user.findUnique({
        where: { email: userEmail.toLowerCase().trim() },
      });
    }

    // 2. 如果未找到注册用户，尝试关联 Member 表并匹配 User
    if (!targetUser && userId) {
      const member = await prisma.member.findUnique({
        where: { id: userId },
      });
      if (member) {
        targetUser = await prisma.user.findUnique({
          where: { email: member.email },
        });
      }
    }

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "未找到关联的注册修行者账户，请先登录" },
        { status: 404 }
      );
    }

    // 3. 写入数据库战绩表
    const newRecord = await prisma.zenGameScore.create({
      data: {
        userId: targetUser.id,
        score: Math.max(0, Math.floor(score)),
        maxCombo: Math.max(0, Math.floor(maxCombo)),
        trackName: trackName || "《大悲咒 (赛博轻灵版)》",
      },
    });

    return NextResponse.json({
      success: true,
      data: newRecord,
      message: "战绩已成功载入功德簿！",
    });
  } catch (error: any) {
    console.error("❌ [Leaderboard API POST Error]:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "保存修持成绩失败" },
      { status: 500 }
    );
  }
}
