import { NextResponse } from "next/server";
import { verifyAdminPin } from "@/lib/adminAuth";

export async function POST(request: Request) {
  // 1. 优先尝试从 Header 校验
  let auth = verifyAdminPin(request);
  if (auth.isValid) {
    return NextResponse.json({ success: true, message: "管理员安全验证通过" });
  }

  // 2. 兼容网络代理剥离 Header 的情况，尝试从 Body 提取通行码
  try {
    const clone = request.clone();
    const body = await clone.json().catch(() => ({}));
    if (body && body.pin) {
      const fallbackReq = new Request(request.url, {
        headers: { "x-admin-pin": String(body.pin).trim() },
      });
      auth = verifyAdminPin(fallbackReq);
      if (auth.isValid) {
        return NextResponse.json({ success: true, message: "管理员安全验证通过" });
      }
    }
  } catch {
    // ignore
  }

  if (!auth.isValid && auth.errorResponse) {
    return auth.errorResponse;
  }
  return NextResponse.json({ success: true, message: "管理员安全验证通过" });
}
