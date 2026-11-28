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