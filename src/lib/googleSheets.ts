import { prisma, recalculateMemberPoints } from "@/lib/prisma";

export const GOOGLE_SHEET_ID = "1o98f9BtgMfe2kUb17qzafoXzb7NFJaGzMJ6SGKapayc";

/**
 * 获取 Google Apps Script Webhook 网址
 */
export function getGoogleSheetWebhookUrl(): string {
  return process.env.GOOGLE_SHEET_WEBHOOK_URL || "";
}

/**
 * 测试 Webhook 连通性
 */
export async function testGoogleSheetConnection(customUrl?: string) {
  const url = customUrl || getGoogleSheetWebhookUrl();
  if (!url) {
    return {
      connected: false,
      message: "未配置 GOOGLE_SHEET_WEBHOOK_URL。请在设置中配置并部署 Google Apps Script。",
    };
  }

  try {
    const pingUrl = `${url}${url.includes("?") ? "&" : "?"}action=ping`;
    const res = await fetch(pingUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return {
        connected: false,
        message: `HTTP 响应错误 (${res.status}): ${res.statusText}`,
      };
    }

    const data = await res.json();
    
    // 如果返回的是会员数组，说明 Webhook 已正常运行
    if (Array.isArray(data)) {
      return {
        connected: true,
        message: `连接成功 (已读取 ${data.length} 条会员数据)`,
        spreadsheetId: GOOGLE_SHEET_ID,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      connected: data.success === true || Boolean(data.members),
      message: data.message || "连接成功",
      spreadsheetName: data.spreadsheetName,
      spreadsheetId: data.spreadsheetId || GOOGLE_SHEET_ID,
      timestamp: data.timestamp || new Date().toISOString(),
    };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return {
      connected: false,
      message: `无法连接到 Webhook: ${errMessage}`,
    };
  }
}

/**
 * 异步记录签到至 Google 表格
 */
export async function logAttendanceToGoogleSheet(data: {
  memberId: string;
  memberName: string;
  eventName: string;
  pointsEarned: number;
  timestamp?: string;
}) {
  const url = getGoogleSheetWebhookUrl();
  if (!url) return;

  try {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "logAttendance",
        data: {
          ...data,
          timestamp: data.timestamp || new Date().toISOString(),
        },
      }),
    }).catch((err) => {
      console.error("[GoogleSheets] Log attendance error:", err);
    });
  } catch (err) {
    console.error("[GoogleSheets] Failed to send attendance to Google Sheet:", err);
  }
}

/**
 * 异步记录兑换至 Google 表格
 */
export async function logRedemptionToGoogleSheet(data: {
  memberId: string;
  memberName: string;
  rewardName: string;
  pointsSpent: number;
  timestamp?: string;
}) {
  const url = getGoogleSheetWebhookUrl();
  if (!url) return;

  try {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "logRedemption",
        data: {
          ...data,
          timestamp: data.timestamp || new Date().toISOString(),
        },
      }),
    }).catch((err) => {
      console.error("[GoogleSheets] Log redemption error:", err);
    });
  } catch (err) {
    console.error("[GoogleSheets] Failed to send redemption to Google Sheet:", err);
  }
}

/**
 * 从 Google Sheet 拉取会员数据并同步到本地数据库
 */
export async function syncMembersFromSheet(customUrl?: string) {
  const url = customUrl || getGoogleSheetWebhookUrl();
  if (!url) throw new Error("未配置 Google Sheet Webhook URL");

  const fetchUrl = `${url}${url.includes("?") ? "&" : "?"}action=getMembers`;
  const res = await fetch(fetchUrl, { cache: "no-store" });
  const json = await res.json();

  const membersList: Array<{
    memberId: string;
    name: string;
    email?: string;
    totalPoints?: number;
    photo?: string;
  }> = Array.isArray(json)
    ? json
    : Array.isArray(json.members)
    ? json.members
    : [];

  if (membersList.length === 0 && !Array.isArray(json)) {
    throw new Error(json.error || "未能获取到有效的会员列表");
  }

  let importedCount = 0;
  for (const item of membersList) {
    if (!item.memberId || !item.name) continue;

    const email = item.email && item.email.trim()
      ? item.email.trim()
      : `${item.memberId.toLowerCase()}@student.utem.edu.my`;

    await prisma.member.upsert({
      where: { memberId: item.memberId },
      update: {
        name: item.name,
        email,
        totalPoints: item.totalPoints || 0,
        photo: item.photo || null,
      },
      create: {
        memberId: item.memberId,
        name: item.name,
        email,
        totalPoints: item.totalPoints || 0,
        photo: item.photo || null,
      },
    });
    importedCount++;
  }

  return { count: importedCount };
}

/**
 * 将本地数据库数据推送到 Google Sheet
 */
export async function pushAllToGoogleSheet(customUrl?: string) {
  const url = customUrl || getGoogleSheetWebhookUrl();
  if (!url) throw new Error("未配置 Google Sheet Webhook URL");

  const [members, events, rewards] = await Promise.all([
    prisma.member.findMany({ orderBy: { memberId: "asc" } }),
    prisma.event.findMany({ orderBy: { dateTime: "asc" } }),
    prisma.reward.findMany({ orderBy: { pointsRequired: "asc" } }),
  ]);

  // 1. 推送会员
  const resMembers = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "syncMembers", members }),
  });
  const resJsonMembers = await resMembers.json();

  // 2. 推送活动
  const resEvents = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "syncEvents", events }),
  });
  const resJsonEvents = await resEvents.json();

  // 3. 推送奖品
  const resRewards = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "syncRewards", rewards }),
  });
  const resJsonRewards = await resRewards.json();

  return {
    membersCount: resJsonMembers.count ?? members.length,
    eventsCount: resJsonEvents.count ?? events.length,
    rewardsCount: resJsonRewards.count ?? rewards.length,
  };
}
