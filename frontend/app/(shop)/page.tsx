import type { Metadata } from "next";
import BookExplorer from "@/components/BookExplorer";
import Reveal from "@/components/Reveal";
import { getBooks } from "@/lib/api/books";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "کتابکده | فروشگاه کتاب چاپی و الکترونیکی",
  description:
    "خرید کتاب چاپی و الکترونیکی با جستجو و فیلتر زنده؛ پس از پرداخت، دریافت آنی فایل کتاب.",
};

const VALUES = [
  {
    title: "ارسال پستی",
    body: "نسخهٔ چاپی با بسته‌بندی.safe و ارسال پستی به سراسر کشور.",
    color: "var(--color-turquoise)",
    icon: (
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" stroke="currentColor" strokeWidth="1.6" fill="none" />
    ),
  },
  {
    title: "دریافت آنی",
    body: "نسخهٔ الکترونیکی بلافاصله پس از پرداخت موفق، با لینک موقت و امن.",
    color: "var(--color-lapis)",
    icon: (
      <path d="M12 3v10m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    ),
  },
  {
    title: "پرداخت مطمئن",
    body: "درگاه آزمایشی با مسیر تأیید کامل؛ وضعیت سفارش همیشه شفاف.",
    color: "var(--color-lacquer)",
    icon: (
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6zM9.5 12l2 2 3.5-4" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

export default async function Home() {
  const books = await getBooks();
  const authors = Array.from(new Set(books.flatMap((b) => b.authors.map((a) => a.name))));

  return (
    <main className="min-h-screen">
      <header className="relative overflow-hidden bg-ink text-paper">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(60rem 30rem at 85% -10%, rgba(180,83,9,.55), transparent 60%), radial-gradient(50rem 26rem at 10% 110%, rgba(15,118,110,.4), transparent 60%), radial-gradient(40rem 22rem at 50% 50%, rgba(159,18,57,.3), transparent 65%)",
          }}
        />
        <div aria-hidden className="orb left-[-6rem] top-[-4rem] h-72 w-72 bg-turquoise/40" />
        <div aria-hidden className="orb right-[-4rem] bottom-[-6rem] h-80 w-80 bg-saffron/40" style={{ animationDelay: "-8s" }} />

        <div className="relative mx-auto max-w-6xl px-6 py-20">
          <p className="rise text-sm font-bold tracking-wide text-saffron">فروشگاه اینترنتی کتاب</p>
          <h1 className="rise mt-3 text-5xl font-extrabold leading-tight md:text-6xl" style={{ animationDelay: "80ms" }}>
            کتابکده
          </h1>
          <p className="rise mt-5 max-w-2xl text-lg leading-9 text-paper/80" style={{ animationDelay: "160ms" }}>
            کتاب چاپی را با ارسال پستی و کتاب الکترونیکی را با دریافت آنی پس از پرداخت بخرید.
            جستجو کنید، فیلتر کنید و نسخهٔ مناسب خود را انتخاب کنید.
          </p>
          <div className="rise mt-8 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
            <a href="#catalog" className="rounded-xl bg-gradient-to-l from-saffron to-lacquer px-6 py-3 font-extrabold text-white shadow-lg shadow-lacquer/30 transition-transform hover:scale-105">
              کاوش کتاب‌ها
            </a>
            <a href="#why" className="rounded-xl border border-paper/30 px-6 py-3 font-extrabold text-paper transition-colors hover:bg-paper/10">
              چرا کتابکده؟
            </a>
          </div>
          <dl className="rise mt-12 flex flex-wrap gap-10" style={{ animationDelay: "320ms" }}>
            <div>
              <dt className="text-sm text-paper/60">عنوان فعال</dt>
              <dd className="text-3xl font-extrabold text-saffron">{books.length}</dd>
            </div>
            <div>
              <dt className="text-sm text-paper/60">قالب</dt>
              <dd className="text-3xl font-extrabold text-turquoise">چاپی + الکترونیکی</dd>
            </div>
            <div>
              <dt className="text-sm text-paper/60">دریافت الکترونیکی</dt>
              <dd className="text-3xl font-extrabold text-lacquer">آنی</dd>
            </div>
          </dl>
        </div>

        {authors.length > 0 && (
          <div className="relative border-t border-paper/10 py-4" dir="ltr">
            <div className="marquee-track text-sm font-bold text-paper/50">
              {[...authors, ...authors].map((name, i) => (
                <span key={`${name}-${i}`} aria-hidden={i >= authors.length}>
                  {name} ✦
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      <div id="catalog" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-12">
        <Reveal>
          <BookExplorer books={books} />
        </Reveal>
      </div>

      <section id="why" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-8">
        <Reveal>
          <h2 className="text-2xl font-extrabold text-ink">چرا کتابکده؟</h2>
        </Reveal>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 120}>
              <div className="h-full rounded-2xl border border-saffron/15 bg-parchment p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/10">
                <svg width="36" height="36" viewBox="0 0 24 24" style={{ color: v.color }} aria-hidden="true">
                  {v.icon}
                </svg>
                <h3 className="mt-4 text-lg font-extrabold" style={{ color: v.color }}>
                  {v.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-ink-soft">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}