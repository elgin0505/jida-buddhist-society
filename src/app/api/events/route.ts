import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncEventsFromGoogleSheet } from "@/lib/googleSheets";
import { verifyAdminPin } from "@/lib/adminAuth";

export async function GET() {
  try {
    const events = await syncEventsFromGoogleSheet();
    return NextResponse.json(events);
  } catch (error) {
    console.error("Failed to fetch events:", error);
    const fallbackEvents = await prisma.event.findMany({
      orderBy: { dateTime: "asc" },
    });
    return NextResponse.json(fallbackEvents);
  }
}

export async function POST(request: Request) {
  // 1. 安全校验：验证管理员权限
  const auth = verifyAdminPin(request);
  if (!auth.isValid && auth.errorResponse) {
    return auth.errorResponse;
  }

  const body = await request.json();
  const { name, description, dateTime, location, points = 1 } = body;

  if (!name || !dateTime) {
    return NextResponse.json(
      { error: "活动名称和日期为必填项" },
      { status: 400 }
    );
  }

  const event = await prisma.event.create({
    data: {
      name,
      description,
      dateTime: new Date(dateTime),
      location,
      points: Number(points) || 1,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
