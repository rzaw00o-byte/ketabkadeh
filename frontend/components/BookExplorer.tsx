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
    const list = books.filter((b) => {
      const matchQ =
        term === "" || b.title.includes(term) || b.authors.some((a) => a.name.includes(term));
      const matchF = format === "all" || b.formats.includes(format);
      return matchQ && matchF;
    });
    const sorted = [...list];
    if (sort === "price-asc")
      sorted.sort((a, b) => (a.price_from ?? Infinity) - (b.price_from ?? Infinity));
    else if (sort === "price-desc")
      sorted.sort((a, b) => (b.price_from ?? -1) - (a.price_from ?? -1));
    else sorted.sort((a, b) => b.id - a.id);
    return sorted;
  }, [books, q, format, sort]);

  const dirty = q !== "" || format !== "all" || sort !== "newest";

  return (
    <section aria-label="کاوش کتاب‌ها">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-saffron/20 bg-parchment p-4 shadow-sm shadow-ink/5">
        <label className="min-w-[200px] flex-1">
          <span className="sr-only">جستجو در عنوان یا نویسنده</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجوی کتاب یا نویسنده…"
            className="w-full rounded-xl border border-saffron/25 bg-paper px-4 py-2 text-ink placeholder:text-ink-soft/50 focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/25"
          />
        </label>
        <div role="group" aria-label="قالب" className="flex gap-1">
          {FORMAT_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setFormat(o.value)}
              aria-pressed={format === o.value}
              className={`rounded-xl px-3 py-2 text-sm font-bold transition-all ${
                format === o.value
                  ? "bg-linear-to-l from-saffron to-lacquer text-white shadow-sm"
                  : "bg-paper text-ink-soft hover:bg-saffron/15"
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
            className="rounded-xl border border-saffron/25 bg-parchment px-3 py-2 text-sm text-ink focus:border-saffron focus:outline-none"
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
            className="rounded-xl px-3 py-2 text-sm font-bold text-lacquer underline hover:text-danger"
          >
            پاک‌کردن
          </button>
        )}
      </div>

      <p className="mt-4 text-sm font-bold text-ink-soft" aria-live="polite">
        {filtered.length} کتاب
      </p>

      {filtered.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-saffron/30 bg-parchment p-12 text-center text-ink-soft">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="var(--color-saffron)" strokeWidth="2" />
            <path d="m20 20-3.5-3.5" stroke="var(--color-lacquer)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p>کتابی با این مشخصات پیدا نشد.</p>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setFormat("all");
              setSort("newest");
            }}
            className="font-bold text-saffron-deep underline"
          >
            پاک‌کردن فیلترها
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((b, i) => (
            <BookCard key={b.id} book={b} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}