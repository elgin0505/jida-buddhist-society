import { google } from "googleapis";

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  Google Sheets 自动同步服务 (Google Sheets Sync Service)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 📌 【.env.local 环境变量配置指南】：
 * 请在项目根目录的 `.env.local` 文件中添加以下环境变量：
 *
 * 1. GOOGLE_SERVICE_ACCOUNT_EMAIL:
 *    Google Cloud Service Account 邮箱地址
 *    例如: jbs-sync-service@your-project-id.iam.gserviceaccount.com
 *
 * 2. GOOGLE_PRIVATE_KEY:
 *    Service Account 的私钥 (JSON 密钥文件中的 "private_key" 字段)
 *    注意：需保留完整的 -----BEGIN PRIVATE KEY----- 与 -----END PRIVATE KEY-----，
 *    换行符请使用真实的换行或 \n 转义。
 *    例如: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
 *
 * 3. GOOGLE_SHEET_ID: (可选，默认已预设)
 *    目标表格 ID，默认为: 1o98f9BtgMfe2kUb17qzafoXzb7NFJaGzMJ6SGKapayc
 *
 * ⚠️【至关重要的授权步骤】：
 * 请务必在 Google Sheets 网页中打开目标表格，点击右上角「共享 (Share)」，
 * 将 `GOOGLE_SERVICE_ACCOUNT_EMAIL` 添加为「编辑者 (Editor)」，否则 Google 会返回 403 权限错误。
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export const DEFAULT_SHEET_ID = "1o98f9BtgMfe2kUb17qzafoXzb7NFJaGzMJ6SGKapayc";

function getGoogleSheetsClient() {
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

function getWebhookUrl(): string | null {
  return process.env.GOOGLE_SHEETS_API_URL || process.env.GOOGLE_SHEET_WEBHOOK_URL || null;
}

/* ─────────────────────────────────────────────────────────────
 * 1. 注册会员同步 (Register Member)
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

    // 格式: [注册时间, 会员编号, 姓名, 电子邮箱, 生日, 初始功德积分]
    const rowValues = [
      registerTimeStr,
      payload.memberId,
      payload.name,
      payload.email,
      birthdayStr,
      payload.totalPoints ?? 0,
    ];

    if (client) {
      const response = await client!.sheets.spreadsheets.values.append({
        spreadsheetId: client!.spreadsheetId,
        range: "A:F",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [rowValues],
        },
      });
      console.log(`✅ [GoogleSheets] 成功通过 Service Account 同步新学员 [${payload.memberId}] ${payload.name} 至 Google Sheet`);
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
      console.log(`✅ [GoogleSheets] 成功通过 Webhook 同步新学员 [${payload.memberId}] ${payload.name} 至 Google Sheet`);
      return { success: true, viaWebhook: true };
    }
  } catch (error: any) {
    console.error("❌ [GoogleSheets] 会员同步失败:", error?.message || error);
    return { success: false, error: error?.message };
  }
}

/* ─────────────────────────────────────────────────────────────
 * 2. 签到出勤同步 (Attendance Log)
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
      await client!.sheets.spreadsheets.values.append({
        spreadsheetId: client!.spreadsheetId,
        range: "A:F",
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
 * 3. 奖品兑换记录同步 (Redemption Log)
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
      "奖品兑换",
    ];

    if (client) {
      await client!.sheets.spreadsheets.values.append({
        spreadsheetId: client!.spreadsheetId,
        range: "A:F",
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
