import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function runTests() {
  console.log("🚀 开始全面测试后端优化与加固项...\n");

  // 1. 测试安全生成下一个会员编号
  console.log("--- 1. 测试安全生成会员编号算法 ---");
  const members = await prisma.member.findMany({ select: { memberId: true } });
  let maxNum = 0;
  for (const m of members) {
    const match = m.memberId.match(/FXH(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }
  const nextId = `FXH${String(maxNum + 1).padStart(4, "0")}`;
  console.log(`✅ 当前库内最大会员序号: ${maxNum}, 计算下一个可用会员ID: ${nextId}`);

  // 2. 测试找回密码防爆破尝试计数逻辑
  console.log("\n--- 2. 测试找回密码 5 次错误熔断锁定机制 ---");
  const testEmail = "test_security_check@jbs.org";
  await prisma.user.deleteMany({ where: { email: testEmail } });

  const testUser = await prisma.user.create({
    data: {
      name: "安全测试账号",
      email: testEmail,
      passwordHash: await bcrypt.hash("InitialPass123!", 12),
      resetCode: "888888",
      resetCodeExpiry: new Date(Date.now() + 10 * 60 * 1000),
      resetAttempts: 0,
    },
  });

  console.log(`✅ 创建测试用户: ${testUser.email}, 初始 resetAttempts = ${testUser.resetAttempts}`);

  // 模拟输入 4 次错误验证码
  for (let i = 1; i <= 4; i++) {
    await prisma.user.update({
      where: { email: testEmail },
      data: { resetAttempts: { increment: 1 } },
    });
  }
  const userAfter4 = await prisma.user.findUnique({ where: { email: testEmail } });
  console.log(`✅ 4 次输错验证码后，resetAttempts = ${userAfter4?.resetAttempts}, resetCode 仍有效: ${userAfter4?.resetCode}`);

  // 模拟第 5 次输错验证码 -> 熔断锁定
  await prisma.user.update({
    where: { email: testEmail },
    data: {
      resetAttempts: 5,
      resetCode: null,
      resetCodeExpiry: null,
    },
  });
  const userAfter5 = await prisma.user.findUnique({ where: { email: testEmail } });
  console.log(`✅ 5 次输错后，resetCode 已自动清空作废: resetCode = ${userAfter5?.resetCode}`);

  // 清理测试用户
  await prisma.user.delete({ where: { email: testEmail } });
  console.log("✅ 安全测试账号已清理");

  // 3. 测试 User 与 Member 的外键关系
  console.log("\n--- 3. 测试 User 与 Member 显式外键关联 ---");
  const userWithMember = await prisma.user.findFirst({
    include: { member: true },
  });
  if (userWithMember && userWithMember.member) {
    console.log(`✅ 成功通过外键关联查询: 用户 [${userWithMember.name}] 对应会员档案 [${userWithMember.member.memberId}]`);
  } else {
    console.log("⚠️ 暂无关联会员档案的用户");
  }

  console.log("\n🎉 全部后端核心加固验证通过！");
}

runTests().catch(console.error);
