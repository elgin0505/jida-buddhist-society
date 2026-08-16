import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  if (!memberId) {
    return NextResponse.json({ error: "缺少会员ID" }, { status: 400 });
  }

  const qrDataUrl = await QRCode.toDataURL(memberId, {
    width: 300,
    margin: 2,
    color: {
      dark: "#2c2c2c",
      light: "#faf7f2",
    },
  });

  return NextResponse.json({ qrDataUrl, memberId });
}
