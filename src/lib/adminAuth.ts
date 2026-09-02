import { NextResponse } from "next/server";

/**
 * 校验请求是否携带有效的管理员 PIN 码
 * 支持 Header: x-admin-pin
 * 兼容默认 PIN 码: 1080 / 1688 (或环境变量 ADMIN_PIN)
 */
export function verifyAdminPin(request: Request): { isValid: boolean; errorResponse?: NextResponse } {
  const adminPinHeader = request.headers.get("x-admin-pin");
  const envPin = process.env.ADMIN_PIN;

  const validPins = ["1080", "1688"];
  if (envPin) {
    validPins.push(envPin.trim());
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
