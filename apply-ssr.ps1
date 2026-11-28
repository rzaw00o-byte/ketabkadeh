$ErrorActionPreference = "Stop"
function Write-File($rel, $content) {
  $path = Join-Path $PWD $rel
  $dir = Split-Path $path -Parent
  if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  [System.IO.File]::WriteAllText($path, $content)
  Write-Host "wrote $rel"
}

Write-File "frontend\lib\api\books.ts" @'
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
'@

Write-File "frontend\components\FilterBar.tsx" @'
type Props = {
  action: string;
  values: Record<string, string | undefined>;
  showQuery?: boolean;
};

export default function FilterBar({ action, values, showQuery }: Props) {
  return (
    <form action={action} method="get" className="flex flex-wrap items-end gap-3 rounded-2xl border border-saffron/20 bg-parchment p-4 shadow-sm">
      {showQuery && (
        <label className="min-w-[200px] flex-1">
          <span className="text-sm font-bold text-ink-soft">جستجو</span>
          <input name="q" defaultValue={values.q} placeholder="عنوان یا نویسنده…" className="mt-1 w-full rounded-lg border border-saffron/25 bg-paper px-3 py-2 focus:border-saffron focus:outline-none" />
        </label>
      )}
      <label>
        <span className="text-sm font-bold text-ink-soft">قالب</span>
        <select name="format" defaultValue={values.format ?? ""} className="mt-1 block rounded-lg border border-saffron/25 bg-paper px-3 py-2 focus:border-saffron focus:outline-none">
          <option value="">همه</option>
          <option value="print">چاپی</option>
          <option value="ebook">الکترونیکی</option>
        </select>
      </label>
      <label>
        <span className="text-sm font-bold text-ink-soft">مرتب‌سازی</span>
        <select name="ordering" defaultValue={values.ordering ?? "-created_at"} className="mt-1 block rounded-lg border border-saffron/25 bg-paper px-3 py-2 focus:border-saffron focus:outline-none">
          <option value="-created_at">جدیدترین</option>
          <option value="price">ارزان‌ترین</option>
          <option value="-price">گران‌ترین</option>
          <option value="-published_year">سال انتشار</option>
        </select>
      </label>
      <label>
        <span className="text-sm font-bold text-ink-soft">حداقل قیمت</span>
        <input name="min_price" type="number" min={0} defaultValue={values.min_price} className="mt-1 block w-28 rounded-lg border border-saffron/25 bg-paper px-3 py-2 focus:border-saffron focus:outline-none" />
      </label>
      <label>
        <span className="text-sm font-bold text-ink-soft">حداکثر قیمت</span>
        <input name="max_price" type="number" min={0} defaultValue={values.max_price} className="mt-1 block w-28 rounded-lg border border-saffron/25 bg-paper px-3 py-2 focus:border-saffron focus:outline-none" />
      </label>
      <label className="flex items-center gap-2 pb-2 text-sm font-bold text-ink-soft">
        <input type="checkbox" name="in_stock" value="true" defaultChecked={values.in_stock === "true"} className="h-4 w-4 accent-saffron" />
        فقط موجود
      </label>
      <button type="submit" className="rounded-lg bg-saffron px-5 py-2 font-extrabold text-white hover:bg-saffron-deep">اعمال</button>
      <a href={action} className="rounded-lg px-3 py-2 text-sm font-bold text-lacquer underline hover:text-danger">پاک‌کردن</a>
    </form>
  );
}
'@

Write-File "frontend\components\BookResults.tsx" @'
import Link from "next/link";
import BookCard from "./BookCard";
import type { BookListItem, Paginated } from "@/lib/api/types";

type Props = {
  data: Paginated<BookListItem>;
  basePath: string;
  query: Record<string, string | undefined>;
};

function pageHref(basePath: string, query: Record<string, string | undefined>, page: number) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v && k !== "page") usp.set(k, v);
  usp.set("page", String(page));
  return `${basePath}?${usp.toString()}`;
}

export default function BookResults({ data, basePath, query }: Props) {
  const current = Number(query.page ?? "1") || 1;
  return (
    <div>
      <p className="mt-4 text-sm font-bold text-ink-soft" aria-live="polite">{data.count} کتاب</p>
      {data.results.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-saffron/30 bg-parchment p-12 text-center text-ink-soft">
          کتابی با این مشخصات پیدا نشد.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.results.map((b, i) => (
            <BookCard key={b.id} book={b} index={i} />
          ))}
        </div>
      )}
      {(current > 1 || data.next) && (
        <nav aria-label="صفحه‌بندی" className="mt-6 flex items-center justify-center gap-3">
          {current > 1 && (
            <Link href={pageHref(basePath, query, current - 1)} className="rounded-lg border border-saffron/30 px-4 py-2 font-bold text-saffron-deep hover:bg-saffron/10">قبلی</Link>
          )}
          <span className="text-sm text-ink-soft">صفحهٔ {current}</span>
          {data.next && (
            <Link href={pageHref(basePath, query, current + 1)} className="rounded-lg border border-saffron/30 px-4 py-2 font-bold text-saffron-deep hover:bg-saffron/10">بعدی</Link>
          )}
        </nav>
      )}
    </div>
  );
}
'@

