// قالب‌نمایش فارسی؛ همه‌ی کمک‌تابع‌ها null/undefined را می‌پذیرند
// چون API برای فیلدهای اختیاری (pages، published_year، rating.average…) null برمی‌گرداند.
const faGrouped = new Intl.NumberFormat("fa-IR");
const faPlain = new Intl.NumberFormat("fa-IR", { useGrouping: false });

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return faGrouped.format(value);
}

export function formatToman(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${faGrouped.format(value)} تومان`;
}

export function formatYear(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return faPlain.format(value);
}