# 技大佛学会 · 出勤与积分追踪系统

马来西亚马六甲马来西亚技术大学（UTeM）佛学会会员出勤记录与奖励积分管理应用。

## 功能

- **会员仪表板** — 个人资料、总积分汇总、出勤与兑换历史、专属签到二维码
- **管理员签到** — 扫描会员二维码或手动查找，记录活动出勤
- **活动列表** — 查看即将举行与往期佛学会活动
- **积分商城** — 使用功德积分兑换精美奖品

## 技术栈

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS 4
- Prisma + SQLite
- html5-qrcode（扫码）+ qrcode（生成会员码）

## 快速开始

```bash
cd jida-buddhist-society
npm install
npx prisma db push
npm run db:seed
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

## 数据库结构

| 数据表 | 字段 |
|--------|------|
| **Members（会员）** | 姓名、电子邮件、会员ID、照片、总积分（Rollup） |
| **AttendanceLog（出勤记录）** | 日期/时间、会员ID、活动名称、获得积分（默认1） |
| **Rewards（奖励）** | 奖品名称、所需积分、图片、描述 |
| **Events（活动）** | 活动名称、描述、日期、地点、积分 |
| **Redemptions（兑换记录）** | 会员ID、奖品ID、消耗积分 |

## 设计

- 主色调：深金黄色 + 赭黄色（袈裟与智慧）
- 点缀色：翠绿色、蓝宝石色、胭脂红
- 字体：Plus Jakarta Sans
- 圆角卡片、微妙阴影、大量留白
