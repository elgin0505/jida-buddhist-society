import { NextResponse } from "next/server";
import { verifyAdminPin } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const auth = verifyAdminPin(request);
  if (!auth.isValid && auth.errorResponse) {
    return auth.errorResponse;
  }
  return NextResponse.json({ success: true, message: "管理员安全验证通过" });
}
