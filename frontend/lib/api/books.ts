import { apiFetch, ApiError } from "./client";
import { MOCK_BOOK } from "./mock";
import type { BookDetail, BookListItem, Paginated } from "./types";

const USE_MOCK = process.env.USE_MOCK_API === "true";

export async function getBook(slug: string): Promise<BookDetail | null> {
  if (USE_MOCK) {
    return slug === MOCK_BOOK.slug ? MOCK_BOOK : null;
  }
  try {
    return await apiFetch<BookDetail>(`/books/${encodeURIComponent(slug)}/`, {
      revalidate: 60,
      tags: [`book:${slug}`],
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function getBooks(): Promise<BookListItem[]> {
  if (USE_MOCK) return [];
  const data = await apiFetch<Paginated<BookListItem>>("/books/?page_size=48", {
    revalidate: 60,
    tags: ["books"],
  });
  return data.results;
}