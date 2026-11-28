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