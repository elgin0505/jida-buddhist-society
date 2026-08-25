import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "请输入需要找回密码的电子邮箱" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "未找到与该邮箱匹配的修持账户，请检查邮箱或前往注册" },
        { status: 404 }
      );
    }

    // 生成 6 位随机安全数字验证码 (100000 - 999999)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // 有效期 10 分钟
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    // 将验证码与过期时间存入数据库
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        resetCode: code,
        resetCodeExpiry: expiry,
      },
    });

    // 发送禅意风格邮件通知
    try {
      const mailRes = await sendPasswordResetEmail({
        to: user.email,
        code,
        name: user.name,
      });

      return NextResponse.json({
        success: true,
        message: mailRes?.mocked
          ? `（开发调试模式）验证码为：${code}`
          : "验证码已成功发送至您的邮箱，10 分钟内有效",
        devCode: mailRes?.mocked ? code : undefined,
      });
    } catch (mailError) {
      console.error("[ForgotPassword] 邮件发送失败:", mailError);
      return NextResponse.json(
        { error: "邮件发送失败，请稍后重试或联系管理员" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[ForgotPassword Error]", error);
    return NextResponse.json(
      { error: "请求失败，请稍后重试" },
      { status: 500 }
    );
  }
}
