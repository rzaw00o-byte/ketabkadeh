# STATE.md — وضعیت پروژه

آخرین به‌روزرسانی: 2026-11-21

## انجام شده
- [x] نصب ابزارها: Git، Python 3.12.10، Node 24، Docker Desktop (تست hello-world موفق)
- [x] مخزن خصوصی GitHub (`ketabkadeh`) ساخته و clone شد
- [x] پوشه‌های `docs`، `backend`، `frontend` ساخته شد
- [x] CONTRACT.md نوشته شد (طبق ساختار و مدل داده سند استاد)

## تصمیم‌ها
- واحد پول: تومان (عدد صحیح)
- اسکلت‌ها با ابزارهای رسمی (`django-admin`, `create-next-app`)؛ قالب فروشگاهی استفاده نمی‌شود
- تقسیم کار: Claude۱ بک‌اند + Docker/CI، Claude۲ فرانتاند و سئو، ChatGPT تست/مستندات/بازبینی

## مرحله بعد (هفته ۱ سند)
- [ ] اجرای `py -3.12 make_structure.py` و commit
- [ ] اسکلت Django + Docker Compose (Postgres، Redis، MinIO، Nginx)
- [ ] اسکلت Next.js (TypeScript strict، Tailwind، RTL، فونت وزیرمتن)
- [ ] پروپوزال یک‌صفحه‌ای

## یادداشت برای چت‌های دیگر
- هنوز هیچ تغییری در API نسبت به CONTRACT.md نبوده.
