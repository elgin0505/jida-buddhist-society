import { NextResponse } from "next/server";
import { extname } from "path";
import { prisma } from "@/lib/prisma";
import { verifyAdminPin } from "@/lib/adminAuth";
import { requireAuth } from "@/lib/auth";
import { uploadAvatarFile, cleanupLocalOldAvatar } from "@/lib/storage";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. 兼容通过 cuid (id) 或会员编号 (memberId) 查询
    const member = await prisma.member.findFirst({
      where: {
        OR: [{ id }, { memberId: id }],
      },
    });

    if (!member) {
      return NextResponse.json({ error: "会员档案不存在" }, { status: 404 });
    }

    // 2. 严格安全鉴权：仅允许会员本人或持有合法管理员 PIN 码操作
    const adminCheck = verifyAdminPin(request);
    if (!adminCheck.isValid) {
      const { session, errorResponse } = requireAuth(request);
      if (errorResponse) return errorResponse;

      if (
        session?.memberId &&
        session.memberId !== member.id &&
        session.userId !== member.userId
      ) {
        return NextResponse.json(
          { error: "越权操作拒绝：您仅能更新自己的会员头像" },
          { status: 403 }
        );
      }
    }

    const contentTypeHeader = request.headers.get("content-type") || "";
    let buffer: Buffer;
    let mimeType: string = "image/jpeg";
    let fileExt: string = "jpg";

    if (contentTypeHeader.includes("application/json")) {
      // JSON Base64 格式
      const body = await request.json();
      const { photoData } = body;

      if (!photoData || typeof photoData !== "string") {
        return NextResponse.json({ error: "无效的图片数据" }, { status: 400 });
      }

      const base64Match = photoData.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (!base64Match) {
        return NextResponse.json({ error: "图片格式错误，必须为合法的图片数据" }, { status: 400 });
      }

      mimeType = `image/${base64Match[1]}`;
      fileExt = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
      buffer = Buffer.from(base64Match[2], "base64");
    } else {
      // FormData 文件上传
      const formData = await request.formData();
      const file = formData.get("avatar") as File | null;

      if (!file) {
        return NextResponse.json({ error: "未提供图片文件" }, { status: 400 });
      }

      mimeType = file.type || "image/jpeg";
      let rawExt = extname(file.name).replace(".", "").toLowerCase() || "jpg";
      if (rawExt === "heic" || rawExt === "heif") rawExt = "jpg";
      fileExt = rawExt;

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    // 3. 限制文件体积不超过 2MB
    if (buffer.length > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "图片文件过大，请上传小于 2MB 的头像图片" },
        { status: 400 }
      );
    }

    // 4. 清理旧头像本地文件（若存在）
    await cleanupLocalOldAvatar(member.memberId);

    // 5. 将文件上传至存储媒介 (Vercel Blob / Supabase Storage / 本地静态目录 public/avatars/)
    // 彻底从数据库消除 2MB Base64 大文本存储，仅保留轻量级 URL 引用！
    const safePrefix = member.memberId.replace(/[^a-zA-Z0-9-_]/g, "_");
    const fileName = `${safePrefix}_${Date.now()}.${fileExt}`;
    const photoUrl = await uploadAvatarFile(fileName, buffer, mimeType);

    // 6. 更新数据库中该会员的头像 URL 引用
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
