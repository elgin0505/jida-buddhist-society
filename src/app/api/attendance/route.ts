import { NextResponse } from "next/server";
import { prisma, recalculateMemberPoints } from "@/lib/prisma";
import { logAttendanceToGoogleSheet } from "@/lib/googleSheets";
import { verifyAdminPin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  const logs = await prisma.attendanceLog.findMany({
    where: memberId ? { memberId } : undefined,
    orderBy: { dateTime: "desc" },
    include: {
      member: { select: { name: true, memberId: true } },
    },
    take: 50,
  });

  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  // 1. 安全校验：验证管理员权限
  const auth = verifyAdminPin(request);
  if (!auth.isValid && auth.errorResponse) {
    return auth.errorResponse;
  }

  const body = await request.json();
  const { memberId, eventName, pointsEarned = 1 } = body;

  if (!memberId || !eventName) {
    return NextResponse.json(
      { error: "会员ID和活动名称为必填项" },
      { status: 400 }
    );
  }

  let member = await prisma.member.findUnique({ where: { id: memberId } });

  if (!member) {
    member = await prisma.member.findUnique({
      where: { memberId: memberId },
    });
  }

  if (!member) {
    return NextResponse.json({ error: "会员不存在" }, { status: 404 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 2. 幂等校验：防止同日重复签到
  const existing = await prisma.attendanceLog.findFirst({
    where: {
      memberId: member.id,
      eventName,
      dateTime: { gte: today, lt: tomorrow },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "该会员今日已签到此活动，无需重复签到" },
      { status: 409 }
    );
  }

  const log = await prisma.attendanceLog.create({
    data: {
      memberId: member.id,
      eventName,
      pointsEarned: Number(pointsEarned) || 1,
    },
  });

  const updatedMember = await recalculateMemberPoints(member.id);

  // 3. 异步非阻塞同步到 Google Sheet
  logAttendanceToGoogleSheet({
    memberId: member.memberId,
    memberName: member.name,
    eventName,
    pointsEarned: Number(pointsEarned) || 1,
    timestamp: log.dateTime.toISOString(),
  }).catch((err) => console.error("Google Sheets attendance sync error:", err));

  return NextResponse.json(
    { log, member: updatedMember },
    { status: 201 }
  );
}
