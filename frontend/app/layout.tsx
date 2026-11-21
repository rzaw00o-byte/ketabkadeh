import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const vazirmatn = localFont({
  src: "./fonts/Vazirmatn.woff2",
  variable: "--font-vazirmatn",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost"
  ),
  title: {
    default: "کتابکده | فروشگاه آنلاین کتاب",
    template: "%s | کتابکده",
  },
  description: "خرید کتاب چاپی و الکترونیکی از کتابکده",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}