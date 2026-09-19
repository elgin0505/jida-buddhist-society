import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminPin } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const auth = verifyAdminPin(request);
  if (!auth.isValid && auth.errorResponse) {
    return auth.errorResponse;
  }

  const body = await request.json().catch(() => ({}));
  // memberIds: array of Member.id (cuid). If empty/absent → reset all.
  const memberIds: string[] = Array.isArray(body.memberIds) ? body.memberIds : [];
  const isSelectiveReset = memberIds.length > 0;

  const whereClause = isSelectiveReset ? { id: { in: memberIds } } : {};

  // Delete attendance logs for the selected members (or all)
  const { count: logsDeleted } = await prisma.attendanceLog.deleteMany(
    isSelectiveReset ? { where: { memberId: { in: memberIds } } } : undefined
  );

  // Reset totalPoints to 0 for the selected members (or all)
  await prisma.member.updateMany({
    where: whereClause,
    data: { totalPoints: 0 },
  });

  const affectedCount = isSelectiveReset ? memberIds.length : await prisma.member.count();
  const scope = isSelectiveReset ? `${affectedCount} 位指定会员` : `全部 ${affectedCount} 位会员`;

  return NextResponse.json({
    success: true,
    message: `已将 ${scope} 的积分与 ${logsDeleted} 条出勤记录归零`,
    affectedCount,
    logsDeleted,
  });
}
