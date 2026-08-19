import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  Google Sheets 自动同步与实时读取服务 (Google Sheets Sync & Read Service)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export const DEFAULT_SHEET_ID = "1o98f9BtgMfe2kUb17qzafoXzb7NFJaGzMJ6SGKapayc";

export function getGoogleSheetsClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const privateKey = rawKey ? (rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey) : undefined;
  const spreadsheetId = process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;

  if (!clientEmail || !privateKey) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  return { sheets, spreadsheetId };
}

export function getWebhookUrl(): string | null {
  return process.env.GOOGLE_SHEETS_API_URL || process.env.GOOGLE_SHEET_WEBHOOK_URL || null;
}

// 缓存已存在的 sheet 页签名称，避免每次写入都重复查询元数据
const verifiedTabs = new Set<string>();

/**
 * 自动检查并创建指定名称的工作表（Tab），并写入标准表头
 */
async function ensureSheetTab(client: { sheets: any; spreadsheetId: string }, title: string, headers: string[]) {
  if (verifiedTabs.has(title)) return;
  try {
    const meta = await client.sheets.spreadsheets.get({
      spreadsheetId: client.spreadsheetId,
      fields: "sheets.properties.title",
    });
    const exists = meta.data.sheets?.some((s: any) => s.properties?.title?.trim().toLowerCase() === title.trim().toLowerCase());
    if (!exists) {
      await client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: client.spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title },
              },
            },
          ],
        },
      });
      if (headers.length > 0) {
        await client.sheets.spreadsheets.values.append({
          spreadsheetId: client.spreadsheetId,
          range: `${title}!A1`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [headers],
          },
        });
      }
      console.log(`✨ [GoogleSheets] 自动在 Google 表格中创建了新分页: [${title}]`);
    }
    verifiedTabs.add(title);
  } catch (err: any) {
    console.warn(`⚠️ [GoogleSheets] 检查/创建分表 [${title}] 失败:`, err?.message || err);
  }
}

/* ─────────────────────────────────────────────────────────────
 * 1. 注册会员同步 (Register Member ➔ Members 表)
 * ───────────────────────────────────────────────────────────── */
export interface NewMemberSheetPayload {
  memberId: string;
  name: string;
  email: string;
  birthday?: string | Date | null;
  createdAt?: string | Date;
  totalPoints?: number;
}

export async function appendMemberToGoogleSheet(payload: NewMemberSheetPayload) {
  const client = getGoogleSheetsClient();
  const webhookUrl = getWebhookUrl();

  if (!client && !webhookUrl) {
    console.warn("⚠️ [GoogleSheets] 未检测到 Google API 凭据或 Webhook URL，跳过新会员注册同步。");
    return { success: false, skipped: true };
  }

  try {
    const registerTimeStr = payload.createdAt
      ? new Date(payload.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Kuala_Lumpur" })
      : new Date().toLocaleString("zh-CN", { timeZone: "Asia/Kuala_Lumpur" });

    let birthdayStr = "未填写";
    if (payload.birthday) {
      const bDate = new Date(payload.birthday);
      birthdayStr = `${bDate.getFullYear()}-${String(bDate.getMonth() + 1).padStart(2, "0")}-${String(
        bDate.getDate()
      ).padStart(2, "0")}`;
    }

    const rowValues = [
      registerTimeStr,
      payload.memberId,
      payload.name,
      payload.email,
      birthdayStr,
      payload.totalPoints ?? 0,
    ];

    if (client) {
      await ensureSheetTab(client, "Members", [
        "注册时间 (Registered At)",
        "会员编号 (Member ID)",
        "姓名 (Name)",
        "邮箱 (Email)",
        "生日 (Birthday)",
        "总积分 (Total Points)",
      ]);

      const response = await client.sheets.spreadsheets.values.append({
        spreadsheetId: client.spreadsheetId,
        range: "Members!A:F",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [rowValues],
        },
      });
      console.log(`✅ [GoogleSheets] 成功同步新学员 [${payload.memberId}] ${payload.name} 至 Members 分页`);
      return { success: true, updatedRange: response.data.updates?.updatedRange };
    } else if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "registerMember",
          data: {
            memberId: payload.memberId,
            name: payload.name,
            email: payload.email,
            birthday: birthdayStr,
            createdAt: registerTimeStr,
            totalPoints: payload.totalPoints ?? 0,
          },
        }),
      });
      console.log(`✅ [GoogleSheets Webhook] 成功同步新学员 [${payload.memberId}] ${payload.name}`);
      return { success: true, viaWebhook: true };
    }
  } catch (error: any) {
    console.error("❌ [GoogleSheets] 会员同步失败:", error?.message || error);
    return { success: false, error: error?.message };
  }
}

/* ─────────────────────────────────────────────────────────────
 * 2. 签到出勤同步 (Attendance Log ➔ Attendance 表)
 * ───────────────────────────────────────────────────────────── */
