import { NextResponse } from "next/server";
import { writeFile, mkdir, readdir, unlink } from "fs/promises";
import { join, extname } from "path";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 兼容通过 cuid (id) 或会员编号 (memberId) 查询
    const member = await prisma.member.findFirst({
      where: {
        OR: [{ id }, { memberId: id }],
      },
    });

    if (!member) {
      return NextResponse.json({ error: "会员不存在" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") || "";
    let photoUrl = "";

    const avatarDir = join(process.cwd(), "public", "avatars");

    // 尝试清理本地开发环境中的历史头像文件（非阻塞）
    try {
      await mkdir(avatarDir, { recursive: true });
      const existingFiles = await readdir(avatarDir);
      const safePrefix = member.memberId.replace(/[^a-zA-Z0-9-_]/g, "_");
      for (const f of existingFiles) {
        if (f.startsWith(`${safePrefix}_`) || f.startsWith(`${safePrefix}.`)) {
          await unlink(join(avatarDir, f)).catch(() => {});
        }
      }
    } catch {}

    if (contentType.includes("application/json")) {
      // 1. JSON Base64 格式（全平台及 Vercel Serverless / PostgreSQL 强保证）
      const body = await request.json();
      const { photoData } = body;

      if (!photoData || typeof photoData !== "string") {
        return NextResponse.json({ error: "无效的图片数据" }, { status: 400 });
      }

      // 直接以标准 Data URL 存入数据库，具备永久可用性，完全免疫无状态容器重置与只读文件系统
      photoUrl = photoData;

      // 尝试在本地环境写入静态文件备份（只读环境自动忽略）
      try {
        const base64Match = photoData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (base64Match) {
          const fileExt = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
          const buffer = Buffer.from(base64Match[2], "base64");
          const safePrefix = member.memberId.replace(/[^a-zA-Z0-9-_]/g, "_");
          const fileName = `${safePrefix}_${Date.now()}.${fileExt}`;
          await writeFile(join(avatarDir, fileName), buffer).catch(() => {});
        }
      } catch {}
    } else {
      // 2. FormData 文件流上传
      const formData = await request.formData();
      const file = formData.get("avatar") as File | null;

      if (!file) {
        return NextResponse.json({ error: "未提供图片文件" }, { status: 400 });
      }

      if (!file.type.startsWith("image/") && !file.name.match(/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i)) {
        return NextResponse.json({ error: "请上传有效的图片文件" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = file.type || "image/jpeg";
      const base64String = buffer.toString("base64");
      photoUrl = `data:${mimeType};base64,${base64String}`;

      // 尝试在本地环境写入静态文件备份
      try {
        let rawExt = extname(file.name).replace(".", "").toLowerCase() || "jpg";
        if (rawExt === "heic" || rawExt === "heif") rawExt = "jpg";
        const safePrefix = member.memberId.replace(/[^a-zA-Z0-9-_]/g, "_");
        const fileName = `${safePrefix}_${Date.now()}.${rawExt}`;
        await writeFile(join(avatarDir, fileName), buffer).catch(() => {});
      } catch {}
    }

    // 更新数据库中该会员的头像记录
    const updatedMember = await prisma.member.update({
      where: { id: member.id },
      data: { photo: photoUrl },
    });

    return NextResponse.json({
      success: true,
      photo: photoUrl,
      member: updatedMember,
    });
  } catch (error: any) {
    console.error("[Avatar Upload Error]", error);
    return NextResponse.json(
      { error: error?.message || "头像上传失败，请稍后重试" },
      { status: 500 }
    );
  }
}
