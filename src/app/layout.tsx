import type { Metadata, Viewport } from "next";
import { Zen_Maru_Gothic } from "next/font/google";
import "./globals.css";

const maru = Zen_Maru_Gothic({
  weight: ["500", "700", "900"],
  subsets: ["latin"],
  preload: false,
  display: "swap",
  variable: "--font-maru",
});

export const metadata: Metadata = {
  title: "かずのへや - さんすうアプリ",
  description: "小学1年生のための数の概念学習アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "かずのへや",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FFF8EE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={maru.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
