"""ساخت داده‌ی آزمایشی کاتالوگ (چند کتاب فارسی). امن برای اجرای چندباره.

توجه: ناشرها، قیمت‌ها و موجودی‌ها ساختگی و فقط برای آزمایش هستند.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalog.models import Author, Book, BookAuthor, Category, Edition, Publisher

CATEGORIES = [
    ("ادبیات", None),
    ("رمان", "ادبیات"),
    ("شعر", "ادبیات"),
    ("داستان کوتاه", "ادبیات"),
]
PUBLISHERS = ["نشر آزمایشی یک", "نشر آزمایشی دو"]
AUTHORS = [
    "صادق هدایت",
    "فروغ فرخزاد",
    "سیمین دانشور",
    "محمود دولت‌آبادی",
    "ارنست همینگوی",
    "نجف دریابندری",
]

# (عنوان، دسته، شماره ناشر، [(نویسنده، نقش)]، صفحه، سال شمسی، توضیح،
#  قیمت چاپی، موجودی چاپی، قیمت الکترونیکی)
BOOKS = [
    (
        "بوف کور",
        "رمان",
        0,
        [("صادق هدایت", "author")],
        130,
        1315,
        "رمان کوتاه و مشهور هدایت؛ روایتی تاریک و رؤیاگونه از تنهایی و ذهنِ راوی.",
        180000,
        25,
        90000,
    ),
    (
        "سه قطره خون",
        "داستان کوتاه",
        0,
        [("صادق هدایت", "author")],
        160,
        1311,
        "مجموعه‌ای از داستان‌های کوتاه صادق هدایت.",
        150000,
        12,
        None,
    ),
    (
        "تولدی دیگر",
        "شعر",
        1,
        [("فروغ فرخزاد", "author")],
        140,
        1343,
        "مجموعه‌ی شعر فروغ فرخزاد.",
        170000,
        30,
        80000,
    ),
    (
        "ایمان بیاوریم به آغاز فصل سرد",
        "شعر",
        1,
        [("فروغ فرخزاد", "author")],
        150,
        1352,
        "آخرین مجموعه‌ی شعر فروغ فرخزاد.",
        175000,
        0,
        85000,
    ),
    (
        "سووشون",
        "رمان",
        1,
        [("سیمین دانشور", "author")],
        300,
        1348,
        "رمانی از سیمین دانشور با فضای شیراز در سال‌های جنگ جهانی دوم.",
        260000,
        0,
        None,
    ),
    (
        "کلیدر",
        "رمان",
        0,
        [("محمود دولت‌آبادی", "author")],
        2800,
        1357,
        "رمان بلند و ده‌جلدیِ محمود دولت‌آبادی.",
        900000,
        5,
        350000,
    ),
    (
        "پیرمرد و دریا",
        "رمان",
        1,
        [("ارنست همینگوی", "author"), ("نجف دریابندری", "translator")],
        120,
        1331,
        "داستان ماهیگیری پیر و نبردش با ماهی بزرگ، نوشته‌ی ارنست همینگوی.",
        140000,
        40,
        70000,
    ),
    (
        "نسخه‌ی فقط الکترونیکی نمونه",
        "رمان",
        1,
        [("صادق هدایت", "author")],
        None,
        None,
        "کتابی آزمایشی که فقط نسخه‌ی الکترونیکی دارد.",
        None,
        None,
        50000,
    ),
]


class Command(BaseCommand):
    help = "ساخت داده‌ی آزمایشی کاتالوگ"

    @transaction.atomic
    def handle(self, *args, **options):
        cats = {}
        for name, parent in CATEGORIES:
            cats[name], _ = Category.objects.get_or_create(
                name=name, defaults={"parent": cats.get(parent)}
            )
        pubs = [Publisher.objects.get_or_create(name=n)[0] for n in PUBLISHERS]
        authors = {n: Author.objects.get_or_create(name=n)[0] for n in AUTHORS}

        for title, cat, pub_i, people, pages, year, desc, p_price, p_stock, e_price in BOOKS:
            book, _ = Book.objects.update_or_create(
                title=title,
                defaults={
                    "category": cats[cat],
                    "publisher": pubs[pub_i],
                    "pages": pages,
                    "published_year": year,
                    "description": desc,
                    "cover_alt": f"جلد کتاب {title}",
                },
            )
            for person, role in people:
                BookAuthor.objects.get_or_create(book=book, author=authors[person], role=role)
            if p_price is not None:
                Edition.objects.update_or_create(
                    book=book,
                    format=Edition.Format.PRINT,
                    defaults={"price": p_price, "stock": p_stock},
                )
            if e_price is not None:
                Edition.objects.update_or_create(
                    book=book,
                    format=Edition.Format.EBOOK,
                    defaults={"price": e_price, "file_key": f"ebooks/sample-{book.pk}.epub"},
                )
        self.stdout.write(self.style.SUCCESS(f"{Book.objects.count()} کتاب در کاتالوگ است."))
