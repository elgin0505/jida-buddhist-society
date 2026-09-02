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

    const leaderboard = scores.map((item: any, index: number) => {
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
        trackName: item.trackName || "《大悲咒 (赛博轻灵版)》",
        achievedAt: item.achievedAt,
        title,
      };
    });

    return NextResponse.json({
      success: true,
      leaderboard,
    });
  } catch (error: any) {
    console.error("❌ [API Leaderboard GET Error]:", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "获取排行榜失败", leaderboard: [] },
      { status: 500 }
    );
  }
}

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  POST /api/game/leaderboard: 保存玩家的真实木鱼音游修持战绩
 *  [Unique Highest Score System] 每个玩家仅保留唯一最高分
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

    const cleanScore = Math.max(0, Math.floor(score));
    const cleanCombo = Math.max(0, Math.floor(maxCombo));
    const cleanTrack = trackName || "《大悲咒 (赛博轻灵版)》";

    // 1. 查找匹配的真实用户（支持 userId、email 或 member 表关联）
    let targetUser = null;

    if (userId) {
      targetUser = await prisma.user.findFirst({
        where: { id: userId },
      });
    }

    if (!targetUser && userEmail) {
      targetUser = await prisma.user.findUnique({
        where: { email: userEmail.toLowerCase().trim() },
      });
    }

    if (!targetUser && userId) {
      // 检查是否传的是 Member.id 或 Member.memberId
      const member = await prisma.member.findFirst({
        where: { OR: [{ id: userId }, { memberId: userId }] },
      });
      if (member && member.email) {
        targetUser = await prisma.user.findUnique({
          where: { email: member.email },
        });
      }
    }

    // 如果仍未匹配到（可能用户未登录直接试玩），寻找默认管理员或第一位注册用户
    if (!targetUser) {
      targetUser = await prisma.user.findFirst({
        orderBy: { createdAt: "asc" },
      });
    }

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "未找到注册修行者账户，请先注册或登录" },
        { status: 401 }
      );
    }

    // 2. Prisma Transaction: 保证每个玩家仅保留一条历史最高分记录
    const result = await prisma.$transaction(async (tx) => {
      const existingRecord = await tx.zenGameScore.findFirst({
        where: { userId: targetUser.id },
        orderBy: { score: "desc" },
      });

      if (!existingRecord) {
        // 首次创设战绩
        const created = await tx.zenGameScore.create({
          data: {
            userId: targetUser.id,
            score: cleanScore,
            maxCombo: cleanCombo,
            trackName: cleanTrack,
            achievedAt: new Date(),
          },
          include: {
            user: { select: { name: true, email: true } },
          },
        });
        return { action: "created", isNewHigh: true, record: created };
      }

      if (cleanScore > existingRecord.score) {
        // 新成绩突破最高纪录 -> 更新记录
        const updated = await tx.zenGameScore.update({
          where: { id: existingRecord.id },
          data: {
            score: cleanScore,
            maxCombo: Math.max(existingRecord.maxCombo, cleanCombo),
            trackName: cleanTrack,
            achievedAt: new Date(),
          },
          include: {
            user: { select: { name: true, email: true } },
          },
        });
        return { action: "updated", isNewHigh: true, record: updated };
      }

      // 未破纪录 -> 返回现有记录，不污染排行榜
      return { action: "kept", isNewHigh: false, record: existingRecord };
    });

    return NextResponse.json({
      success: true,
      action: result.action,
      isNewHigh: result.isNewHigh,
      data: result.record,
      message: result.isNewHigh
        ? "恭喜突破个人修持记录！最高分已载入功德榜。"
        : "修持完成，当前未超过历史最高分，已保留历史最佳战绩。",
    });
  } catch (error: any) {
    console.error("❌ [API Leaderboard POST Exception]:", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "保存修持成绩失败" },
      { status: 500 }
    );
  }
}
