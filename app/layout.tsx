
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "⛛綜合資訊平台",
  description: "零件料號查詢與 CRM 系統入口",
  // 這裡就相當於在 <head> 裡加入相關標籤
  icons: {
    icon: "/favicon.ico", 
  },
  // 針對手機端優化，防止縮放導致 UI 跑位
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning> 
      <body 
        className="min-h-full flex flex-col" 
        suppressHydrationWarning // 加上這一行，無視擴充功能造成的微小差異
      >
        {children}
      </body>
    </html>
  );
}