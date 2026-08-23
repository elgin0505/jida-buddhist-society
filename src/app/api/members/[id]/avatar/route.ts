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

    // 兼容通过 cuid (id) 或会员自定义编号 (memberId) 查询
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
    await mkdir(avatarDir, { recursive: true });

    // 清理该会员历史上传的头像文件
    try {
      const existingFiles = await readdir(avatarDir);
      const safePrefix = member.memberId.replace(/[^a-zA-Z0-9-_]/g, "_");
      for (const f of existingFiles) {
        if (f.startsWith(`${safePrefix}_`) || f.startsWith(`${safePrefix}.`)) {
          await unlink(join(avatarDir, f)).catch(() => {});
        }
      }
    } catch {}

    if (contentType.includes("application/json")) {
      // 1. JSON Base64 格式上传（极速、无需依赖临时多媒体解析）
      const body = await request.json();
      const { photoData, ext = "jpg" } = body;

      if (!photoData || typeof photoData !== "string") {
        return NextResponse.json({ error: "无效的图片数据" }, { status: 400 });
      }

      // 提取 base64 实际数据
      const base64Match = photoData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      let buffer: Buffer;
      let fileExt = ext;

      if (base64Match) {
        fileExt = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
        buffer = Buffer.from(base64Match[2], "base64");
      } else {
        buffer = Buffer.from(photoData, "base64");
      }

      const timestamp = Date.now();
      const safePrefix = member.memberId.replace(/[^a-zA-Z0-9-_]/g, "_");
      const fileName = `${safePrefix}_${timestamp}.${fileExt}`;
      const filePath = join(avatarDir, fileName);

      await writeFile(filePath, buffer);
      photoUrl = `/avatars/${fileName}?v=${timestamp}`;
    } else {
      // 2. FormData 文件流上传
      const formData = await request.formData();
      const file = formData.get("avatar") as File | null;

      if (!file) {
        return NextResponse.json({ error: "未提供图片文件" }, { status: 400 });
      }

      // 允许任意常见图像类型（包括 iPhone HEIC/HEIF 等）
      if (!file.type.startsWith("image/") && !file.name.match(/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i)) {
        return NextResponse.json({ error: "请上传有效的图片文件" }, { status: 400 });
      }

      if (file.size > 15 * 1024 * 1024) {
        return NextResponse.json({ error: "图片文件过大，请使用 15MB 以内的图片" }, { status: 400 });
      }

      let rawExt = extname(file.name).replace(".", "").toLowerCase();
      if (!rawExt || rawExt === "heic" || rawExt === "heif") {
        rawExt = "jpg";
      }

      const timestamp = Date.now();
      const safePrefix = member.memberId.replace(/[^a-zA-Z0-9-_]/g, "_");
      const fileName = `${safePrefix}_${timestamp}.${rawExt}`;
      const filePath = join(avatarDir, fileName);

      const arrayBuffer = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(arrayBuffer));
      photoUrl = `/avatars/${fileName}?v=${timestamp}`;
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
