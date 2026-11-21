import type { BookDetail } from "./types";

// داده‌ی موقت؛ دقیقاً با شکل نمونه‌ی GET /books/{slug}/ در CONTRACT.md
// بعد از آماده شدن API واقعی، این فایل و فلگ USE_MOCK_API حذف می‌شود
export const MOCK_BOOK: BookDetail = {
  id: 1,
  title: "بوف کور",
  slug: "buf-e-kur",
  isbn: "9780000000001",
  description:
    "این یک متن آزمایشی است که فقط برای دیدن صفحه‌ی کتاب نوشته شده و جایش را بعداً داده‌ی واقعی بک‌اند می‌گیرد.",
  pages: 160,
  published_year: 1315,
  cover: {
    url: "/placeholder-cover.svg",
    alt: "جلد کتاب بوف کور",
    width: 600,
    height: 900,
  },
  authors: [{ name: "صادق هدایت", slug: "sadegh-hedayat", role: "author" }],
  publisher: { name: "نشر نمونه", slug: "nashr-nemooneh" },
  category: {
    name: "رمان",
    slug: "roman",
    breadcrumb: [
      { name: "ادبیات", slug: "adabiyat" },
      { name: "رمان", slug: "roman" },
    ],
  },
  editions: [
    { id: 10, format: "print", price: 250000, stock: 5, in_stock: true },
    { id: 11, format: "ebook", price: 120000, in_stock: true },
  ],
  rating: { average: 4.5, count: 12 },
  seo: {
    title: "خرید کتاب بوف کور",
    description: "خرید آنلاین کتاب چاپی و الکترونیکی بوف کور از کتابکده",
    is_indexable: true,
    canonical_path: "/book/buf-e-kur",
  },
  updated_at: "2026-01-01T00:00:00Z",
};