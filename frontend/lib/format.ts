// نمایش عدد با رقم فارسی و جداکننده‌ی هزارگان
export function formatNumber(n: number): string {
  return n.toLocaleString("fa-IR");
}

// مبلغ همیشه عدد صحیح و به تومان است (طبق CONTRACT.md)
export function formatToman(price: number): string {
  return `${formatNumber(price)} تومان`;
}
// سال بدون جداکننده‌ی هزارگان (مثلاً ۱۳۱۵ و نه ۱٬۳۱۵)
export function formatYear(year: number): string {
  return year.toLocaleString("fa-IR", { useGrouping: false });
}
