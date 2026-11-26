import Image from "next/image";
import Link from "next/link";
import type { BookListItem } from "@/lib/api/types";
import { formatToman } from "@/lib/format";

const FORMAT_LABEL = { print: "چاپی", ebook: "الکترونیکی" } as const;

export default function BookCard({ book }: { book: BookListItem }) {
  return (
    <Link
      href={`/book/${book.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-900/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-gradient-to-br from-stone-200 to-amber-100">
        {book.cover ? (
          <Image
            src={book.cover.url}
            alt={book.cover.alt}
            width={book.cover.width ?? 600}
            height={book.cover.height ?? 900}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-500">
            بدون جلد
          </div>
        )}
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold ${
            book.in_stock ? "bg-emerald-700 text-white" : "bg-stone-500 text-white"
          }`}
        >
          {book.in_stock ? "موجود" : "ناموجود"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 font-bold text-stone-900 group-hover:text-amber-800">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-sm text-stone-500">
          {book.authors.map((a) => a.name).join("، ")}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="font-bold text-amber-800">
            {book.price_from === null ? "—" : `از ${formatToman(book.price_from)}`}
          </span>
          <span className="flex gap-1">
            {book.formats.map((f) => (
              <span
                key={f}
                className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600"
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