import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) {
    return NextResponse.json({ error: "会员不存在" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未提供图片文件" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "仅支持 JPG、PNG、WebP 或 GIF 格式" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "图片大小不能超过 5MB" }, { status: 400 });
    }

    // 保存到 public/avatars/
    const avatarDir = join(process.cwd(), "public", "avatars");
    await mkdir(avatarDir, { recursive: true });

    const ext = extname(file.name) || ".jpg";
    const fileName = `${member.memberId.replace(/[^a-zA-Z0-9-_]/g, "_")}${ext}`;
    const filePath = join(avatarDir, fileName);

    const arrayBuffer = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(arrayBuffer));

    const photoUrl = `/avatars/${fileName}`;

    await prisma.member.update({
      where: { id },
      data: { photo: photoUrl },
    });

    return NextResponse.json({ success: true, photo: photoUrl });
  } catch (error) {
    console.error("[Avatar Upload]", error);
    return NextResponse.json({ error: "上传失败，请稍后重试" }, { status: 500 });
  }
}
