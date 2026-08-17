import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { appendMemberToGoogleSheet } from "@/lib/googleSheets";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, birthday } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "姓名、邮箱和密码为必填项" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码长度至少为 6 个字符" },
        { status: 400 }
      );
    }

    // 1. 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    // 2. 加密密码
    const passwordHash = await bcrypt.hash(password, 12);
    const parsedBirthday = birthday ? new Date(birthday) : null;

    // 3. 创建独立 User 账户
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        birthday: parsedBirthday,
      },
    });

    // 4. 创建关联的 Member 会员档案，生成唯一编号 (例如 JBS0001)
    const memberCount = await prisma.member.count();
    const memberId = `JBS${String(memberCount + 1).padStart(4, "0")}`;

    const member = await prisma.member.create({
      data: {
        memberId,
        name,
        email,
        birthday: parsedBirthday,
        totalPoints: 0,
      },
    });

    // 5. 自动同步数据至 Google Sheets (异步调用，不阻塞响应)
    try {
      await appendMemberToGoogleSheet({
        memberId: member.memberId,
        name: member.name,
        email: member.email,
        birthday: member.birthday,
        createdAt: member.createdAt,
        totalPoints: member.totalPoints,
      });
    } catch (sheetErr) {
      console.error("⚠️ Google Sheets 同步非致命错误:", sheetErr);
    }

    // 6. 返回成功注册的会话信息
    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        memberId: member.id,
        memberCode: member.memberId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 }
    );
  }
}
