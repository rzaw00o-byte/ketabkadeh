# CONTRACT.md — قرارداد پروژه «کتابکده»

> مرجع واحد برای همه چت‌ها و ابزارها. ساختار و مدل داده دقیقاً طبق سند استاد (بخش ۶ و ۷) است.
> هر تغییری اول اینجا اعمال می‌شود، بعد در کد. دلیل هر انحراف از سند استاد در بخش ۹ ثبت می‌شود.

## ۱. اصول ثابت
- معماری Headless: جنگو فقط API و پنل ادمین؛ Next.js فقط از طریق API با جنگو حرف می‌زند.
- Python 3.12+، Django LTS، DRF، PostgreSQL (SQLite ممنوع حتی در توسعه)، Redis، ذخیره‌ساز سازگار با S3 (MinIO؛ ایمیج: `pgsty/silo`، بخش ۹)، Nginx، Docker Compose.
- فرانتاند: Next.js App Router + TypeScript (strict) + Tailwind.
- احراز هویت: مدل کاربر سفارشی (شناسه = موبایل ایرانی)، SimpleJWT در کوکی httpOnly، هش Argon2.
- مبلغ‌ها همیشه **عدد صحیح** (واحد: تومان). هرگز اعشاری.
- تاریخ در دیتابیس میلادی و UTC؛ تبدیل به شمسی فقط در نمایش.
- هیچ رمز و کلیدی در مخزن نباشد؛ فقط `example.env`.
- اجرای کل سیستم با `docker compose up`.

## ۲. ساختار مخزن (طبق سند استاد)
```
ketabkadeh/
├── backend/
│   ├── config/settings/{base,development,staging,production}.py
│   ├── apps/
│   │   ├── accounts/  catalog/  reviews/
│   │   ├── cart/      orders/   payments/
│   │   └── seo/       # sitemap data, redirects, meta fields
│   └── tests/
├── frontend/
│   ├── app/
│   │   ├── (shop)/page.tsx
│   │   ├── (shop)/book/[slug]/page.tsx
│   │   ├── (shop)/author/[slug]/page.tsx
│   │   ├── (shop)/category/[...slug]/page.tsx
│   │   ├── (account)/cart/page.tsx
│   │   ├── sitemap.ts   robots.ts   not-found.tsx
│   ├── components/   lib/api/   lib/seo/
├── nginx/   docker-compose.yml   .github/workflows/ci.yml
├── docs/    (CONTRACT.md, STATE.md, openapi.yaml, AI_LOG.md)
└── README.md
```

## ۳. مدل داده (طبق سند استاد)
```
Author(id, name, slug, bio, photo)
Publisher(id, name, slug)
Category(id, name, slug, parent → Category)
Book(id, title, slug, isbn, description, publisher → Publisher,
     category → Category, pages, published_year, cover,
     seo_title, seo_description, is_indexable, is_active)
BookAuthor(book → Book, author → Author, role)      # author / translator
Edition(id, book → Book, format[print|ebook], price, stock, file_key)
SlugRedirect(old_path, new_path)
Review(id, book → Book, user → User, rating[1..5], body, is_approved)
Cart(id, user → User) · CartItem(cart, edition, quantity)
Order(id, user, status, total, address, created_at)
OrderItem(order, edition, quantity, unit_price)     # قیمت لحظه خرید
Payment(id, order, gateway, authority, ref_id, status, amount)
DownloadGrant(id, user, edition, order_item, expires_at)
```
قیدها:
- هر کتاب چند «نسخه» (چاپی/الکترونیکی) با قیمت جدا دارد؛ موجودی (`stock`) فقط برای چاپی معنا دارد.
- هر کاربر برای هر کتاب فقط یک نظر (یکتایی `(book, user)`).
- `OrderItem.unit_price` در لحظه ثبت سفارش کپی می‌شود.

## ۴. قرارداد API
پیشوند: `/api/v1/` — فرمت: JSON — صفحه‌بندی: `{count, next, previous, results}`.

### احراز هویت (توکن‌ها در کوکی httpOnly؛ بدنه پاسخ توکن ندارد)
| متد | مسیر | بدنه / توضیح |
|---|---|---|
| POST | `/auth/register/` | `{phone, password, first_name?, last_name?}` |
| POST | `/auth/login/` | `{phone, password}` ← کوکی access/refresh |
| POST | `/auth/logout/` | پاک‌کردن کوکی‌ها |
| POST | `/auth/refresh/` | تازه‌سازی access با کوکی refresh |
| GET/PATCH | `/auth/me/` | پروفایل |

