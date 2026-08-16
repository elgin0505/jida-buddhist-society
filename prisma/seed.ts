import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedMembers = [
  {
    memberId: "JBS-001",
    name: "李明慧",
    email: "minghui.li@student.utem.edu.my",
    photo: null,
  },
  {
    memberId: "JBS-002",
    name: "陈静怡",
    email: "jingyi.chen@student.utem.edu.my",
    photo: null,
  },
  {
    memberId: "JBS-003",
    name: "王浩然",
    email: "haoran.wang@student.utem.edu.my",
    photo: null,
  },
];

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
  await prisma.redemption.deleteMany();
  await prisma.attendanceLog.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.event.deleteMany();
  await prisma.member.deleteMany();

  const members = await Promise.all(
    seedMembers.map((member) => prisma.member.create({ data: member }))
  );

  await prisma.event.createMany({ data: seedEvents });
  await prisma.reward.createMany({ data: seedRewards });

  const events = await prisma.event.findMany();

  await prisma.attendanceLog.createMany({
    data: [
      {
        memberId: members[0].id,
        eventName: events[0].name,
        pointsEarned: events[0].points,
        dateTime: new Date("2026-08-10T07:05:00+08:00"),
      },
      {
        memberId: members[0].id,
        eventName: events[1].name,
        pointsEarned: events[1].points,
        dateTime: new Date("2026-08-12T19:35:00+08:00"),
      },
      {
        memberId: members[1].id,
        eventName: events[0].name,
        pointsEarned: events[0].points,
        dateTime: new Date("2026-08-10T07:10:00+08:00"),
      },
      {
        memberId: members[2].id,
        eventName: events[2].name,
        pointsEarned: events[2].points,
        dateTime: new Date("2026-08-14T09:15:00+08:00"),
      },
    ],
  });

  for (const member of members) {
    const earned = await prisma.attendanceLog.aggregate({
      where: { memberId: member.id },
      _sum: { pointsEarned: true },
    });
    await prisma.member.update({
      where: { id: member.id },
      data: { totalPoints: earned._sum.pointsEarned ?? 0 },
    });
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
