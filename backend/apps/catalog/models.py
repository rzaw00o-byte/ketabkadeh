from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from .utils import generate_unique_slug


class SlugModel(models.Model):
    """پایه‌ی مدل‌هایی که اسلاگ خوانا دارند؛ اگر اسلاگ خالی باشد خودکار ساخته می‌شود."""

    slug = models.SlugField(
        "اسلاگ",
        max_length=200,
        unique=True,
        allow_unicode=True,
        blank=True,
        help_text="بخش خوانای نشانی. اگر خالی بگذارید از عنوان ساخته می‌شود.",
    )
    SLUG_SOURCE = "name"

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(self, getattr(self, self.SLUG_SOURCE))
        super().save(*args, **kwargs)


class Author(SlugModel):
    PATH_PREFIX = "author"

    name = models.CharField("نام", max_length=200)
    bio = models.TextField("زندگی‌نامه", blank=True)
    photo = models.ImageField("عکس", upload_to="authors/%Y/%m", blank=True)

    class Meta:
        verbose_name = "نویسنده"
        verbose_name_plural = "نویسندگان"
        ordering = ("name",)

    def __str__(self):
        return self.name


class Publisher(SlugModel):
    name = models.CharField("نام", max_length=200)

    class Meta:
        verbose_name = "ناشر"
        verbose_name_plural = "ناشران"
        ordering = ("name",)

    def __str__(self):
        return self.name


class Category(SlugModel):
    name = models.CharField("نام", max_length=200)
    parent = models.ForeignKey(
        "self",
        verbose_name="دسته‌ی والد",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="children",
    )

    class Meta:
        verbose_name = "دسته‌بندی"
        verbose_name_plural = "دسته‌بندی‌ها"
        ordering = ("name",)

    def __str__(self):
        return " › ".join(c.name for c in self.ancestors(include_self=True))

    def ancestors(self, include_self=False):
        """از ریشه تا همین دسته (برای breadcrumb و نشانی)."""
        chain, node = [], self if include_self else self.parent
        while node is not None:
            chain.append(node)
            node = node.parent
        return list(reversed(chain))

    def clean(self):
        node = self.parent
        while node is not None:
            if self.pk and node.pk == self.pk:
                raise ValidationError({"parent": "دسته نمی‌تواند زیرمجموعه‌ی خودش باشد."})
            node = node.parent


class Book(SlugModel):
    PATH_PREFIX = "book"
    SLUG_SOURCE = "title"

    title = models.CharField("عنوان", max_length=300)
    isbn = models.CharField("شابک", max_length=17, unique=True, null=True, blank=True)
    description = models.TextField("توضیحات", blank=True)
    publisher = models.ForeignKey(
        Publisher, verbose_name="ناشر", on_delete=models.PROTECT, related_name="books"
    )
    category = models.ForeignKey(
        Category, verbose_name="دسته‌بندی", on_delete=models.PROTECT, related_name="books"
    )
    authors = models.ManyToManyField(
        Author, through="BookAuthor", verbose_name="نویسندگان", related_name="books"
    )
    pages = models.PositiveIntegerField("تعداد صفحه", null=True, blank=True)
    published_year = models.PositiveSmallIntegerField("سال انتشار (شمسی)", null=True, blank=True)
    cover = models.ImageField(
        "جلد",
        upload_to="covers/%Y/%m",
        blank=True,
        width_field="cover_width",
        height_field="cover_height",
    )
    cover_width = models.PositiveIntegerField(null=True, blank=True, editable=False)
    cover_height = models.PositiveIntegerField(null=True, blank=True, editable=False)
    cover_alt = models.CharField("متن جایگزین جلد", max_length=200, blank=True)

    seo_title = models.CharField(
        "عنوان سئو", max_length=70, blank=True, help_text="خالی = عنوان کتاب. حداکثر ۷۰ نویسه."
    )
    seo_description = models.CharField(
        "توضیح سئو", max_length=200, blank=True, help_text="پیشنهاد: حداکثر ۱۶۰ نویسه."
    )
    is_indexable = models.BooleanField(
        "قابل نمایه شدن", default=True, help_text="اگر خاموش باشد، موتور جستجو نمایه نمی‌کند."
    )
    is_active = models.BooleanField("فعال", default=True)

    created_at = models.DateTimeField("تاریخ ایجاد", auto_now_add=True)
    updated_at = models.DateTimeField("آخرین ویرایش", auto_now=True)

    class Meta:
        verbose_name = "کتاب"
        verbose_name_plural = "کتاب‌ها"
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["is_active", "-created_at"])]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        self.isbn = self.isbn or None  # رشته‌ی خالی نباید با یکتایی تداخل کند
        super().save(*args, **kwargs)


class BookAuthor(models.Model):
    class Role(models.TextChoices):
        AUTHOR = "author", "نویسنده"
        TRANSLATOR = "translator", "مترجم"

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="book_authors")
    author = models.ForeignKey(Author, on_delete=models.PROTECT, related_name="book_roles")
    role = models.CharField("نقش", max_length=20, choices=Role.choices, default=Role.AUTHOR)

    class Meta:
        verbose_name = "نویسنده‌ی کتاب"
        verbose_name_plural = "نویسندگان کتاب"
        ordering = ("id",)
        constraints = [
            models.UniqueConstraint(
                fields=["book", "author", "role"], name="uniq_book_author_role"
            ),
        ]

    def __str__(self):
        return f"{self.author} ({self.get_role_display()})"


class Edition(models.Model):
    """هر کتاب چند نسخه دارد؛ موجودی فقط برای نسخه‌ی چاپی معنا دارد."""

    class Format(models.TextChoices):
        PRINT = "print", "چاپی"
        EBOOK = "ebook", "الکترونیکی"

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="editions")
    format = models.CharField("قالب", max_length=10, choices=Format.choices)
    price = models.PositiveIntegerField("قیمت (تومان)")
    stock = models.PositiveIntegerField("موجودی", null=True, blank=True)
    file_key = models.CharField(
        "کلید فایل در MinIO",
        max_length=500,
        blank=True,
        help_text="فقط برای نسخه‌ی الکترونیکی، مثلاً ebooks/book.epub",
    )

    class Meta:
        verbose_name = "نسخه"
        verbose_name_plural = "نسخه‌ها"
        ordering = ("format",)
        constraints = [
            models.UniqueConstraint(fields=["book", "format"], name="uniq_book_format"),
            models.CheckConstraint(
                condition=Q(format="ebook") | Q(stock__isnull=False),
                name="edition_print_requires_stock",
            ),
            models.CheckConstraint(
                condition=Q(format="print") | Q(stock__isnull=True),
                name="edition_ebook_has_no_stock",
            ),
        ]

    def __str__(self):
        return f"{self.book} — {self.get_format_display()}"

    @property
    def in_stock(self):
        if self.format == self.Format.PRINT:
            return bool(self.stock and self.stock > 0)
        return bool(self.file_key)

    def clean(self):
        if self.format == self.Format.PRINT and self.stock is None:
            raise ValidationError({"stock": "برای نسخه‌ی چاپی، موجودی را وارد کنید."})
        if self.format == self.Format.EBOOK and self.stock is not None:
            raise ValidationError(
                {"stock": "نسخه‌ی الکترونیکی موجودی ندارد؛ این فیلد را خالی بگذارید."}
            )
