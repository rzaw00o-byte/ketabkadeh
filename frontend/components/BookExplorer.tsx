"use client";

import { useMemo, useState } from "react";
import BookCard from "./BookCard";
import type { BookListItem } from "@/lib/api/types";

type Format = "all" | "print" | "ebook";
type Sort = "newest" | "price-asc" | "price-desc";

const FORMAT_OPTIONS: { value: Format; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "print", label: "چاپی" },
  { value: "ebook", label: "الکترونیکی" },
];

export default function BookExplorer({ books }: { books: BookListItem[] }) {
  const [q, setQ] = useState("");
  const [format, setFormat] = useState<Format>("all");
  const [sort, setSort] = useState<Sort>("newest");

  const filtered = useMemo(() => {
    const term = q.trim();
    let list = books.filter((b) => {
      const matchQ =
        term === "" ||
        b.title.includes(term) ||
        b.authors.some((a) => a.name.includes(term));
      const matchF = format === "all" || b.formats.includes(format);
      return matchQ && matchF;
    });
    list = [...list];
    if (sort === "price-asc")
      list.sort((a, b) => (a.price_from ?? Infinity) - (b.price_from ?? Infinity));
    else if (sort === "price-desc")
      list.sort((a, b) => (b.price_from ?? -1) - (a.price_from ?? -1));
    else list.sort((a, b) => b.id - a.id);
    return list;
  }, [books, q, format, sort]);

  const dirty = q !== "" || format !== "all" || sort !== "newest";

  return (
    <section aria-label="کاوش کتاب‌ها">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <label className="flex-1 min-w-[200px]">
          <span className="sr-only">جستجو در عنوان یا نویسنده</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجوی کتاب یا نویسنده…"
            className="w-full rounded-lg border border-stone-300 bg-[#faf6ee] px-4 py-2 text-stone-900 placeholder:text-stone-400 focus:border-amber-700 focus:outline-none"
          />
        </label>
        <div role="group" aria-label="قالب" className="flex gap-1">
          {FORMAT_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setFormat(o.value)}
              aria-pressed={format === o.value}
              className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                format === o.value
                  ? "bg-amber-700 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <label>
          <span className="sr-only">مرتب‌سازی</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
          >
            <option value="newest">جدیدترین</option>
            <option value="price-asc">ارزان‌ترین</option>
            <option value="price-desc">گران‌ترین</option>
          </select>
        </label>
        {dirty && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setFormat("all");
              setSort("newest");
            }}
            className="rounded-lg px-3 py-2 text-sm font-bold text-amber-800 underline hover:text-amber-900"
          >
            پاک‌کردن
          </button>
        )}
      </div>

      <p className="mt-4 text-sm text-stone-500" aria-live="polite">
        {filtered.length} کتاب
      </p>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center text-stone-500">
          کتابی با این مشخصات پیدا نشد. فیلترها را تغییر دهید.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}
    </section>
  );
}