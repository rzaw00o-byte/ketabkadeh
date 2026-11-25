# STATE.md — وضعیت پروژه

آخرین به‌روزرسانی: 2026-11-21

## انجام شده
- [x] نصب ابزارها: Git، Python 3.12.10، Node 24، Docker Desktop
- [x] مخزن خصوصی GitHub ساخته و clone شد؛ اسکلت پوشه‌ها و CONTRACT.md commit شد
- [x] اسکلت Django (تنظیمات چهارمحیطه، PostgreSQL، Redis، Argon2، کاربر سفارشی با موبایل)
- [x] Docker Compose: db، redis، minio، backend، nginx (bucket با اسکریپت `create_bucket.py` ساخته می‌شود)
- [x] ۱۳ تست اولیه (کاربر، موبایل، Argon2، ادمین، health، اسکریپت bucket)
- [x] مدل‌های کاتالوگ (Author، Publisher، Category، Book، BookAuthor، Edition) و `SlugRedirect` در اپ seo، با ادمین و فیلدهای سئو، دستور `seed_catalog` و ۴۰ تست

## تصمیم‌ها
- واحد پول: تومان (عدد صحیح)
- Django 5.2 LTS، PostgreSQL 16، Redis 7
- `?format=` فیلتر کتاب است؛ پسوند فرمت DRF خاموش شد
- ایمیج‌های رسمی MinIO از Docker Hub حذف شده؛ از فورک `pgsty/silo` استفاده می‌شود (باید به استاد گفته شود)
- اسکلت‌ها با ابزارهای رسمی؛ قالب فروشگاهی استفاده نمی‌شود
- تقسیم کار: Claude۱ بک‌اند + Docker/CI، Claude۲ فرانتاند و سئو، ChatGPT تست/مستندات/بازبینی

## مرحله بعد
- [x] `docker compose up --build` موفق بود؛ ۱۳ تست روی PostgreSQL واقعی پاس شد
- [x] ابرکاربر ساخته شد و پنل `/admin/` (فارسی، RTL) کار می‌کند
- [x] API کاتالوگ: `/categories/`، `/books/` (فیلتر و مرتب‌سازی)، `/books/{slug}/`، `/authors/{slug}/`، `/publishers/{slug}/`، `/seo/sitemap/`، `/seo/redirect/`، قالب خطای قرارداد و جلد عمومی؛ ۷۲ تست؛ نمونه‌ی واقعی در `docs/api-samples.json`
- [ ] احراز هویت: ثبت‌نام، ورود، خروج، رفرش (JWT در کوکی httpOnly)
- [ ] سبد خرید، سفارش، پرداخت آزمایشی
- [ ] اپ نظرات (امتیاز واقعی)
- [x] اسکلت Next.js و لایه‌ی `lib/api` (چت فرانتاند)
- [ ] هفته ۲: API احراز هویت (JWT در کوکی httpOnly)، ERD
- [x] CI نوشته شد (`.github/workflows/ci.yml`: ruff + django check + pytest با Postgres و Redis)؛ نتیجه اولین اجرا در تب Actions گیت‌هاب بررسی شود

## یادداشت برای چت‌های دیگر
- هنوز هیچ تغییری در API نسبت به CONTRACT.md نبوده.
- نشانی health: `GET /api/v1/health/`؛ مستند: `/api/v1/docs/`