### کاتالوگ (عمومی)
| متد | مسیر | توضیح |
|---|---|---|
| GET | `/categories/` | درخت دسته‌ها |
| GET | `/categories/{slug}/` | جزئیات دسته + مسیر breadcrumb |
| GET | `/books/` | فیلتر/مرتب‌سازی/صفحه‌بندی (پایین) |
| GET | `/books/{slug}/` | جزئیات کتاب (نمونه پایین) |
| GET | `/authors/{slug}/` | نویسنده + کتاب‌هایش |
| GET | `/publishers/{slug}/` | ناشر |
| GET/POST | `/books/{slug}/reviews/` | POST فقط با ورود |

پارامترهای `/books/`: `q`, `category`, `author`, `publisher`, `format`, `min_price`, `max_price`, `in_stock`, `ordering` (`price`, `-price`, `-published_year`, `-created_at`), `page`.

نمونه `GET /books/{slug}/`:
```json
{
  "id": 1, "title": "...", "slug": "...", "isbn": "...",
  "description": "...", "pages": 320, "published_year": 1400,
  "cover": {"url": "https://...", "alt": "...", "width": 600, "height": 900},
  "authors": [{"name": "...", "slug": "...", "role": "author"}],
  "publisher": {"name": "...", "slug": "..."},
  "category": {"name": "...", "slug": "...", "breadcrumb": [{"name": "...", "slug": "..."}]},
  "editions": [{"id": 10, "format": "print", "price": 250000, "stock": 5, "in_stock": true},
               {"id": 11, "format": "ebook", "price": 120000, "in_stock": true}],
  "rating": {"average": 4.5, "count": 12},
  "seo": {"title": "...", "description": "...", "is_indexable": true, "canonical_path": "/book/slug"},
  "updated_at": "2026-01-01T00:00:00Z"
}
```

### سبد، سفارش، پرداخت (نیازمند ورود)
| متد | مسیر | بدنه / توضیح |
|---|---|---|
| GET | `/cart/` | سبد جاری |
| POST | `/cart/items/` | `{edition_id, quantity}` |
| PATCH/DELETE | `/cart/items/{id}/` | تغییر تعداد / حذف |
| POST | `/orders/` | `{address}` ← ساخت سفارش از سبد |
| GET | `/orders/`، `/orders/{id}/` | سفارش‌های کاربر |
| POST | `/payments/start/` | `{order_id}` ← `{authority, redirect_url}` |
| GET | `/payments/verify/` | `?Authority=&Status=` ← وضعیت نهایی پرداخت |
| GET | `/downloads/{grant_id}/link/` | لینک Presigned موقت MinIO |

### سئو (عمومی)
| متد | مسیر | توضیح |
|---|---|---|
| GET | `/seo/sitemap/` | `[{path, lastmod, kind}]` برای کتاب، نویسنده، دسته؛ فقط `is_indexable` و `is_active` |
| GET | `/seo/redirect/?path=/book/old` | `{new_path}` یا 404 (فرانتاند با 301 هدایت می‌کند) |

### قالب خطا (همه endpointها)
```json
{"error": {"code": "validation_error", "message": "...", "fields": {"phone": ["..."]}}}
```
کدهای وضعیت: 400 اعتبارسنجی، 401 بدون ورود، 403 بدون مجوز، 404 یافت نشد، 409 تعارض (مثلاً موجودی)، 429 محدودیت نرخ.

## ۴-ب. جزئیات پیاده‌شده‌ی API کاتالوگ (مرجع برای فرانتاند)
نمونه‌ی خروجی واقعی همه‌ی موارد زیر در `docs/api-samples.json` است؛ مستند تعاملی روی `/api/v1/docs/` و شمای OpenAPI روی `/api/v1/schema/`.

