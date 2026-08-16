import { NextResponse } from "next/server";
import { prisma, recalculateMemberPoints } from "@/lib/prisma";

export async function GET() {
  const rewards = await prisma.reward.findMany({
    orderBy: { pointsRequired: "asc" },
  });

  return NextResponse.json(rewards);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { memberId, rewardId } = body;

  if (!memberId || !rewardId) {
    return NextResponse.json(
      { error: "会员ID和奖品ID为必填项" },
      { status: 400 }
    );
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  const reward = await prisma.reward.findUnique({ where: { id: rewardId } });

  if (!member) {
    return NextResponse.json({ error: "会员不存在" }, { status: 404 });
  }

  if (!reward) {
    return NextResponse.json({ error: "奖品不存在" }, { status: 404 });
  }

  if (reward.stock <= 0) {
    return NextResponse.json({ error: "奖品已兑完" }, { status: 400 });
  }

  if (member.totalPoints < reward.pointsRequired) {
    return NextResponse.json(
      { error: "积分不足，无法兑换" },
      { status: 400 }
    );
  }

  const [redemption, updatedMember] = await prisma.$transaction([
    prisma.redemption.create({
      data: {
        memberId,
        rewardId,
        pointsSpent: reward.pointsRequired,
      },
    }),
    prisma.reward.update({
      where: { id: rewardId },
      data: { stock: { decrement: 1 } },
    }),
    prisma.member.update({
      where: { id: memberId },
      data: { totalPoints: { decrement: reward.pointsRequired } },
    }),
  ]);

  await recalculateMemberPoints(memberId);

  return NextResponse.json(
    { redemption, member: updatedMember },
    { status: 201 }
  );
}
