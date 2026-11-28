import { apiFetch, ApiError } from "./client";
import { MOCK_BOOK } from "./mock";
import type { BookDetail, BookListItem, NamedRef, Paginated } from "./types";

const USE_MOCK = process.env.USE_MOCK_API === "true";

export type CategoryDetail = {
  name: string;
  slug: string;
  path: string;
  breadcrumb: NamedRef[];
  children: NamedRef[];
};

export type AuthorDetail = {
  name: string;
  slug: string;
  bio: string;
  photo: string | null;
  seo: { title: string; description: string; is_indexable: boolean; canonical_path: string };
};

export type SearchParams = Record<string, string | string[] | undefined>;

export function flattenParams(sp: SearchParams): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) out[k] = Array.isArray(v) ? v[0] : v;
  return out;
}

export function hasFilters(v: Record<string, string | undefined>): boolean {
  return ["format", "min_price", "max_price", "in_stock", "ordering", "page"].some(
    (k) => v[k] !== undefined && v[k] !== ""
  );
}

export async function getBook(slug: string): Promise<BookDetail | null> {
  if (USE_MOCK) return slug === MOCK_BOOK.slug ? MOCK_BOOK : null;
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

export async function getBooksFiltered(sp: SearchParams): Promise<Paginated<BookListItem>> {
  const flat = flattenParams(sp);
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(flat)) if (v) usp.set(k, v);
  const qs = usp.toString();
  return apiFetch<Paginated<BookListItem>>(`/books/${qs ? `?${qs}` : ""}`, { cache: "no-store" });
}

export async function getCategory(slug: string): Promise<CategoryDetail | null> {
  try {
    return await apiFetch<CategoryDetail>(`/categories/${encodeURIComponent(slug)}/`, { cache: "no-store" });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export async function getAuthor(slug: string): Promise<AuthorDetail | null> {
  try {
    return await apiFetch<AuthorDetail>(`/authors/${encodeURIComponent(slug)}/`, { cache: "no-store" });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}