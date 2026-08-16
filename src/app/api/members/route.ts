import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const members = await prisma.member.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { attendances: true, redemptions: true },
      },
    },
  });

  return NextResponse.json(members);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { memberId, name, email, photo } = body;

  if (!memberId || !name || !email) {
    return NextResponse.json(
      { error: "会员ID、姓名和电子邮件为必填项" },
      { status: 400 }
    );
  }

  const member = await prisma.member.create({
    data: { memberId, name, email, photo },
  });

  return NextResponse.json(member, { status: 201 });
}
