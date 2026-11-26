export type OrderItem = {
  editionId: string;
  title: string;
  format: "print" | "ebook";
  unitPrice: number;
  qty: number;
};

export type LocalOrder = {
  code: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  contact: { name: string; phone: string; address: string };
};

const ORDERS_KEY = "ketabkadeh:orders:v1";

export function makeCode(): string {
  return `KB-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export function saveOrder(order: LocalOrder): void {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    const list = raw ? (JSON.parse(raw) as LocalOrder[]) : [];
    list.unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(list.slice(0, 20)));
  } catch {
    // localStorage در دسترس نبود؛ سفارش در حافظهٔ همین صفحه می‌ماند
  }
}

export function readOrders(): LocalOrder[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as LocalOrder[]) : [];
  } catch {
    return [];
  }
}