- **فقط JSON**، کتاب‌های `is_active=False` در API دیده نمی‌شوند (۴۰۴).
- **اسلاگ‌ها فارسی‌اند** (مثل `بوف-کور`)؛ در نشانی باید percent-encode شوند و فرانتاند باید `params.slug` را decode کند.
- **قالب خطا** در همه‌ی endpointها: `{"error": {"code", "message", "fields"}}` با کدهای `validation_error`، `not_found`، ...؛ برای ۴۰۴ در `/books/{slug}/` فرانتاند `notFound()` صدا می‌زند.
- **صفحه‌بندی:** `page`، `page_size` (پیش‌فرض ۱۲، حداکثر ۴۸). صفحه‌ی خارج از محدوده ← ۴۰۴.
- **آیتم فهرست `/books/`:** `{id, title, slug, cover, authors[{name,slug,role}], price_from, in_stock, formats[]}`؛ `price_from` ارزان‌ترین نسخه (تومان).
- **فیلترهای `/books/`:** `q` (عنوان یا نام نویسنده)، `category` (اسلاگ تکی؛ زیرمجموعه‌ها هم شامل می‌شوند)، `author`، `publisher`، `format` (`print`|`ebook`)، `min_price`، `max_price`، `in_stock=true`، `ordering` (`price`، `-price`، `-published_year`، `-created_at`). مقدار نامعتبر ← ۴۰۰.
  - شرط‌های `format` و `min_price` و `max_price` و `in_stock` روی **یک نسخه‌ی واحد** اعمال می‌شوند.
  - `in_stock`: چاپی با `stock > 0` یا الکترونیکی با فایل آپلودشده.
- **جلد (`cover`):** `null` اگر جلد نباشد؛ وگرنه `{url, alt, width, height}`. `url` **کامل، عمومی و بدون امضا** است (مثل `http://localhost:9000/ketabkadeh/covers/...`)، پس برای `og:image` و کش مناسب است. فقط پیشوندهای `covers/` و `authors/` عمومی‌اند؛ `ebooks/` خصوصی است.
- **`/categories/`**: درخت `[{name, slug, path, children[...]}]`؛ **`/categories/{slug}/`**: `{name, slug, path, breadcrumb[{name,slug,path}], children[{name,slug,path}]}`. `slug` یک اسلاگ تکی و یکتاست و `path` مسیر کامل صفحه‌ی فرانتاند (`/category/ادبیات/رمان`). `breadcrumb` از ریشه تا **خود دسته** است. همین ساختار در `category` جزئیات کتاب هم هست.
- **`seo` در جزئیات کتاب:** `title` = `seo_title` یا عنوان کتاب؛ `description` = `seo_description` یا ۱۶۰ نویسه‌ی اول توضیحات؛ `canonical_path` = `/book/{slug}`. قالب «... | کتابکده» را فرانتاند می‌افزاید.
- **`rating`:** تا ساخته شدن اپ نظرات همیشه `{"average": null, "count": 0}`.
- **`/authors/{slug}/`:** `{name, slug, bio, photo(url|null), books[آیتم فهرست], seo}`؛ **`/publishers/{slug}/`:** `{name, slug, books[]}`.
- **`/seo/sitemap/`:** فهرست ساده `[{path, lastmod, kind}]` با `kind` برابر `book|author|category`؛ فقط کتاب فعالِ `is_indexable`، نویسنده‌های دارای چنین کتابی و دسته‌های دارای کتاب (با والدها). `lastmod` فقط برای کتاب مقدار دارد.
- **`/seo/redirect/?path=/book/قدیمی`:** `{"new_path": "/book/جدید"}` یا ۴۰۴. فرانتاند باید با **۳۰۱** هدایت کند (`redirect()` در Next.js کد ۳۰۷ می‌دهد).
- پارامتر `?format=` برای فیلتر کتاب استفاده می‌شود؛ بنابراین پسوند فرمت DRF غیرفعال است.

## ۵. راهبرد رندر (نمونه سند استاد؛ در گزارش و README توجیه شود)
| صفحه | روش | دلیل |
|---|---|---|
| صفحه اصلی | ISR | محتوا گاهی تغییر می‌کند ولی سرعت مهم است |
| صفحه کتاب | ISR (یا SSG) | مهم‌ترین صفحه سئو؛ با تغییر قیمت باید تازه شود |
| صفحه نویسنده | ISR | کم‌تغییر، قابل نمایه |
| فهرست دسته و جستجو | SSR | وابسته به فیلتر و query string |
| سبد و حساب کاربری | CSR | شخصی است و نباید نمایه شود |

