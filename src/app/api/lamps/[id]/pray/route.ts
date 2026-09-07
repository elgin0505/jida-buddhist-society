import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/lamps/[id]/pray
 * 模块三要求：后台防抖调用 API，利用 Prisma 的 increment: 1 原子操作更新数据库中的 prayerCount
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        { error: "缺少莲灯唯一标识" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    
    // 支持单次或合并防抖批量自增数值，默认 increment: 1
    const countVal = Number(body.count);
    const inc = Number.isInteger(countVal) && countVal > 0 ? countVal : 1;

    const updated = await prisma.lamp.update({
      where: { id: id.trim() },
      data: {
        prayerCount: {
          increment: inc,
        },
      },
    });

    return NextResponse.json({
      success: true,
      id: updated.id,
      prayerCount: updated.prayerCount,
    });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "未找到该心灯记录" },
        { status: 404 }
      );
    }
    console.error("[Lamp Pray Error]", error);
    return NextResponse.json(
      { error: "祈祷更新失败" },
      { status: 500 }
    );
  }
}
