import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Navigation } from "@/components/Navigation";
import { MemberProvider } from "@/components/MemberContext";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "技大佛学会 · 出勤与积分追踪",
  description: "技大佛学会会员出勤记录与奖励积分管理系统",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={plusJakarta.variable}>
      <body className="font-sans">
        <MemberProvider>
          <Navigation />
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
        </MemberProvider>
      </body>
    </html>
  );
}
