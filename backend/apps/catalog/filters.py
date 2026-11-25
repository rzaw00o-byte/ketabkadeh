"""فیلتر، جستجو و مرتب‌سازی فهرست کتاب‌ها (همه از راه query string)."""

from django.db.models import F, Min, Q
from rest_framework.exceptions import ValidationError

from .models import Category, Edition

ORDERINGS = {
    "price": F("price_from").asc(nulls_last=True),
    "-price": F("price_from").desc(nulls_last=True),
    "-published_year": F("published_year").desc(nulls_last=True),
    "-created_at": F("created_at").desc(),
}
DEFAULT_ORDERING = "-created_at"


def _non_negative_int(params, name):
    raw = params.get(name)
    if raw in (None, ""):
        return None
    try:
        value = int(raw)
    except ValueError:
        value = -1
    if value < 0:
        raise ValidationError({name: ["یک عدد صحیح نامنفی وارد کنید."]})
    return value


def category_and_descendant_ids(category):
    """شناسه‌ی دسته و همه‌ی زیرمجموعه‌هایش (درخت کوچک است؛ سطح‌به‌سطح پیمایش می‌شود)."""
    ids, frontier = {category.pk}, [category.pk]
    while frontier:
        frontier = list(
            Category.objects.filter(parent_id__in=frontier).values_list("pk", flat=True)
        )
        ids.update(frontier)
    return ids


def filter_books(queryset, params):
    # شرط‌های مربوط به «نسخه» در یک filter() می‌آیند تا همه روی یک نسخه‌ی واحد اعمال شوند.
    edition_cond = Q()

    fmt = params.get("format")
    if fmt:
        if fmt not in Edition.Format.values:
            raise ValidationError({"format": ["مقدار مجاز: print یا ebook."]})
        edition_cond &= Q(editions__format=fmt)

    min_price = _non_negative_int(params, "min_price")
    max_price = _non_negative_int(params, "max_price")
    if min_price is not None:
        edition_cond &= Q(editions__price__gte=min_price)
    if max_price is not None:
        edition_cond &= Q(editions__price__lte=max_price)

    if params.get("in_stock") in ("1", "true", "True"):
        edition_cond &= Q(editions__format=Edition.Format.PRINT, editions__stock__gt=0) | Q(
            editions__format=Edition.Format.EBOOK, editions__file_key__gt=""
        )
    if edition_cond:
        queryset = queryset.filter(edition_cond)

    if q := params.get("q", "").strip():
        queryset = queryset.filter(
            Q(title__icontains=q) | Q(book_authors__author__name__icontains=q)
        )
    if slug := params.get("category"):
        category = Category.objects.filter(slug=slug).first()
        queryset = (
            queryset.filter(category_id__in=category_and_descendant_ids(category))
            if category
            else queryset.none()
        )
    if slug := params.get("author"):
        queryset = queryset.filter(book_authors__author__slug=slug)
    if slug := params.get("publisher"):
        queryset = queryset.filter(publisher__slug=slug)

    ordering = params.get("ordering") or DEFAULT_ORDERING
    if ordering not in ORDERINGS:
        raise ValidationError({"ordering": [f"مقدار مجاز: {', '.join(ORDERINGS)}"]})

    # Min روی نسخه‌های هم‌خوان با فیلتر است و GROUP BY از تکرار ردیف‌ها جلوگیری می‌کند.
    return queryset.annotate(price_from=Min("editions__price")).order_by(ORDERINGS[ordering], "-id")
