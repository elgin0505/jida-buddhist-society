import { writeFile, mkdir, unlink, readdir } from "fs/promises";
import { join } from "path";

/**
 * 统一头像文件存储服务
 * 1. 优先检查 Vercel Blob (BLOB_READ_WRITE_TOKEN) -> 上传并返回 Vercel CDN URL
 * 2. 其次检查 Supabase Storage (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) -> 上传并返回 Supabase CDN URL
 * 3. 本地开发环境 -> 写入 public/avatars/ 并返回可直接访问的静态资源相对路径 /avatars/...
 * 彻底杜绝在数据库 PostgreSQL text 列中存放 2MB Base64 字符串的弊端！
 */
export async function uploadAvatarFile(
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  // 1. 尝试使用 Vercel Blob 存储 (生产环境推荐，Vercel 控制台一键开通)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(`avatars/${fileName}`, buffer, {
        access: "public",
        contentType,
      });
      return blob.url;
    } catch (err) {
      console.warn("[Storage] Vercel Blob 上传失败，尝试备用存储方式:", err);
    }
  }

  // 2. 尝试使用 Supabase Storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const uploadUrl = `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/avatars/${fileName}`;
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body: new Uint8Array(buffer),
      });

      if (res.ok) {
        return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/avatars/${fileName}`;
      }
    } catch (err) {
      console.warn("[Storage] Supabase Storage 上传失败，尝试本地写入:", err);
    }
  }

  // 3. 本地存储 (开发环境或具备持久化磁盘的环境)
  const avatarDir = join(process.cwd(), "public", "avatars");
  await mkdir(avatarDir, { recursive: true });

  const filePath = join(avatarDir, fileName);
  await writeFile(filePath, buffer);

  return `/avatars/${fileName}`;
}

/**
 * 清理本地旧头像文件
 */
export async function cleanupLocalOldAvatar(memberCode: string) {
  try {
    const avatarDir = join(process.cwd(), "public", "avatars");
    const safePrefix = memberCode.replace(/[^a-zA-Z0-9-_]/g, "_");
    const files = await readdir(avatarDir);
    for (const file of files) {
      if (file.startsWith(`${safePrefix}_`) || file.startsWith(`${safePrefix}.`)) {
        await unlink(join(avatarDir, file)).catch(() => {});
      }
    }
  } catch {}
}