Write-File "frontend\app\(shop)\search\page.tsx" @'
import type { Metadata } from "next";
import FilterBar from "@/components/FilterBar";
import BookResults from "@/components/BookResults";
import { flattenParams, getBooksFiltered, type SearchParams } from "@/lib/api/books";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const v = flattenParams(await searchParams);
  return { title: v.q ? `جستجو: ${v.q}` : "جستجوی کتاب", robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const values = flattenParams(sp);
  const data = await getBooksFiltered(sp);
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-extrabold">جستجوی کتاب</h1>
      <div className="mt-4"><FilterBar action="/search" values={values} showQuery /></div>
      <BookResults data={data} basePath="/search" query={values} />
    </main>
  );
}
'@

Write-File "frontend\app\(shop)\category\[...slug]\page.tsx" @'
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FilterBar from "@/components/FilterBar";
import BookResults from "@/components/BookResults";
import { flattenParams, getCategory, getBooksFiltered, hasFilters, type SearchParams } from "@/lib/api/books";

type Props = { params: Promise<{ slug: string[] }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategory(slug[slug.length - 1]);
  if (!cat) return { title: "دسته پیدا نشد", robots: { index: false } };
  const filtered = hasFilters(flattenParams(await searchParams));
  return {
    title: cat.name,
    alternates: { canonical: cat.path },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const values = flattenParams(sp);
  const cat = await getCategory(slug[slug.length - 1]);
  if (!cat) notFound();
  const joined = `/category/${slug.join("/")}`;
  if (cat.path !== joined) notFound();

  const data = await getBooksFiltered({ ...sp, category: slug[slug.length - 1] });

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: cat.breadcrumb.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name })),
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <nav aria-label="مسیر صفحه" className="text-sm text-ink-soft">
        <ol className="flex flex-wrap gap-2">
          <li><Link href="/" className="underline hover:text-saffron-deep">خانه</Link></li>
          {cat.breadcrumb.map((c, i) => (
            <li key={c.slug} className="flex gap-2">
              <span aria-hidden="true">/</span>
              {i === cat.breadcrumb.length - 1 ? (
                <span aria-current="page" className="font-bold text-ink">{c.name}</span>
              ) : (
                <Link href={`/category/${cat.breadcrumb.slice(0, i + 1).map((x) => x.slug).join("/")}`} className="underline hover:text-saffron-deep">{c.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <h1 className="mt-4 text-3xl font-extrabold">{cat.name}</h1>
      {cat.children.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {cat.children.map((c) => (
            <Link key={c.slug} href={`${cat.path}/${c.slug}`} className="rounded-full bg-turquoise/10 px-3 py-1 text-sm font-bold text-turquoise hover:bg-turquoise/20">{c.name}</Link>
          ))}
        </div>
      )}
      <div className="mt-6"><FilterBar action={cat.path} values={values} /></div>
      <BookResults data={data} basePath={cat.path} query={values} />
    </main>
  );
}
'@

Write-File "frontend\app\(shop)\author\[slug]\page.tsx" @'
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import FilterBar from "@/components/FilterBar";
import BookResults from "@/components/BookResults";
import { flattenParams, getAuthor, getBooksFiltered, hasFilters, type SearchParams } from "@/lib/api/books";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) return { title: "نویسنده پیدا نشد", robots: { index: false } };
  const filtered = hasFilters(flattenParams(await searchParams));
  return {
    title: author.name,
    description: author.bio.slice(0, 160),
    alternates: { canonical: author.seo.canonical_path },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const values = flattenParams(sp);
  const author = await getAuthor(slug);
  if (!author) notFound();
  const data = await getBooksFiltered({ ...sp, author: slug });

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    description: author.bio,
    ...(author.photo ? { image: author.photo } : {}),
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      <nav aria-label="مسیر صفحه" className="text-sm text-ink-soft">
        <ol className="flex gap-2">
          <li><Link href="/" className="underline hover:text-saffron-deep">خانه</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-bold text-ink">{author.name}</li>
        </ol>
      </nav>
      <h1 className="mt-4 text-3xl font-extrabold">{author.name}</h1>
      {author.bio && <p className="mt-3 max-w-3xl leading-8 text-ink-soft">{author.bio}</p>}
      <div className="mt-6"><FilterBar action={`/author/${slug}`} values={values} /></div>
      <BookResults data={data} basePath={`/author/${slug}`} query={values} />
    </main>
  );
}
'@

Write-Host "SSR pages applied."