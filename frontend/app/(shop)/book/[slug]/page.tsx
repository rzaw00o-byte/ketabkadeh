import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBook } from "@/lib/api/books";
import { formatNumber, formatToman, formatYear } from "@/lib/format";

// ISR: صفحه حداکثر هر ۶۰ ثانیه دوباره ساخته می‌شود
export const revalidate = 60;
// آرایه‌ی خالی: هیچ کتابی موقع build ساخته نمی‌شود (build به بک‌اند وابسته نیست)
// هر کتاب در اولین بازدید ساخته و کش می‌شود، و بعد هر ۶۰ ثانیه تازه می‌شود (ISR)
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

// اسلاگ فارسی در نشانی کدشده می‌آید؛ قبل از استفاده رمزگشایی می‌کنیم
function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

const FORMAT_LABEL = { print: "چاپی", ebook: "الکترونیکی" } as const;

// متادیتای پویا: همه‌چیز از داده‌ی API ساخته می‌شود
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(decodeSlug(slug));

  if (!book) {
    return { title: "کتاب پیدا نشد", robots: { index: false } };
  }

  return {
    title: book.seo.title,
    description: book.seo.description,
    alternates: { canonical: book.seo.canonical_path },
    robots: book.seo.is_indexable ? undefined : { index: false, follow: true },
    openGraph: {
      type: "book",
      title: book.seo.title,
      description: book.seo.description,
      url: book.seo.canonical_path,
      siteName: "کتابکده",
      locale: "fa_IR",
      images: [
        {
          url: book.cover.url,
          width: book.cover.width,
          height: book.cover.height,
          alt: book.cover.alt,
        },
      ],
    },
  };
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const book = await getBook(decodeSlug(slug));

  // کتاب وجود ندارد: صفحه‌ی ۴۰۴ سفارشی با کد وضعیت ۴۰۴ واقعی
  if (!book) notFound();

 

  return (
    <main className="mx-auto max-w-4xl p-6">
      <nav aria-label="مسیر صفحه" className="mb-6 text-sm">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/" className="underline">
              خانه
            </Link>
          </li>
          {book.category.breadcrumb.map((c, i) => (
            <li key={c.slug}>
              <span aria-hidden="true">/ </span>
              <Link
                href={`/category/${book.category.breadcrumb
                  .slice(0, i + 1)
                  .map((x) => x.slug)
                  .join("/")}`}
                className="underline"
              >
                {c.name}
              </Link>
            </li>
          ))}
          <li aria-current="page">
            <span aria-hidden="true">/ </span>
            {book.title}
          </li>
        </ol>
      </nav>

      <article className="grid gap-8 md:grid-cols-[300px_1fr]">
        <Image
          src={book.cover.url}
          alt={book.cover.alt}
          width={book.cover.width}
          height={book.cover.height}
          priority
          className="h-auto w-full rounded"
        />

        <div>
          <h1 className="text-3xl font-bold">{book.title}</h1>

          <p className="mt-2">
            نویسنده:{" "}
            {book.authors.map((a, i) => (
              <span key={a.slug}>
                {i > 0 && "، "}
                <Link href={`/author/${a.slug}`} className="underline">
                  {a.name}
                </Link>
              </span>
            ))}
          </p>
          <p>ناشر: {book.publisher.name}</p>
          <p>
            امتیاز: {formatNumber(book.rating.average)} از ۵ (
            {formatNumber(book.rating.count)} نظر)
          </p>
          <p>
                       {formatNumber(book.pages)} صفحه · سال انتشار{" "}
            {formatYear(book.published_year)}
          </p>

          <section aria-labelledby="editions-heading" className="mt-6">
            <h2 id="editions-heading" className="text-xl font-bold">
              نسخه‌ها
            </h2>
            <ul className="mt-2 space-y-3">
              {book.editions.map((ed) => (
                <li
                  key={ed.id}
                  className="flex items-center justify-between rounded border p-3"
                >
                  <span>
                    {FORMAT_LABEL[ed.format]} · {formatToman(ed.price)}
                  </span>
                  {/* کتاب ناموجود: صفحه می‌ماند، فقط دکمه‌ی خرید غیرفعال است */}
                  <button
                    type="button"
                    disabled={!ed.in_stock}
                    className="rounded bg-blue-700 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {ed.in_stock ? "افزودن به سبد" : "ناموجود"}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="desc-heading" className="mt-6">
            <h2 id="desc-heading" className="text-xl font-bold">
              درباره‌ی کتاب
            </h2>
            <p className="mt-2 leading-8">{book.description}</p>
          </section>
        </div>
      </article>
    </main>
  );
}