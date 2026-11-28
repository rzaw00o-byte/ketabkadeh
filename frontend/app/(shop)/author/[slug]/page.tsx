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