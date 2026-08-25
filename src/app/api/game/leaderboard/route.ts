import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET top‑10 scores
export async function GET() {
  try {
    const scores = await prisma.zenGameScore.findMany({
      take: 10,
      orderBy: { score: "desc" },
      include: { user: { select: { name: true } } },
    });
    const leaderboard = scores.map((s: (typeof scores)[number]) => ({
      id: s.id,
      userId: s.userId,
      name: s.user.name,
      score: s.score,
      maxCombo: s.maxCombo,
      achievedAt: s.achievedAt,
    }));
    return NextResponse.json({ leaderboard });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}

// POST new score (upsert highest per user)
export async function POST(req: Request) {
  try {
    const { userId, score, maxCombo } = await req.json();
    if (!userId || typeof score !== "number" || typeof maxCombo !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const existing = await prisma.zenGameScore.findFirst({
      where: { userId },
      orderBy: { score: "desc" },
    });
    if (!existing || score > existing.score) {
      await prisma.zenGameScore.create({
        data: { userId, score, maxCombo },
      });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
  }
}
