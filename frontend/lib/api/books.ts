import { apiFetch, ApiError } from "./client";
import type { BookDetail } from "./types";

// اگر کتاب نبود null برمی‌گرداند تا صفحه بتواند notFound() صدا بزند
export async function getBook(slug: string): Promise<BookDetail | null> {
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