export interface AttendanceSheetPayload {
  memberId: string;
  memberName: string;
  eventName: string;
  pointsEarned: number;
  timestamp: string;
}

export async function logAttendanceToGoogleSheet(payload: AttendanceSheetPayload) {
  const client = getGoogleSheetsClient();
  const webhookUrl = getWebhookUrl();
  if (!client && !webhookUrl) return { success: false, skipped: true };

  try {
    const timeStr = new Date(payload.timestamp).toLocaleString("zh-CN", { timeZone: "Asia/Kuala_Lumpur" });
    const rowValues = [
      timeStr,
      payload.memberId,
      payload.memberName,
      payload.eventName,
      `+${payload.pointsEarned}`,
      "活动签到",
    ];

    if (client) {
      await ensureSheetTab(client, "Attendance", [
        "签到时间 (Timestamp)",
        "会员编号 (Member ID)",
        "姓名 (Name)",
        "活动名称 (Event Name)",
        "获得积分 (Points Earned)",
        "记录类型 (Type)",
      ]);

      await client.sheets.spreadsheets.values.append({
        spreadsheetId: client.spreadsheetId,
        range: "Attendance!A:F",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [rowValues],
        },
      });
    } else if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logAttendance", data: payload }),
      });
    }
    return { success: true };
  } catch (error: any) {
    console.error("❌ [GoogleSheets] 签到记录同步失败:", error?.message || error);
    return { success: false, error: error?.message };
  }
}

/* ─────────────────────────────────────────────────────────────
 * 3. 奖品兑换记录同步 (Redemption Log ➔ Redemptions 表)
 * ───────────────────────────────────────────────────────────── */
export interface RedemptionSheetPayload {
  memberId: string;
  memberName: string;
  rewardName: string;
  pointsSpent: number;
  timestamp: string;
}

export async function logRedemptionToGoogleSheet(payload: RedemptionSheetPayload) {
  const client = getGoogleSheetsClient();
  const webhookUrl = getWebhookUrl();
  if (!client && !webhookUrl) return { success: false, skipped: true };

  try {
    const timeStr = new Date(payload.timestamp).toLocaleString("zh-CN", { timeZone: "Asia/Kuala_Lumpur" });
    const rowValues = [
      timeStr,
      payload.memberId,
      payload.memberName,
      payload.rewardName,
      `-${payload.pointsSpent}`,
      "法宝兑换",
    ];

    if (client) {
      await ensureSheetTab(client, "Redemptions", [
        "兑换时间 (Timestamp)",
        "会员编号 (Member ID)",
        "姓名 (Name)",
        "兑换奖品 (Reward Name)",
        "消耗积分 (Points Spent)",
        "记录类型 (Type)",
      ]);

      await client.sheets.spreadsheets.values.append({
        spreadsheetId: client.spreadsheetId,
        range: "Redemptions!A:F",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [rowValues],
        },
      });
    } else if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logRedemption", data: payload }),
      });
    }
    return { success: true };
  } catch (error: any) {
    console.error("❌ [GoogleSheets] 兑换记录同步失败:", error?.message || error);
    return { success: false, error: error?.message };
  }
}

/* ─────────────────────────────────────────────────────────────
 * 4. 从 Google Sheets 读取活动列表 (Events 表 ➔ 网页)
 * ───────────────────────────────────────────────────────────── */
function parseDateSafely(val: any): Date {
  if (!val) return new Date();
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d;
  const d2 = new Date(String(val).replace(/-/g, "/"));
  if (!isNaN(d2.getTime())) return d2;
  return new Date();
}

