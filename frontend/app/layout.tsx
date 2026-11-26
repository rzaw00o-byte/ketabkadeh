import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const vazirmatn = localFont({
  src: "./fonts/Vazirmatn.woff2",
  variable: "--font-vazirmatn",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: { default: "کتابکده | فروشگاه کتاب چاپی و الکترونیکی", template: "%s | کتابکده" },
  description:
    "خرید کتاب چاپی با ارسال پستی و کتاب الکترونیکی با دریافت آنی پس از پرداخت؛ جستجو و فیلتر زنده در کاتالوگ کتابکده.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="bg-paper font-sans text-ink antialiased">
        <div aria-hidden className="grain-overlay" />
        <SiteHeader />
        <div className="relative">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}