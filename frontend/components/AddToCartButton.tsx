"use client";

import { useEffect, useRef, useState } from "react";
import { readCart, writeCart } from "@/lib/cart";

type Props = {
  editionId: number;
  inStock: boolean;
  title: string;
  price: number;
  format: "print" | "ebook";
};

export default function AddToCartButton({ editionId, inStock, title, price, format }: Props) {
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!inStock) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="cursor-not-allowed rounded-lg bg-paper px-4 py-2 text-sm font-bold text-ink-soft/60"
      >
        ناموجود
      </button>
    );
  }

  function add() {
    const cart = readCart();
    const key = String(editionId);
    const prev = cart[key];
    cart[key] = {
      qty: (prev?.qty ?? 0) + 1,
      title,
      price,
      format,
    };
    writeCart(cart);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={add}
      aria-live="polite"
      className={`rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron ${
        added ? "bg-success" : "bg-saffron hover:bg-saffron-deep active:scale-95"
      }`}
    >
      {added ? "✓ اضافه شد" : "افزودن به سبد"}
    </button>
  );
}