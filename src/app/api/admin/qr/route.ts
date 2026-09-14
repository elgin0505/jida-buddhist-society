import { NextRequest, NextResponse } from "next/server";
import { createAttendanceToken } from "@/lib/attendance-token";
import { verifyAdminPin } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  try {
    const adminPin = req.headers.get("x-admin-pin");
    if (adminPin) {
      const auth = verifyAdminPin(req);
      if (!auth.isValid && auth.errorResponse) {
        return auth.errorResponse;
      }
    }

    const { eventId } = await req.json();
    if (!eventId) {
      return NextResponse.json({ error: "缺少 eventId" }, { status: 400 });
    }

    const record = await createAttendanceToken(eventId);

    return NextResponse.json({
      token: record.token,
      expiresAt: record.expiresAt,
    });
  } catch (err) {
    console.error("[POST /api/admin/qr]", err);
    return NextResponse.json({ error: "生成二维码失败" }, { status: 500 });
  }
}
