"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { CART_EVENT, cartTotal, readCart, writeCart, type Cart, type CartEntry } from "@/lib/cart";
import { formatToman } from "@/lib/format";
import { makeCode, saveOrder, type LocalOrder } from "@/lib/orders";

const FORMAT_LABEL = { print: "چاپی", ebook: "الکترونیکی" } as const;
const SHIPPING_PRINT = 50000;

type Step = "cart" | "checkout" | "paying" | "success";

export default function CartPage() {
  const [cart, setCart] = useState<Cart>({});
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<Step>("cart");
  const [removed, setRemoved] = useState<{ key: string; entry: CartEntry } | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<LocalOrder | null>(null);

  useEffect(() => {
    setCart(readCart());
    setReady(true);
    const onChange = (e: Event) => setCart((e as CustomEvent<Cart>).detail ?? readCart());
    window.addEventListener(CART_EVENT, onChange);
    return () => window.removeEventListener(CART_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (!removed) return;
    const t = setTimeout(() => setRemoved(null), 5000);
    return () => clearTimeout(t);
  }, [removed]);

  const entries = Object.entries(cart);
  const hasPrint = entries.some(([, e]) => e.format === "print");
  const subtotal = cartTotal(cart);
  const shipping = hasPrint ? SHIPPING_PRINT : 0;
  const total = subtotal + shipping;

  function setQty(key: string, qty: number) {
    const next = { ...cart };
    if (qty <= 0) {
      const entry = next[key];
      delete next[key];
      setRemoved({ key, entry });
    } else {
      next[key] = { ...next[key], qty };
    }
    setCart(next);
    writeCart(next);
  }

  function undo() {
    if (!removed) return;
    const next = { ...cart, [removed.key]: removed.entry };
    setCart(next);
    writeCart(next);
    setRemoved(null);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "نام و نام خانوادگی الزامی است.";
    if (!/^09\d{9}$/.test(form.phone)) errs.phone = "شماره موبایل معتبر ایرانی وارد کنید (۰۹…).";
    if (hasPrint && !form.address.trim()) errs.address = "برای نسخهٔ چاپی، نشانی پستی الزامی است.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStep("paying");
    setTimeout(() => {
      const o: LocalOrder = {
        code: makeCode(),
        createdAt: new Date().toISOString(),
        items: entries.map(([k, e]) => ({
          editionId: k,
          title: e.title,
          format: e.format,
          unitPrice: e.price,
          qty: e.qty,
        })),
        subtotal,
        shipping,
        total,
        contact: { ...form },
      };
      saveOrder(o);
      setOrder(o);
      writeCart({});
      setCart({});
      setStep("success");
    }, 1200);
  }

  if (!ready) {
    return <main className="mx-auto max-w-5xl px-6 py-16 text-ink-soft">در حال بارگذاری سبد…</main>;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <nav aria-label="مسیر صفحه" className="mb-6 text-sm text-ink-soft">
        <ol className="flex gap-2">
          <li><Link href="/" className="underline hover:text-saffron-deep">خانه</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-bold text-ink">سبد خرید</li>
        </ol>
      </nav>

      {step === "success" && order ? (
        <section className="rise rounded-2xl border border-success/30 bg-parchment p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-2xl text-white">✓</span>
            <div>
              <h1 className="text-2xl font-extrabold text-success">سفارش آزمایشی ثبت شد</h1>
              <p className="text-sm text-ink-soft">کد پیگیری: <span className="font-extrabold text-ink" dir="ltr">{order.code}</span></p>
            </div>
          </div>
          <ul className="mt-6 divide-y divide-saffron/15 rounded-xl border border-saffron/20 bg-white">
            {order.items.map((it) => (
              <li key={it.editionId} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-bold">{it.title}</p>
                  <p className="text-sm text-ink-soft">{FORMAT_LABEL[it.format]} × {it.qty}</p>
                </div>
                <span className="font-bold text-saffron-deep">{formatToman(it.unitPrice * it.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between"><dt>جمع اقلام</dt><dd>{formatToman(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>ارسال پستی</dt><dd>{order.shipping ? formatToman(order.shipping) : "رایگان"}</dd></div>
            <div className="flex justify-between text-base font-extrabold"><dt>مبلغ کل</dt><dd className="text-saffron-deep">{formatToman(order.total)}</dd></div>
          </dl>
          <p className="mt-4 rounded-lg bg-info/10 p-3 text-sm text-info">
            این تسویه، آزمایشی و سمت‌کلاینت است. پرداخت واقعی و لینک دانلود نسخهٔ الکترونیکی با بک‌اند (درگاه + Verify + Presigned URL) در هفتهٔ ۳ فعال می‌شود.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/" className="rounded-xl bg-saffron px-6 py-3 font-extrabold text-white hover:bg-saffron-deep">بازگشت به فروشگاه</Link>
            <button type="button" onClick={() => { setOrder(null); setStep("cart"); }} className="rounded-xl border border-saffron/30 px-6 py-3 font-extrabold text-saffron-deep hover:bg-saffron/10">سبد جدید</button>
          </div>
        </section>
      ) : entries.length === 0 ? (
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-saffron/30 bg-parchment p-16 text-center">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z" fill="var(--color-saffron)" opacity=".35" />
            <path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" fill="var(--color-turquoise)" opacity=".35" />
          </svg>
          <h1 className="text-2xl font-extrabold">سبد شما خالی است</h1>
          <p className="text-ink-soft">کتابی اضافه کنید تا اینجا نمایش داده شود.</p>
          <Link href="/#catalog" className="rounded-xl bg-saffron px-6 py-3 font-extrabold text-white hover:bg-saffron-deep">کاوش کتاب‌ها</Link>
        </section>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <section aria-label="اقلام سبد">
            <h1 className="text-2xl font-extrabold">سبد خرید ({entries.length} قلم)</h1>
            <ul className="mt-4 space-y-3">
              {entries.map(([key, e]) => (
                <li key={key} className="rise flex flex-wrap items-center gap-4 rounded-xl border border-saffron/20 bg-parchment p-4 shadow-sm">
                  <div className="flex h-16 w-12 items-center justify-center rounded bg-linear-to-br from-paper to-saffron/15 text-xs text-ink-soft">جلد</div>
                  <div className="min-w-[160px] flex-1">
                    <p className="font-extrabold">{e.title}</p>
                    <p className="text-sm text-ink-soft">{FORMAT_LABEL[e.format]} · {formatToman(e.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setQty(key, e.qty - 1)} aria-label="کاهش" className="h-9 w-9 rounded-lg bg-paper font-extrabold hover:bg-saffron/20">−</button>
                    <span className="w-8 text-center font-bold" aria-live="polite">{e.qty}</span>
                    <button type="button" onClick={() => setQty(key, e.qty + 1)} aria-label="افزایش" className="h-9 w-9 rounded-lg bg-paper font-extrabold hover:bg-saffron/20">+</button>
                  </div>
                  <span className="font-extrabold text-saffron-deep">{formatToman(e.price * e.qty)}</span>
                  <button type="button" onClick={() => setQty(key, 0)} className="rounded-lg px-3 py-1 text-sm font-bold text-danger hover:bg-danger/10">حذف</button>
                </li>
              ))}
            </ul>
          </section>

          <aside className="h-fit rounded-2xl border border-saffron/20 bg-parchment p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-lg font-extrabold">خلاصهٔ سفارش</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-soft">جمع اقلام</dt><dd>{formatToman(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">ارسال پستی</dt><dd>{shipping ? formatToman(shipping) : "رایگان"}</dd></div>
              <div className="flex justify-between border-t border-saffron/20 pt-2 text-base font-extrabold"><dt>مبلغ کل</dt><dd className="text-saffron-deep">{formatToman(total)}</dd></div>
            </dl>

            {step === "cart" && (
              <button type="button" onClick={() => setStep("checkout")} className="mt-6 w-full rounded-xl bg-saffron px-6 py-3 font-extrabold text-white hover:bg-saffron-deep">
                ادامهٔ خرید و تسویه
              </button>
            )}

            {(step === "checkout" || step === "paying") && (
              <form onSubmit={submit} className="mt-6 space-y-3" noValidate>
                <label className="block">
                  <span className="text-sm font-bold">نام و نام خانوادگی</span>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`mt-1 w-full rounded-lg border bg-paper px-3 py-2 focus:outline-none focus:ring-2 focus:ring-saffron/25 ${errors.name ? "border-danger" : "border-saffron/25"}`} />
                  {errors.name && <span className="text-xs text-danger">{errors.name}</span>}
                </label>
                <label className="block">
                  <span className="text-sm font-bold">موبایل</span>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" placeholder="09xxxxxxxxx" className={`mt-1 w-full rounded-lg border bg-paper px-3 py-2 focus:outline-none focus:ring-2 focus:ring-saffron/25 ${errors.phone ? "border-danger" : "border-saffron/25"}`} />
                  {errors.phone && <span className="text-xs text-danger">{errors.phone}</span>}
                </label>
                {hasPrint && (
                  <label className="block">
                    <span className="text-sm font-bold">نشانی پستی</span>
                    <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} className={`mt-1 w-full rounded-lg border bg-paper px-3 py-2 focus:outline-none focus:ring-2 focus:ring-saffron/25 ${errors.address ? "border-danger" : "border-saffron/25"}`} />
                    {errors.address && <span className="text-xs text-danger">{errors.address}</span>}
                  </label>
                )}
                <button type="submit" disabled={step === "paying"} className="w-full rounded-xl bg-success px-6 py-3 font-extrabold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70">
                  {step === "paying" ? "در حال پرداخت آزمایشی…" : `پرداخت آزمایشی ${formatToman(total)}`}
                </button>
                <button type="button" onClick={() => setStep("cart")} className="w-full rounded-xl px-6 py-2 text-sm font-bold text-ink-soft hover:bg-saffron/10">بازگشت به سبد</button>
              </form>
            )}
            <p className="mt-4 text-xs text-ink-soft">تسویه فعلاً آزمایشی و سمت‌کلاینت است؛ پرداخت واقعی با بک‌اند در هفتهٔ ۳.</p>
          </aside>
        </div>
      )}

      {removed && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-ink px-4 py-3 text-parchment shadow-xl">
          <span className="text-sm">«{removed.entry.title}» حذف شد.</span>
          <button type="button" onClick={undo} className="rounded-lg bg-saffron px-3 py-1 text-sm font-extrabold text-white hover:bg-saffron-deep">بازگردانی</button>
        </div>
      )}
    </main>
  );
}