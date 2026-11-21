import Link from "next/link";

export default function NotFound() {
  return (
    <main className="p-8 text-center">
      <h1 className="text-3xl font-bold">۴۰۴ | صفحه پیدا نشد</h1>
      <p className="mt-2">صفحه‌ای که دنبالش بودید وجود ندارد.</p>
      <Link href="/" className="mt-4 inline-block underline">
        بازگشت به صفحه اصلی
      </Link>
    </main>
  );
}