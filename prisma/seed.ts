import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 系统初始活动（留空，等待管理员在 Google Sheets 中添加后自动同步）
const seedEvents: {
  name: string;
  description: string;
  dateTime: Date;
  location: string;
  points: number;
}[] = [];

// 系统初始商城奖品（留空，等待管理员在 Google Sheets 中添加后自动同步）
const seedRewards: {
  name: string;
  pointsRequired: number;
  description: string;
  image: string | null;
  stock: number;
}[] = [];

async function main() {
  console.log("🧹 正在彻底清理所有历史与 Mock 数据...");
  
  // 清理所有关联记录与用户数据（保持零初始学员状态）
  await prisma.redemption.deleteMany();
  await prisma.attendanceLog.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.event.deleteMany();
  await prisma.member.deleteMany();
  await prisma.user.deleteMany();

  console.log("🌱 正在初始化官方活动与商城法宝列表...");
  await prisma.event.createMany({ data: seedEvents });
  await prisma.reward.createMany({ data: seedRewards });

  console.log("✨ 数据重置完成：学员与出勤记录已归零，系统进入纯净待注册状态。");
}

main()
  .catch((error) => {
    console.error("❌ Seed 初始化失败:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
