import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Navigation } from "@/components/Navigation";
import { MemberProvider } from "@/components/MemberContext";
import { LoadingTransition } from "@/components/LoadingTransition";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { PWAInstaller } from "@/components/PWAInstaller";
import { Toaster } from "sonner";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#c9a227",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
    <html lang="zh-CN" className={plusJakarta.variable} suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <MemberProvider>
            <LoadingTransition />
            <Navigation />
            <AuthGuard>
              <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
            </AuthGuard>
            <PWAInstaller />
            <Toaster position="top-center" richColors />
          </MemberProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
