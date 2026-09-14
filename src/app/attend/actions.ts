"use server";

import { prisma, recalculateMemberPoints } from "@/lib/prisma";
import { consumeAttendanceToken } from "@/lib/attendance-token";
import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { logAttendanceToGoogleSheet } from "@/lib/googleSheets";

export type CheckinResult =
  | { success: true; message: string; eventName?: string; pointsEarned?: number }
  | { success: false; message: string };

export async function checkinWithToken(
  token: string,
  fallbackMemberIdentifier?: string
): Promise<CheckinResult> {
  if (!token) {
    return { success: false, message: "二维码参数缺失，请重新扫码。" };
  }

  // 1. 获取当前签到学员身份
  let studentId = fallbackMemberIdentifier?.trim() || "";

  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("jbs_session_token");
    if (sessionCookie?.value) {
      const session = verifySessionToken(sessionCookie.value);
      if (session?.memberId || session?.userId) {
        studentId = session.memberId || session.userId;
      }
    }
  } catch {}

  if (!studentId) {
    studentId = "ANONYMOUS_MEMBER";
  }

  // 2. 原子性校验与一次性核销 Token（竞态防护）
  const result = await consumeAttendanceToken(token);

  if (!result.ok) {
    const messages: Record<typeof result.reason, string> = {
      NOT_FOUND: "二维码无效，请重新扫描屏幕上的二维码。",
      EXPIRED: "二维码已过期，请重新扫描最新的二维码。",
      USED: "该动态二维码已被使用，请扫描屏幕上实时刷新的最新二维码。",
    };
    return { success: false, message: messages[result.reason] };
  }

  // 3. 关联事件与会员信息
  const event = await prisma.event.findUnique({
    where: { id: result.eventId },
  });

  const eventName = event?.name || "佛学会现场活动";
  const pointsEarned = event?.points || 1;

  // 尝试查找系统中的正式会员档案
  let matchedMember = await prisma.member.findFirst({
    where: {
      OR: [
        { id: studentId },
        { memberId: studentId },
        { email: studentId },
      ],
    },
  });

  // 4. 写入 Attendance 记录（由 eventId + studentId 唯一约束防刷）
  const effectiveStudentId = matchedMember?.id || studentId;

  try {
    await prisma.attendance.create({
      data: {
        eventId: result.eventId,
        studentId: effectiveStudentId,
        tokenId: result.tokenRecordId,
      },
    });
  } catch (err: any) {
    // 捕获唯一键冲突
    if (err?.code === "P2002") {
      return {
        success: false,
        message: `您已签到过本场活动「${eventName}」，无需重复签到。`,
      };
    }
    console.error("[checkinWithToken] 写入签到记录失败:", err);
    return {
      success: false,
      message: "签到记录写入失败，请联系现场管理员协助处理。",
    };
  }

  // 5. 若匹配到正式会员，同步累加修行积分与出勤日志
  if (matchedMember) {
    try {
      const log = await prisma.attendanceLog.create({
        data: {
          memberId: matchedMember.id,
          eventName,
          pointsEarned,
        },
      });

      await recalculateMemberPoints(matchedMember.id);

      // 异步同步到 Google Sheets
      logAttendanceToGoogleSheet({
        memberId: matchedMember.memberId,
        memberName: matchedMember.name,
        eventName,
        pointsEarned,
        timestamp: log.dateTime.toISOString(),
      }).catch((err) =>
        console.error("Google Sheets attendance sync error:", err)
      );
    } catch (logErr) {
      console.error("[checkinWithToken] 同步出勤日志失败:", logErr);
    }
  }

  return {
    success: true,
    message: matchedMember
      ? `签到成功！已为【${matchedMember.name}】增加 ${pointsEarned} 点修持积分。`
      : `签到成功！已记录您的出勤。`,
    eventName,
    pointsEarned,
  };
}
