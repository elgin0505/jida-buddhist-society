import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "请完整填写邮箱、6 位验证码以及新密码" },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "新密码长度至少需要 6 个字符" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    // 1. 查找用户
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "该邮箱对应的修持账户不存在" },
        { status: 404 }
      );
    }

    if (!user.resetCode || !user.resetCodeExpiry) {
      return NextResponse.json(
        { error: "尚未申请重置验证码或验证码已失效，请重新获取" },
        { status: 400 }
      );
    }

    // 2. 校验防暴力破解尝试次数限制 (最多允许 5 次错误尝试)
    if (user.resetAttempts >= 5) {
      // 强制作废验证码
      await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          resetCode: null,
          resetCodeExpiry: null,
          resetAttempts: 0,
        },
      });
      return NextResponse.json(
        { error: "验证码输错次数过多（超过 5 次），为保障账户安全已自动作废，请重新申请验证码" },
        { status: 403 }
      );
    }

    // 3. 校验是否已过期
    if (new Date() > new Date(user.resetCodeExpiry)) {
      return NextResponse.json(
        { error: "验证码已过期（超过 10 分钟），请重新获取" },
        { status: 400 }
      );
    }

    // 4. 校验验证码是否匹配
    if (user.resetCode !== trimmedCode) {
      const nextAttempts = (user.resetAttempts || 0) + 1;
      const remainingAttempts = Math.max(0, 5 - nextAttempts);

      await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          resetAttempts: nextAttempts,
          ...(nextAttempts >= 5 ? { resetCode: null, resetCodeExpiry: null } : {}),
        },
      });

      return NextResponse.json(
        {
          error: remainingAttempts > 0
            ? `验证码不正确，还可尝试 ${remainingAttempts} 次`
            : "验证码错误次数已达上限，该验证码已作废，请重新获取",
        },
        { status: 400 }
      );
    }

    // 5. 加密新密码 (统一使用 Salt 12)
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // 6. 更新密码并清空 OTP 验证码与计数
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        passwordHash: newPasswordHash,
        resetCode: null,
        resetCodeExpiry: null,
        resetAttempts: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: "密码重置成功！请使用新密码登录",
    });
  } catch (error) {
    console.error("[ResetPassword Error]", error);
    return NextResponse.json(
      { error: "重置密码失败，请稍后重试" },
      { status: 500 }
    );
  }
}
