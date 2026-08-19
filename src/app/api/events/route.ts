import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncEventsFromGoogleSheet } from "@/lib/googleSheets";

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
      points,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
