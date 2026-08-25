import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  GET /api/game/leaderboard: 获取真实注册玩家的精进排行榜 Top 10
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export async function GET() {
  console.log("🔍 [API Leaderboard GET] 收到排行榜数据请求...");
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

    console.log(`✅ [API Leaderboard GET] 成功查询到 ${scores.length} 条战绩记录`);

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
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */
export async function POST(request: Request) {
  console.log("📝 [API Leaderboard POST] 收到战绩提交请求...");
  try {
    const body = await request.json();
    const { userId, userEmail, score, maxCombo, trackName } = body;

    console.log("📦 [API Leaderboard POST] 请求体数据:", {
      userId,
      userEmail,
      score,
      maxCombo,
      trackName,
    });

    if (typeof score !== "number" || typeof maxCombo !== "number") {
      console.warn("⚠️ [API Leaderboard POST] 缺少有效的分数或连击数");
      return NextResponse.json(
        { success: false, error: "分数与连击数必须为有效数字" },
        { status: 400 }
      );
    }

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
      console.warn("⚠️ [API Leaderboard POST] 数据库中未找到任何注册用户");
      return NextResponse.json(
        { success: false, error: "未找到注册修行者账户，请先注册或登录" },
        { status: 401 }
      );
    }

    // 2. 写入数据库战绩记录
    const cleanScore = Math.max(0, Math.floor(score));
    const cleanCombo = Math.max(0, Math.floor(maxCombo));
    const cleanTrack = trackName || "《大悲咒 (赛博轻灵版)》";

    const newRecord = await prisma.zenGameScore.create({
      data: {
        userId: targetUser.id,
        score: cleanScore,
        maxCombo: cleanCombo,
        trackName: cleanTrack,
      },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    console.log(`🎉 [API Leaderboard POST] 战绩成功入库: ID=${newRecord.id}, 玩家=${newRecord.user?.name}, 得分=${cleanScore}`);

    return NextResponse.json({
      success: true,
      data: newRecord,
      message: "战绩已成功载入功德簿！",
    });
  } catch (error: any) {
    console.error("❌ [API Leaderboard POST Exception]:", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "保存修持成绩失败" },
      { status: 500 }
    );
  }
}
