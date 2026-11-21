# STATE.md — وضعیت پروژه

آخرین به‌روزرسانی: 2026-11-21

## انجام شده
- [x] نصب ابزارها: Git، Python 3.12.10، Node 24، Docker Desktop
- [x] مخزن خصوصی GitHub ساخته و clone شد؛ اسکلت پوشه‌ها و CONTRACT.md commit شد
- [x] اسکلت Django (تنظیمات چهارمحیطه، PostgreSQL، Redis، Argon2، کاربر سفارشی با موبایل)
- [x] Docker Compose: db، redis، minio، backend، nginx (bucket با اسکریپت `create_bucket.py` ساخته می‌شود)
- [x] ۱۳ تست اولیه (کاربر، موبایل، Argon2، ادمین، health، اسکریپت bucket)

## تصمیم‌ها
- واحد پول: تومان (عدد صحیح)
- Django 5.2 LTS، PostgreSQL 16، Redis 7
- ایمیج‌های رسمی MinIO از Docker Hub حذف شده؛ از فورک `pgsty/silo` استفاده می‌شود (باید به استاد گفته شود)
- اسکلت‌ها با ابزارهای رسمی؛ قالب فروشگاهی استفاده نمی‌شود
- تقسیم کار: Claude۱ بک‌اند + Docker/CI، Claude۲ فرانتاند و سئو، ChatGPT تست/مستندات/بازبینی

## مرحله بعد
- [x] `docker compose up --build` موفق بود؛ ۱۳ تست روی PostgreSQL واقعی پاس شد
- [x] ابرکاربر ساخته شد و پنل `/admin/` (فارسی، RTL) کار می‌کند
- [ ] اسکلت Next.js (چت فرانتاند)
- [ ] هفته ۲: API احراز هویت (JWT در کوکی httpOnly)، ERD
- [x] CI نوشته شد (`.github/workflows/ci.yml`: ruff + django check + pytest با Postgres و Redis)؛ نتیجه اولین اجرا در تب Actions گیت‌هاب بررسی شود

## یادداشت برای چت‌های دیگر
- هنوز هیچ تغییری در API نسبت به CONTRACT.md نبوده.
- نشانی health: `GET /api/v1/health/`؛ مستند: `/api/v1/docs/`
