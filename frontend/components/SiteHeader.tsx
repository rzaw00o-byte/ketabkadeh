"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CART_EVENT, cartCount, cartTotal, readCart, writeCart, type Cart } from "@/lib/cart";
import { formatToman } from "@/lib/format";

const FORMAT_LABEL = { print: "چاپی", ebook: "الکترونیکی" } as const;

export default function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [cart, setCart] = useState<Cart>({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setCart(readCart());
    const onChange = (e: Event) => setCart((e as CustomEvent<Cart>).detail ?? readCart());
    window.addEventListener(CART_EVENT, onChange);
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener(CART_EVENT, onChange);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const count = cartCount(cart);
  const entries = Object.entries(cart);

  function setQty(id: string, qty: number) {
    const next = { ...cart };
    if (qty <= 0) delete next[id];
    else next[id] = { ...next[id], qty };
    setCart(next);
    writeCart(next);
  }

  const nav = [
    { href: "/", label: "خانه" },
    { href: "/#catalog", label: "کاوش کتاب‌ها" },
    { href: "/#why", label: "چرا کتابکده" },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b border-saffron/20 bg-parchment/90 backdrop-blur-md transition-shadow ${
          scrolled ? "shadow-md shadow-ink/10" : ""
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-ink">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z" fill="var(--color-saffron)" />
              <path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" fill="var(--color-turquoise)" />
            </svg>
            <span className="text-lg">کتابکده</span>
          </Link>
          <nav aria-label="ناوبری اصلی" className="ms-auto flex items-center gap-1 overflow-x-auto">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={pathname === "/" && n.href === "/" ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                  pathname === "/" && n.href === "/"
                    ? "bg-saffron/10 text-saffron-deep"
                    : "text-ink-soft hover:bg-saffron/10 hover:text-saffron-deep"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`سبد خرید، ${count} قلم`}
            className="relative rounded-lg bg-ink px-3 py-2 text-sm font-bold text-parchment transition-colors hover:bg-saffron-deep"
          >
            سبد
            {count > 0 && (
              <span className="absolute -left-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-lacquer px-1 text-xs font-extrabold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="سبد خرید">
          <button
            type="button"
            aria-label="بستن سبد"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 flex w-full max-w-md flex-col bg-parchment shadow-2xl">
            <div className="flex items-center justify-between border-b border-saffron/20 px-5 py-4">
              <h2 className="text-lg font-extrabold">سبد مهمان</h2>
              <button
                type="button"
                autoFocus
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1 text-sm font-bold text-ink-soft hover:bg-saffron/10"
              >
                بستن ✕
              </button>
            </div>

            {entries.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-ink-soft">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z" fill="var(--color-saffron)" opacity=".35" />
                  <path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" fill="var(--color-turquoise)" opacity=".35" />
                </svg>
                <p>سبد هنوز خالی است.</p>
                <Link href="/#catalog" onClick={() => setOpen(false)} className="font-bold text-saffron-deep underline">
                  کاوش کتاب‌ها
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-3 overflow-y-auto p-5">
                  {entries.map(([id, e]) => (
                    <li key={id} className="rounded-xl border border-saffron/20 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{e.title}</p>
                          <p className="text-sm text-ink-soft">
                            {FORMAT_LABEL[e.format]} · {formatToman(e.price)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setQty(id, 0)}
                          aria-label={`حذف ${e.title}`}
                          className="rounded-lg px-2 py-1 text-sm font-bold text-danger hover:bg-danger/10"
                        >
                          حذف
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQty(id, e.qty - 1)}
                          aria-label="کاهش تعداد"
                          className="h-8 w-8 rounded-lg bg-paper font-extrabold hover:bg-saffron/20"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-bold" aria-live="polite">{e.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(id, e.qty + 1)}
                          aria-label="افزایش تعداد"
                          className="h-8 w-8 rounded-lg bg-paper font-extrabold hover:bg-saffron/20"
                        >
                          +
                        </button>
                        <span className="ms-auto font-bold text-saffron-deep">{formatToman(e.price * e.qty)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-saffron/20 p-5">
                  <div className="flex items-center justify-between font-extrabold">
                    <span>جمع</span>
                    <span className="text-saffron-deep">{formatToman(cartTotal(cart))}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCart({});
                        writeCart({});
                      }}
                      className="rounded-lg px-4 py-2 text-sm font-bold text-danger hover:bg-danger/10"
                    >
                      خالی‌کردن
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="ms-auto rounded-lg bg-saffron px-4 py-2 text-sm font-bold text-white hover:bg-saffron-deep"
                    >
                      ادامهٔ خرید
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-ink-soft">
                    تسویه‌حساب با ورود حساب کاربری و درگاه پرداخت فعال می‌شود.
                  </p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}