export async function syncEventsFromGoogleSheet() {
  const client = getGoogleSheetsClient();
  const webhookUrl = getWebhookUrl();

  try {
    let eventRows: any[] = [];

    let hasFetchedFromSheet = false;

    if (client) {
      await ensureSheetTab(client, "Events", [
        "活动名称 (Event Name)",
        "日期时间 (DateTime)",
        "地点 (Location)",
        "参与功德分 (Points)",
        "活动描述 (Description)",
      ]);

      const res = await client.sheets.spreadsheets.values.get({
        spreadsheetId: client.spreadsheetId,
        range: "Events!A2:E",
      });
      const rawRows = res.data.values || [];
      eventRows = rawRows
        .filter((r: any[]) => r && r[0] && String(r[0]).trim())
        .map((r: any[]) => ({
          name: String(r[0] || "").trim(),
          dateTime: parseDateSafely(r[1]),
          location: String(r[2] || "").trim() || "待定",
          points: parseInt(String(r[3] || "1"), 10) || 1,
          description: String(r[4] || "").trim() || null,
        }));
      hasFetchedFromSheet = true;
    } else if (webhookUrl) {
      const res = await fetch(`${webhookUrl}?action=getEvents`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.events)) {
        eventRows = json.events.map((e: any) => ({
          name: String(e.name || "").trim(),
          dateTime: parseDateSafely(e.dateTime),
          location: String(e.location || "").trim() || "待定",
          points: parseInt(String(e.points || "1"), 10) || 1,
          description: String(e.description || "").trim() || null,
        }));
        hasFetchedFromSheet = true;
      }
    }

    if (hasFetchedFromSheet) {
      if (eventRows.length === 0) {
        // 表格中暂无活动或已被清空，同步清空数据库中的历史活动
        await prisma.event.deleteMany();
        console.log("🧹 [GoogleSheets] 表格活动为空，已同步清空本地活动列表。");
        return [];
      }

      // 将 Google Sheets 作为唯一真实数据源 (Single Source of Truth)
      const validNames = eventRows.map((e) => e.name);
      await prisma.event.deleteMany({
        where: { name: { notIn: validNames } },
      });

      for (const ev of eventRows) {
        const existing = await prisma.event.findFirst({
          where: { name: ev.name },
        });

        if (existing) {
          await prisma.event.update({
            where: { id: existing.id },
            data: {
              dateTime: ev.dateTime,
              location: ev.location,
              points: ev.points,
              description: ev.description,
            },
          });
        } else {
          await prisma.event.create({
            data: {
              name: ev.name,
              dateTime: ev.dateTime,
              location: ev.location,
              points: ev.points,
              description: ev.description,
            },
          });
        }
      }
      console.log(`🔄 [GoogleSheets] 成功从表格同步 ${eventRows.length} 个活动`);
    }
  } catch (err: any) {
    console.error("⚠️ [GoogleSheets] 从表格同步活动失败 (将降级使用本地数据库):", err?.message || err);
  }

  // 返回本地数据库中的活动列表（按时间排序）
  return prisma.event.findMany({
    orderBy: { dateTime: "asc" },
  });
}

/* ─────────────────────────────────────────────────────────────
 * 5. 从 Google Sheets 读取商城法宝列表 (Rewards 表 ➔ 网页)
 * ───────────────────────────────────────────────────────────── */
export async function syncRewardsFromGoogleSheet() {
  const client = getGoogleSheetsClient();
  const webhookUrl = getWebhookUrl();

  try {
    let rewardRows: any[] = [];

    let hasFetchedFromSheet = false;

    if (client) {
      await ensureSheetTab(client, "Rewards", [
        "奖品名称 (Reward Name)",
        "所需功德分 (Points Required)",
        "库存数量 (Stock)",
        "奖品描述 (Description)",
      ]);

      const res = await client.sheets.spreadsheets.values.get({
        spreadsheetId: client.spreadsheetId,
        range: "Rewards!A2:D",
      });
      const rawRows = res.data.values || [];
      rewardRows = rawRows
        .filter((r: any[]) => r && r[0] && String(r[0]).trim())
        .map((r: any[]) => ({
          name: String(r[0] || "").trim(),
          pointsRequired: parseInt(String(r[1] || "0"), 10) || 0,
          stock: parseInt(String(r[2] || "10"), 10) || 10,
          description: String(r[3] || "").trim() || null,
        }));
      hasFetchedFromSheet = true;
    } else if (webhookUrl) {
      const res = await fetch(`${webhookUrl}?action=getRewards`, { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.rewards)) {
        rewardRows = json.rewards.map((rw: any) => ({
          name: String(rw.name || "").trim(),
          pointsRequired: parseInt(String(rw.pointsRequired || "0"), 10) || 0,
          stock: parseInt(String(rw.stock || "10"), 10) || 10,
          description: String(rw.description || "").trim() || null,
        }));
        hasFetchedFromSheet = true;
      }
    }

    if (hasFetchedFromSheet) {
      if (rewardRows.length === 0) {
        // 表格中暂无法宝或已被清空，同步清空数据库中的历史法宝
        await prisma.reward.deleteMany();
        console.log("🧹 [GoogleSheets] 表格法宝为空，已同步清空本地法宝列表。");
        return [];
      }

      // 将 Google Sheets 作为唯一真实数据源 (Single Source of Truth)
      const validNames = rewardRows.map((r) => r.name);
      await prisma.reward.deleteMany({
        where: { name: { notIn: validNames } },
      });

      for (const rw of rewardRows) {
        const existing = await prisma.reward.findFirst({
          where: { name: rw.name },
        });

        if (existing) {
          await prisma.reward.update({
            where: { id: existing.id },
            data: {
              pointsRequired: rw.pointsRequired,
              stock: rw.stock,
              description: rw.description,
            },
          });
        } else {
          await prisma.reward.create({
            data: {
              name: rw.name,
              pointsRequired: rw.pointsRequired,
              stock: rw.stock,
              description: rw.description,
            },
          });
        }
      }
      console.log(`🔄 [GoogleSheets] 成功从表格同步 ${rewardRows.length} 个法宝奖品`);
    }
  } catch (err: any) {
    console.error("⚠️ [GoogleSheets] 从表格同步法宝失败 (将降级使用本地数据库):", err?.message || err);
  }

  // 返回本地数据库中的奖品列表（按所需积分排序）
  return prisma.reward.findMany({
    orderBy: { pointsRequired: "asc" },
  });
}
