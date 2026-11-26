import type { Metadata } from "next";
import BookExplorer from "@/components/BookExplorer";
import { getBooks } from "@/lib/api/books";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "کتابکده | فروشگاه کتاب چاپی و الکترونیکی",
  description:
    "خرید کتاب چاپی و الکترونیکی با جستجو و فیلتر زنده؛ پس از پرداخت، دریافت آنی فایل کتاب.",
};

export default async function Home() {
  const books = await getBooks();

  return (
    <main className="min-h-screen bg-[#faf6ee] text-stone-900">
      <header className="bg-gradient-to-l from-amber-800 via-amber-700 to-stone-900 text-amber-50">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <p className="text-sm font-bold tracking-wide text-amber-200">
            فروشگاه اینترنتی کتاب
          </p>
          <h1 className="mt-2 text-4xl font-extrabold md:text-5xl">کتابکده</h1>
          <p className="mt-4 max-w-2xl leading-8 text-amber-100">
            کتاب چاپی را با ارسال پستی و کتاب الکترونیکی را با دریافت آنی پس از
            پرداخت بخرید. جستجو کنید، فیلتر کنید و نسخهٔ مناسب خود را انتخاب کنید.
          </p>
          <dl className="mt-8 flex gap-8 text-sm">
            <div>
              <dt className="text-amber-200">عنوان فعال</dt>
              <dd className="text-2xl font-extrabold">{books.length}</dd>
            </div>
            <div>
              <dt className="text-amber-200">قالب</dt>
              <dd className="text-2xl font-extrabold">چاپی + الکترونیکی</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <BookExplorer books={books} />
      </div>
    </main>
  );
}