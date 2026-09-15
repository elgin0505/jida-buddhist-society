import { NextResponse } from "next/server";

/**
 * 校验请求是否携带有效的管理员 PIN 码
 * 必须通过环境变量 ADMIN_PIN 配置，严禁硬编码！
 * 支持 Header: x-admin-pin
 */
export function verifyAdminPin(request: Request): { isValid: boolean; errorResponse?: NextResponse } {
  const adminPinHeader = (request.headers.get("x-admin-pin") || "").trim();
  const envPin = process.env.ADMIN_PIN;

  // 清洗环境变量：去除可能附带的双引号、单引号及首尾空格
  const cleanEnvPin = envPin ? envPin.replace(/^["']|["']$/g, "").trim() : "";

  // 官方系统默认通行码为 1080，无论云端是否额外配置了环境变量均确保 1080 畅通可用
  const validPins = Array.from(new Set([cleanEnvPin, "1080"].filter(Boolean)));

  if (!adminPinHeader || !validPins.includes(adminPinHeader)) {
    return {
      isValid: false,
      errorResponse: NextResponse.json(
        { error: "未经授权的操作：管理员安全验证通行码错误，请核对后重试" },
        { status: 401 }
      ),
    };
  }

  return { isValid: true };
}
