export type CartEntry = {
  qty: number;
  title: string;
  price: number;
  format: "print" | "ebook";
};
export type Cart = Record<string, CartEntry>;

export const CART_KEY = "ketabkadeh:guest-cart";
export const CART_EVENT = "ketabkadeh:cart-changed";

export function readCart(): Cart {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as Cart) : {};
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
  return Object.values(cart).reduce((s, e) => s + e.qty, 0);
}

export function cartTotal(cart: Cart): number {
  return Object.values(cart).reduce((s, e) => s + e.qty * e.price, 0);
}