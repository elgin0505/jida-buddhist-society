import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 开始清理测试/假数据...");

  // 清理子表关联记录（避免外键约束冲突）
  const deletedAttendance = await prisma.attendanceLog.deleteMany({});
  console.log(`- 成功清理 AttendanceLog 考勤记录: ${deletedAttendance.count} 条`);

  const deletedRedemptions = await prisma.redemption.deleteMany({});
  console.log(`- 成功清理 Redemption 奖品兑换记录: ${deletedRedemptions.count} 条`);

  // 清理会员档案与用户账号
  const deletedMembers = await prisma.member.deleteMany({});
  console.log(`- 成功清理 Member 会员记录: ${deletedMembers.count} 条`);

  const deletedUsers = await prisma.user.deleteMany({});
  console.log(`- 成功清理 User 登录账户: ${deletedUsers.count} 条`);

  console.log("✨ 数据库测试数据清理完毕！");
}

main()
  .catch((e) => {
    console.error("❌ 清理数据时发生错误:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
