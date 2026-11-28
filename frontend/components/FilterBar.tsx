type Props = {
  action: string;
  values: Record<string, string | undefined>;
  showQuery?: boolean;
};

export default function FilterBar({ action, values, showQuery }: Props) {
  return (
    <form action={action} method="get" className="flex flex-wrap items-end gap-3 rounded-2xl border border-saffron/20 bg-parchment p-4 shadow-sm">
      {showQuery && (
        <label className="min-w-[200px] flex-1">
          <span className="text-sm font-bold text-ink-soft">جستجو</span>
          <input name="q" defaultValue={values.q} placeholder="عنوان یا نویسنده…" className="mt-1 w-full rounded-lg border border-saffron/25 bg-paper px-3 py-2 focus:border-saffron focus:outline-none" />
        </label>
      )}
      <label>
        <span className="text-sm font-bold text-ink-soft">قالب</span>
        <select name="format" defaultValue={values.format ?? ""} className="mt-1 block rounded-lg border border-saffron/25 bg-paper px-3 py-2 focus:border-saffron focus:outline-none">
          <option value="">همه</option>
          <option value="print">چاپی</option>
          <option value="ebook">الکترونیکی</option>
        </select>
      </label>
      <label>
        <span className="text-sm font-bold text-ink-soft">مرتب‌سازی</span>
        <select name="ordering" defaultValue={values.ordering ?? "-created_at"} className="mt-1 block rounded-lg border border-saffron/25 bg-paper px-3 py-2 focus:border-saffron focus:outline-none">
          <option value="-created_at">جدیدترین</option>
          <option value="price">ارزان‌ترین</option>
          <option value="-price">گران‌ترین</option>
          <option value="-published_year">سال انتشار</option>
        </select>
      </label>
      <label>
        <span className="text-sm font-bold text-ink-soft">حداقل قیمت</span>
        <input name="min_price" type="number" min={0} defaultValue={values.min_price} className="mt-1 block w-28 rounded-lg border border-saffron/25 bg-paper px-3 py-2 focus:border-saffron focus:outline-none" />
      </label>
      <label>
        <span className="text-sm font-bold text-ink-soft">حداکثر قیمت</span>
        <input name="max_price" type="number" min={0} defaultValue={values.max_price} className="mt-1 block w-28 rounded-lg border border-saffron/25 bg-paper px-3 py-2 focus:border-saffron focus:outline-none" />
      </label>
      <label className="flex items-center gap-2 pb-2 text-sm font-bold text-ink-soft">
        <input type="checkbox" name="in_stock" value="true" defaultChecked={values.in_stock === "true"} className="h-4 w-4 accent-saffron" />
        فقط موجود
      </label>
      <button type="submit" className="rounded-lg bg-saffron px-5 py-2 font-extrabold text-white hover:bg-saffron-deep">اعمال</button>
      <a href={action} className="rounded-lg px-3 py-2 text-sm font-bold text-lacquer underline hover:text-danger">پاک‌کردن</a>
    </form>
  );
}