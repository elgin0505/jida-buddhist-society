import type { Metadata, Viewport } from "next";
import { Navigation } from "@/components/Navigation";
import { MemberProvider } from "@/components/MemberContext";
import { LoadingTransition } from "@/components/LoadingTransition";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { CinematicNoise } from "@/components/CinematicNoise";
import { BackToTop } from "@/components/BackToTop";
import { MainLayout } from "@/components/MainLayout";
import { Toaster } from "sonner";
import "./globals.css";

// Removed next/font/google to prevent ENOTFOUND fonts.googleapis.com
// We will rely on system fonts defined in globals.css

export const viewport: Viewport = {
  themeColor: "#c9a227",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover", // iPhone 刘海/安全区适配
};

export const metadata: Metadata = {
  title: "技大佛学会 · 出勤与积分追踪",
  description: "技大佛学会会员出勤记录与奖励积分管理系统",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "技大佛学会",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <MemberProvider>
            <LoadingTransition />
            <Navigation />
            <AuthGuard>
              <MainLayout>{children}</MainLayout>
            </AuthGuard>
            <BackToTop />
            <CinematicNoise />
            <Toaster position="top-center" richColors />
          </MemberProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