## ۶. متغیرهای محیطی (`example.env`، بدون مقدار واقعی)
```
DJANGO_SETTINGS_MODULE=config.settings.development
SECRET_KEY=change-me
ALLOWED_HOSTS=localhost,127.0.0.1
POSTGRES_DB=ketabkadeh  POSTGRES_USER=...  POSTGRES_PASSWORD=...  POSTGRES_HOST=db  POSTGRES_PORT=5432
REDIS_URL=redis://redis:6379/0
MINIO_ENDPOINT=minio:9000  MINIO_PUBLIC_URL=http://localhost:9000
MINIO_ACCESS_KEY=...  MINIO_SECRET_KEY=...  MINIO_BUCKET=ketabkadeh
JWT_ACCESS_MINUTES=15  JWT_REFRESH_DAYS=7
NEXT_PUBLIC_SITE_URL=http://localhost
API_INTERNAL_URL=http://backend:8000/api/v1
```

## ۷. پورت‌ها و مسیریابی Nginx
| سرویس | پورت |
|---|---|
| nginx | 80 (ورودی اصلی) |
| frontend (Next.js) | 3000 (داخلی) |
| backend (Django/gunicorn) | 8000 (داخلی) |
| postgres / redis | 5432 / 6379 (داخلی) |
| minio (pgsty/silo) API / console | 9000 / 9001 |

`/` ← frontend · `/api/` و `/admin/` ← backend.

## ۸. قوانین کار
1. هر پوشه یک مالک: `backend/` فقط چت بک‌اند، `frontend/` فقط چت فرانتاند.
2. تغییر API: اول این فایل، بعد هر دو طرف.
3. هر مرحله با commit کوچک و پیام روشن (`feat:`, `fix:`, `docs:`, `test:`).
4. استفاده از AI و کتابخانه‌ها در `docs/AI_LOG.md` و README ثبت شود.

## ۹. انحراف از سند استاد (باید در README هم بیاید)
| تغییر | دلیل |
|---|---|
| افزودن `Book.cover_alt` و `Book.updated_at` | الزام «متن جایگزین تصویر» در پنل و `lastmod` در sitemap |
| افزودن `created_at` به `Book` | مرتب‌سازی «جدیدترین» |
| ایمیج MinIO: `pgsty/silo` (فورک جامعه‌ی MinIO) به‌جای `minio/minio` | در سپتامبر ۲۰۲۶ شرکت MinIO ایمیج‌های رسمی را از Docker Hub حذف کرد (`pull access denied`). فورک با همان API سازگار با S3 و همان متغیرهای `MINIO_*` است. **باید به استاد اطلاع داده شود.** |
| ساخت bucket با اسکریپت `backend/scripts/create_bucket.py` (boto3) به‌جای ایمیج `minio/mc` | ایمیج `minio/mc` هم حذف شده است |
| `Book`: افزودن `cover_alt`، `cover_width`، `cover_height` (طول و عرض برای جلوگیری از CLS)، `created_at`، `updated_at`؛ `slug` با نویسه‌ی فارسی (`allow_unicode`) و خودکار از عنوان | الزام‌های سئو و کارایی |
| `Book.published_year` = **سال شمسی** انتشار (عدد صحیح) | کتاب‌های ایرانی سال شمسی دارند؛ تاریخ واقعی (UTC) نیست |
| `SlugRedirect` در اپ `seo` (طبق ساختار استاد)؛ ثبت خودکار با سیگنال هنگام تغییر اسلاگ `Book` و `Author`، بدون زنجیره و بدون حلقه | الزام هدایت ۳۰۱؛ تغییر اسلاگ دسته‌بندی هنوز هدایت نمی‌سازد |
| اسلاگ `Category` در کل سیستم یکتاست و درخت با `parent` ساخته می‌شود (بدون `django-mptt`) | ساده‌تر و قابل‌توضیح در دفاع؛ عمق دسته‌ها کم است |
| قیدهای `Edition`: هر `(book, format)` یکتا؛ چاپی حتماً `stock` دارد؛ الکترونیکی `stock` ندارد (قید در پایگاه داده) | اجرای قاعده‌ی «موجودی فقط برای نسخه‌ی چاپی معنا دارد» |
| `Edition.in_stock`: چاپی ⇐ `stock > 0`؛ الکترونیکی ⇐ `file_key` پر باشد | کتاب ناموجود صفحه می‌ماند و فقط دکمه‌ی خرید غیرفعال می‌شود |
| جلد و عکس‌ها با لینک عمومی بدون امضا و سیاست bucket فقط برای `covers/*` و `authors/*` | لینک امضادار منقضی می‌شود و برای `og:image` و کش مناسب نیست؛ فایل‌های الکترونیکی خصوصی می‌مانند |
