import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import { getBook } from "@/lib/api/books";
import { formatNumber, formatToman, formatYear } from "@/lib/format";

// ISR: صفحه حداکثر هر ۶۰ ثانیه تازه می‌شود؛ build به بک‌اند وابسته نیست
export const revalidate = 60;
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

const FORMAT_LABEL = { print: "چاپی", ebook: "الکترونیکی" } as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(decodeSlug(slug));

  if (!book) return { title: "کتاب پیدا نشد", robots: { index: false } };

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
      images: book.cover
        ? [
            {
              url: book.cover.url,
              width: book.cover.width ?? undefined,
              height: book.cover.height ?? undefined,
              alt: book.cover.alt,
            },
          ]
        : [],
    },
  };
}

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const book = await getBook(decodeSlug(slug));
  if (!book) notFound();

  const bookLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    ...(book.isbn ? { isbn: book.isbn } : {}),
    ...(book.pages !== null ? { numberOfPages: book.pages } : {}),
    ...(book.cover ? { image: book.cover.url } : {}),
    author: book.authors.map((a) => ({ "@type": "Person", name: a.name })),
    publisher: { "@type": "Organization", name: book.publisher.name },
    ...(book.rating.average !== null && book.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: book.rating.average,
            reviewCount: book.rating.count,
            bestRating: 5,
          },
        }
      : {}),
    offers: book.editions.map((ed) => ({
      "@type": "Offer",
      price: ed.price * 10, // تومان → ریال (ISO 4217)
      priceCurrency: "IRR",
      availability: ed.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "خانه", item: "/" },
      ...book.category.breadcrumb.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.name,
      })),
      {
        "@type": "ListItem",
        position: book.category.breadcrumb.length + 2,
        name: book.title,
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#faf6ee] text-stone-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <header className="bg-linear-to-l from-amber-800 via-amber-700 to-stone-900 text-amber-50">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <nav aria-label="مسیر صفحه" className="mb-4 text-sm text-amber-200">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="underline hover:text-white">
                  خانه
                </Link>
              </li>
              {book.category.breadcrumb.map((c, i) => (
                <li key={c.slug} className="flex items-center gap-2">
                  <span aria-hidden="true">/</span>
                  <Link
                    href={`/category/${book.category.breadcrumb
                      .slice(0, i + 1)
                      .map((x) => x.slug)
                      .join("/")}`}
                    className="underline hover:text-white"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
              <li aria-current="page" className="flex items-center gap-2">
                <span aria-hidden="true">/</span>
                <span className="text-amber-50">{book.title}</span>
              </li>
            </ol>
          </nav>
          <h1 className="text-3xl font-extrabold md:text-4xl">{book.title}</h1>
          <p className="mt-2 text-amber-200">
            {book.authors.map((a, i) => (
              <span key={a.slug}>
                {i > 0 && "، "}
                <Link href={`/author/${a.slug}`} className="underline hover:text-white">
                  {a.name}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </header>

      <article className="mx-auto grid max-w-5xl gap-8 px-6 py-8 md:grid-cols-[300px_1fr]">
        <div className="md:sticky md:top-6 md:self-start">
          {book.cover ? (
            <Image
              src={book.cover.url}
              alt={book.cover.alt}
              width={book.cover.width ?? 600}
              height={book.cover.height ?? 900}
              priority
              className="h-auto w-full rounded-xl shadow-lg shadow-stone-400/40"
            />
          ) : (
            <div
              role="img"
              aria-label={`جلد کتاب ${book.title} موجود نیست`}
              className="flex aspect-[2/3] w-full items-center justify-center rounded-xl bg-linear-to-br from-stone-200 to-amber-100 text-stone-500 shadow-inner"
            >
              بدون جلد
            </div>
          )}
        </div>

        <div>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-lg border border-stone-200 bg-white p-3">
              <dt className="text-stone-500">ناشر</dt>
              <dd className="mt-1 font-bold">{book.publisher.name}</dd>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white p-3">
              <dt className="text-stone-500">امتیاز</dt>
              <dd className="mt-1 font-bold">
                {book.rating.average === null ? "—" : formatNumber(book.rating.average)}{" "}
                از ۵ ({formatNumber(book.rating.count)} نظر)
              </dd>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white p-3">
              <dt className="text-stone-500">صفحه / سال</dt>
              <dd className="mt-1 font-bold">
                {formatNumber(book.pages)} صفحه · {formatYear(book.published_year)}
              </dd>
            </div>
            {book.isbn && (
              <div className="rounded-lg border border-stone-200 bg-white p-3">
                <dt className="text-stone-500">شابک</dt>
                <dd className="mt-1 font-bold" dir="ltr">
                  {book.isbn}
                </dd>
              </div>
            )}
          </dl>

          <section aria-labelledby="editions-heading" className="mt-8">
            <h2 id="editions-heading" className="text-xl font-bold">
              نسخه‌ها
            </h2>
            <ul className="mt-3 space-y-3">
              {book.editions.map((ed) => (
                <li
                  key={ed.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
                >
                  <div>
                    <span className="font-bold">{FORMAT_LABEL[ed.format]}</span>
                    <span className="mr-3 text-amber-800">{formatToman(ed.price)}</span>
                    {ed.format === "print" && ed.stock != null && (
                      <span className="mr-3 text-sm text-stone-500">
                        موجودی: {formatNumber(ed.stock)}
                      </span>
                    )}
                  </div>
                  <AddToCartButton
                    editionId={ed.id}
                    inStock={ed.in_stock}
                    title={book.title}
                    price={ed.price}
                    format={ed.format}
                  />
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="desc-heading" className="mt-8">
            <h2 id="desc-heading" className="text-xl font-bold">
              درباره‌ی کتاب
            </h2>
            <p className="mt-3 leading-8 text-stone-700">{book.description}</p>
          </section>
        </div>
      </article>
    </main>
  );
}