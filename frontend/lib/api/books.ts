import { apiFetch, ApiError } from "./client";
import { MOCK_BOOK } from "./mock";
import type { BookDetail } from "./types";

// فلگ موقت: تا آماده شدن API واقعی کاتالوگ. بعداً همراه mock.ts حذف می‌شود
const USE_MOCK = process.env.USE_MOCK_API === "true";

// اگر کتاب نبود null برمی‌گرداند تا صفحه بتواند notFound() صدا بزند
export async function getBook(slug: string): Promise<BookDetail | null> {
  if (USE_MOCK) {
    // فقط یک کتاب داریم؛ بقیه‌ی اسلاگ‌ها ۴۰۴ می‌شوند (برای تست صفحه‌ی ۴۰۴)
    return slug === MOCK_BOOK.slug ? MOCK_BOOK : null;
  }

  try {
    return await apiFetch<BookDetail>(
      `/books/${encodeURIComponent(slug)}/`,
      { revalidate: 60, tags: [`book:${slug}`] }
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}