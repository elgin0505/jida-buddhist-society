import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if member exists
    const member = await prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json({ error: "会员不存在" }, { status: 404 });
    }

    // Give 2 points
    const updatedMember = await prisma.member.update({
      where: { id },
      data: {
        totalPoints: { increment: 2 },
      },
    });

    // Optionally create an attendance record to log the bonus
    await prisma.attendanceLog.create({
      data: {
        memberId: id,
        eventName: "生辰福气积分",
        pointsEarned: 2,
        dateTime: new Date(),
      },
    });

    return NextResponse.json(
      { message: "福气积分已发放", totalPoints: updatedMember.totalPoints },
      { status: 200 }
    );
  } catch (error) {
    console.error("Birthday bonus error:", error);
    return NextResponse.json(
      { error: "发发生辰积分失败" },
      { status: 500 }
    );
  }
}
