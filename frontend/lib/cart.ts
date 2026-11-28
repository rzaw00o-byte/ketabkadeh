export type CartEntry = {
  qty: number;
  title: string;
  price: number;
  format: "print" | "ebook";
};
export type Cart = Record<string, CartEntry>;

// نسخهٔ جدید کلید: دادهٔ کهنهٔ localStorage (که فقط عدد بود) نادیده گرفته می‌شود
export const CART_KEY = "ketabkadeh:guest-cart:v2";
export const CART_EVENT = "ketabkadeh:cart-changed";

function isEntry(v: unknown): v is CartEntry {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.title === "string" &&
    typeof e.price === "number" &&
    Number.isFinite(e.price) &&
    typeof e.qty === "number" &&
    Number.isFinite(e.qty) &&
    e.qty > 0 &&
    (e.format === "print" || e.format === "ebook")
  );
}

export function readCart(): Cart {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Cart = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (isEntry(value)) out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export function writeCart(cart: Cart): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // localStorage در دسترس نبود؛ رویداد را همچنان منتشر کن
  }
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: cart }));
}

export function cartCount(cart: Cart): number {
  return Object.values(cart).reduce((s, e) => s + (Number.isFinite(e.qty) ? e.qty : 0), 0);
}

export function cartTotal(cart: Cart): number {
  return Object.values(cart).reduce(
    (s, e) => s + (Number.isFinite(e.qty) && Number.isFinite(e.price) ? e.qty * e.price : 0),
    0
  );
}