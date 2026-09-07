import { NextResponse } from "next/server";

/**
 * 校验请求是否携带有效的管理员 PIN 码
 * 必须通过环境变量 ADMIN_PIN 配置，严禁硬编码！
 * 支持 Header: x-admin-pin
 */
export function verifyAdminPin(request: Request): { isValid: boolean; errorResponse?: NextResponse } {
  const adminPinHeader = request.headers.get("x-admin-pin");
  const envPin = process.env.ADMIN_PIN;

  const validPins = envPin ? [envPin.trim()] : [];
  if (validPins.length === 0) {
    console.error("[AdminAuth] ADMIN_PIN environment variable is not set");
    return {
      isValid: false,
      errorResponse: NextResponse.json(
        { error: "未经授权：系统管理员 PIN 未在服务器环境变量 (ADMIN_PIN) 中配置，请联系系统管理员" },
        { status: 500 }
      ),
    };
  }

  if (!adminPinHeader || !validPins.includes(adminPinHeader.trim())) {
    return {
      isValid: false,
      errorResponse: NextResponse.json(
        { error: "未经授权的操作：无效或缺失管理员安全验证 PIN 码" },
        { status: 401 }
      ),
    };
  }

  return { isValid: true };
}
