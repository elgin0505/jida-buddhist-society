import { NextResponse } from "next/server";
import {
  testGoogleSheetConnection,
  syncMembersFromSheet,
  pushAllToGoogleSheet,
  getGoogleSheetWebhookUrl,
  GOOGLE_SHEET_ID,
} from "@/lib/googleSheets";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customUrl = searchParams.get("url") || undefined;
  const currentUrl = customUrl || getGoogleSheetWebhookUrl();

  const testResult = await testGoogleSheetConnection(currentUrl);

  return NextResponse.json({
    spreadsheetId: GOOGLE_SHEET_ID,
    configured: Boolean(currentUrl),
    webhookUrl: currentUrl ? maskUrl(currentUrl) : "",
    connection: testResult,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, webhookUrl } = body;

    if (action === "test") {
      const result = await testGoogleSheetConnection(webhookUrl);
      return NextResponse.json(result);
    }

    if (action === "pullMembers") {
      const result = await syncMembersFromSheet(webhookUrl);
      return NextResponse.json({
        success: true,
        message: `成功从 Google 表格同步 ${result.count} 位会员`,
        count: result.count,
      });
    }

    if (action === "pushAll") {
      const result = await pushAllToGoogleSheet(webhookUrl);
      return NextResponse.json({
        success: true,
        message: `成功推送：${result.membersCount} 位会员、${result.eventsCount} 个活动、${result.rewardsCount} 种奖品到 Google 表格`,
        result,
      });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function maskUrl(url: string) {
  if (url.length <= 20) return url;
  return `${url.substring(0, 30)}...${url.substring(url.length - 10)}`;
}
