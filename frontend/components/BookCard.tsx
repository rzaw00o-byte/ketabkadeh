import Image from "next/image";
import Link from "next/link";
import type { BookListItem } from "@/lib/api/types";
import { formatToman } from "@/lib/format";

const FORMAT_LABEL = { print: "چاپی", ebook: "الکترونیکی" } as const;

export default function BookCard({ book, index = 0 }: { book: BookListItem; index?: number }) {
  return (
    <Link
      href={`/book/${book.slug}`}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
      className="rise group relative flex flex-col overflow-hidden rounded-xl border border-saffron/15 bg-parchment shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-saffron/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron"
    >
      <span aria-hidden className="absolute inset-y-0 right-0 w-1 bg-linear-to-b from-saffron via-lacquer to-turquoise" />
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-linear-to-br from-paper to-saffron/15">
        {book.cover ? (
          <Image
            src={book.cover.url}
            alt={book.cover.alt}
            width={book.cover.width ?? 600}
            height={book.cover.height ?? 900}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-soft/60">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z" fill="currentColor" opacity=".4" />
              <path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" fill="currentColor" opacity=".25" />
            </svg>
            <span className="text-xs">بدون جلد</span>
          </div>
        )}
        <span
          className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-xs font-bold text-white ${
            book.in_stock ? "bg-success" : "bg-danger"
          }`}
        >
          {book.in_stock ? "موجود" : "ناموجود"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4 ps-5">
        <h3 className="line-clamp-2 font-extrabold text-ink transition-colors group-hover:text-saffron-deep">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-sm text-ink-soft">{book.authors.map((a) => a.name).join("، ")}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="font-extrabold text-saffron-deep">
            {book.price_from === null ? "—" : `از ${formatToman(book.price_from)}`}
          </span>
          <span className="flex gap-1">
            {book.formats.map((f) => (
              <span
                key={f}
                className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                  f === "print" ? "bg-turquoise/10 text-turquoise" : "bg-lapis/10 text-lapis"
                }`}
              >
                {FORMAT_LABEL[f]}
              </span>
            ))}
          </span>
        </div>
      </div>
    </Link>
  );
}