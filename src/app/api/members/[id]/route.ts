import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      attendances: { orderBy: { dateTime: "desc" }, take: 20 },
      redemptions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { reward: true },
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "会员不存在" }, { status: 404 });
  }

  return NextResponse.json(member);
}
