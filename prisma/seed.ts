import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 系统初始活动（仅供活动展示与签到使用）
const seedEvents = [
  {
    name: "晨间禅修",
    description: "以正念呼吸开启新的一天，培养内心宁静与觉察力。",
    dateTime: new Date("2026-08-20T07:00:00+08:00"),
    location: "佛学会禅堂",
    points: 2,
  },
  {
    name: "佛法分享会",
    description: "探讨《心经》的智慧要义，分享修行心得与生活应用。",
    dateTime: new Date("2026-08-22T19:30:00+08:00"),
    location: "A101 讲堂",
    points: 1,
  },
  {
    name: "社区服务日",
    description: "以慈悲行动回馈社区，参与环保清洁与物资捐赠活动。",
    dateTime: new Date("2026-08-24T09:00:00+08:00"),
    location: "校园广场",
    points: 3,
  },
  {
    name: "中秋供灯法会",
    description: "以灯供佛，祈愿世界和平、众生安乐，共庆中秋佳节。",
    dateTime: new Date("2026-09-06T18:00:00+08:00"),
    location: "佛学会大殿",
    points: 2,
  },
];

// 系统初始商城奖品
const seedRewards = [
  {
    name: "禅意香薰蜡烛",
    pointsRequired: 15,
    description: "天然大豆蜡，融入檀香与莲花香氛，营造宁静修行氛围。",
    image: null,
    stock: 20,
  },
  {
    name: "手写心经字帖",
    pointsRequired: 25,
    description: "优质宣纸字帖套装，附赠毛笔与墨汁，适合日常抄经练习。",
    image: null,
    stock: 15,
  },
  {
    name: "莲花陶瓷茶杯",
    pointsRequired: 40,
    description: "手工烧制莲花纹茶杯，寓意出淤泥而不染，适合品茶静心。",
    image: null,
    stock: 10,
  },
  {
    name: "佛学会限定帆布袋",
    pointsRequired: 30,
    description: "环保帆布材质，印有技大佛学会 logo，实用与美观兼具。",
    image: null,
    stock: 25,
  },
  {
    name: "禅修坐垫",
    pointsRequired: 60,
    description: "高密度记忆棉坐垫，符合人体工学，支持长时间静坐修行。",
    image: null,
    stock: 8,
  },
];

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
