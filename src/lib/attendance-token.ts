import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

const TOKEN_TTL_MS = 15 * 1000;       // 15 秒生命周期
const CLEANUP_GRACE_MS = 60 * 1000;   // 清理"过期超过1分钟"的历史记录

export async function createAttendanceToken(eventId: string) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  const record = await prisma.attendanceToken.create({
    data: { token, eventId, expiresAt },
  });

  // 顺手异步清理陈旧 token，不 await、不阻塞响应，失败也不影响主流程
  cleanupStaleTokens().catch((err) =>
    console.error("[AttendanceToken] cleanup failed:", err)
  );

  return record;
}

export async function cleanupStaleTokens() {
  const staleBefore = new Date(Date.now() - CLEANUP_GRACE_MS);
  await prisma.attendanceToken.deleteMany({
    where: { expiresAt: { lt: staleBefore } },
  });
}

export type ConsumeResult =
  | { ok: true; eventId: string; tokenRecordId: string }
  | { ok: false; reason: "NOT_FOUND" | "EXPIRED" | "USED" };

/**
 * 校验并"一次性核销" token。
 * 用 updateMany + isUsed:false 条件做原子写入，
 * 防止两个并发请求（例如截图被多人同时扫）都判定成功。
 */
export async function consumeAttendanceToken(token: string): Promise<ConsumeResult> {
  const record = await prisma.attendanceToken.findUnique({ where: { token } });

  if (!record) return { ok: false, reason: "NOT_FOUND" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "EXPIRED" };
  if (record.isUsed) return { ok: false, reason: "USED" };

  const claim = await prisma.attendanceToken.updateMany({
    where: { id: record.id, isUsed: false },
    data: { isUsed: true, usedAt: new Date() },
  });

  if (claim.count === 0) {
    // 竞态：极短时间内已被其他请求抢先核销
    return { ok: false, reason: "USED" };
  }

  return { ok: true, eventId: record.eventId, tokenRecordId: record.id };
}
