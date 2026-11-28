import type { Metadata } from "next";
import FilterBar from "@/components/FilterBar";
import BookResults from "@/components/BookResults";
import { flattenParams, getBooksFiltered, type SearchParams } from "@/lib/api/books";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const v = flattenParams(await searchParams);
  return { title: v.q ? `جستجو: ${v.q}` : "جستجوی کتاب", robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const values = flattenParams(sp);
  const data = await getBooksFiltered(sp);
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-extrabold">جستجوی کتاب</h1>
      <div className="mt-4"><FilterBar action="/search" values={values} showQuery /></div>
      <BookResults data={data} basePath="/search" query={values} />
    </main>
  );
}