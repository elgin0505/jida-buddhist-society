import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rd = await prisma.redemption.deleteMany({});
  const e = await prisma.event.deleteMany({});
  const r = await prisma.reward.deleteMany({});
  console.log(`✅ 活动列表已清空: ${e.count} 条`);
  console.log(`✅ 积分商城奖励已清空: ${r.count} 条`);
  console.log(`✅ 兑换记录已清空: ${rd.count} 条`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
