import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold text-saffron">کتابکده</p>
          <p className="mt-3 text-sm leading-7 text-paper/70">
            فروشگاه اینترنتی کتاب چاپی و الکترونیکی؛ با جستجو و فیلتر زنده و دریافت آنی فایل پس از پرداخت.
          </p>
        </div>
        <nav aria-label="ناوبری پاورقی">
          <p className="font-bold text-turquoise">دسترسی سریع</p>
          <ul className="mt-3 space-y-2 text-sm text-paper/70">
            <li><Link className="hover:text-saffron" href="/">خانه</Link></li>
            <li><Link className="hover:text-saffron" href="/#catalog">کاوش کتاب‌ها</Link></li>
            <li><Link className="hover:text-saffron" href="/#why">چرا کتابکده</Link></li>
          </ul>
        </nav>
        <div>
          <p className="font-bold text-lacquer">خرید مطمئن</p>
          <ul className="mt-3 space-y-2 text-sm text-paper/70">
            <li>ارسال پستی برای نسخهٔ چاپی</li>
            <li>دریافت آنی برای نسخهٔ الکترونیکی</li>
            <li>پرداخت آزمایشی با مسیر تأیید کامل</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/10 py-4 text-center text-xs text-paper/50">
        کتابکده — پروژهٔ درسی فروشگاه آنلاین کتاب
      </div>
    </footer>
  );
}