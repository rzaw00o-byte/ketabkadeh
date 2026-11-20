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
- [ ] اجرای `docker compose up --build` و تأیید `http://localhost/api/v1/health/`
- [ ] ساخت ابرکاربر و ورود به `/admin/`
- [ ] اسکلت Next.js (چت فرانتاند)
- [ ] هفته ۲: API احراز هویت (JWT در کوکی httpOnly)، ERD
- [ ] CI (GitHub Actions: ruff + pytest)

## یادداشت برای چت‌های دیگر
- هنوز هیچ تغییری در API نسبت به CONTRACT.md نبوده.
- نشانی health: `GET /api/v1/health/`؛ مستند: `/api/v1/docs/`
