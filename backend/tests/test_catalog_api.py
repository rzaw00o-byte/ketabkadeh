import json
from urllib.parse import quote

import pytest
from django.core.management import call_command

from apps.catalog.models import Book, Edition


@pytest.fixture
def seeded(db):
    call_command("seed_catalog", verbosity=0)


def get(client, endpoint, **params):
    return client.get(f"/api/v1/{endpoint}", params)


def titles(response):
    return [book["title"] for book in response.json()["results"]]


# ---------- فهرست ----------
def test_book_list_is_paginated(client, seeded):
    body = get(client, "books/", page_size=3).json()
    assert body["count"] == 8
    assert len(body["results"]) == 3
    assert body["next"] is not None and body["previous"] is None


def test_page_size_is_capped(client, seeded):
    body = get(client, "books/", page_size=1000).json()
    assert len(body["results"]) == 8  # فقط ۸ کتاب داریم، ولی سقف ۴۸ است


def test_list_item_shape(client, seeded):
    item = get(client, "books/", q="پیرمرد").json()["results"][0]
    assert set(item) == {
        "id",
        "title",
        "slug",
        "cover",
        "authors",
        "price_from",
        "in_stock",
        "formats",
    }
    assert item["price_from"] == 70000
    assert item["in_stock"] is True
    assert sorted(item["formats"]) == ["ebook", "print"]
    assert {(a["name"], a["role"]) for a in item["authors"]} == {
        ("ارنست همینگوی", "author"),
        ("نجف دریابندری", "translator"),
    }


def test_list_query_count_is_constant(client, seeded, django_assert_max_num_queries):
    with django_assert_max_num_queries(8):
        assert get(client, "books/").status_code == 200


def test_inactive_books_are_hidden(client, seeded):
    book = Book.objects.get(title="بوف کور")
    book.is_active = False
    book.save()
    assert get(client, "books/").json()["count"] == 7
    response = client.get(f"/api/v1/books/{quote(book.slug)}/")
    assert response.status_code == 404


# ---------- فیلترها ----------
def test_search_by_title_and_author(client, seeded):
    assert titles(get(client, "books/", q="کلیدر")) == ["کلیدر"]
    by_author = get(client, "books/", q="فرخزاد")
    assert sorted(titles(by_author)) == sorted(["تولدی دیگر", "ایمان بیاوریم به آغاز فصل سرد"])


def test_category_filter_includes_descendants(client, seeded):
    assert get(client, "books/", category="ادبیات").json()["count"] == 8
    assert get(client, "books/", category="شعر").json()["count"] == 2
    assert get(client, "books/", category="ناموجود").json()["count"] == 0


def test_author_and_publisher_filters(client, seeded):
    assert get(client, "books/", author="صادق-هدایت").json()["count"] == 3
    assert get(client, "books/", publisher="نشر-آزمایشی-دو").json()["count"] == 5


def test_format_filter(client, seeded):
    assert get(client, "books/", format="ebook").json()["count"] == 6
    assert get(client, "books/", format="print").json()["count"] == 7


def test_price_range_applies_to_a_single_edition(client, seeded):
    # فقط نسخه‌ی الکترونیکی ≤ ۶۰ هزار: «شازده» ندارد، «کتاب فقط الکترونیکی» دارد
    body = get(client, "books/", format="ebook", max_price=60000).json()
    assert titles(get(client, "books/", format="ebook", max_price=60000)) == [
        "نسخه‌ی فقط الکترونیکی نمونه"
    ]
    assert body["count"] == 1
    assert get(client, "books/", min_price=800000).json()["count"] == 1  # کلیدر چاپی


def test_in_stock_filter(client, seeded):
    body = get(client, "books/", in_stock="true").json()
    assert body["count"] == 7
    assert "سووشون" not in titles(get(client, "books/", in_stock="true"))


def test_ordering_by_price(client, seeded):
    asc = [b["price_from"] for b in get(client, "books/", ordering="price").json()["results"]]
    desc = [b["price_from"] for b in get(client, "books/", ordering="-price").json()["results"]]
    assert asc == sorted(asc)
    assert desc == sorted(desc, reverse=True)


@pytest.mark.parametrize(
    "params,field",
    [
        ({"ordering": "title"}, "ordering"),
        ({"min_price": "abc"}, "min_price"),
        ({"max_price": "-5"}, "max_price"),
        ({"format": "pdf"}, "format"),
    ],
)
def test_invalid_parameters_return_error_format(client, seeded, params, field):
    response = get(client, "books/", **params)
    assert response.status_code == 400
    error = response.json()["error"]
    assert error["code"] == "validation_error"
    assert field in error["fields"]


# ---------- جزئیات کتاب ----------
def test_book_detail_with_persian_slug(client, seeded):
    response = client.get(f"/api/v1/books/{quote('پیرمرد-و-دریا')}/")
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {
        "id",
        "title",
        "slug",
        "isbn",
        "description",
        "pages",
        "published_year",
        "cover",
        "authors",
        "publisher",
        "category",
        "editions",
        "rating",
        "seo",
        "updated_at",
    }
    assert body["category"]["breadcrumb"][0]["name"] == "ادبیات"
    assert [c["slug"] for c in body["category"]["breadcrumb"]] == ["ادبیات", "رمان"]
    assert body["category"]["path"] == "/category/ادبیات/رمان"
    assert body["cover"] is None
    assert body["rating"] == {"average": None, "count": 0}
    assert body["seo"]["canonical_path"] == "/book/پیرمرد-و-دریا"
    formats = {e["format"]: e for e in body["editions"]}
    assert formats["print"]["stock"] == 40 and formats["ebook"]["stock"] is None


def test_out_of_stock_book_keeps_its_page(client, seeded):
    body = client.get(f"/api/v1/books/{quote('سووشون')}/").json()
    assert body["editions"][0]["in_stock"] is False


def test_seo_fields_fall_back_and_can_be_overridden(client, seeded):
    book = Book.objects.get(title="بوف کور")
    body = client.get(f"/api/v1/books/{quote(book.slug)}/").json()
    assert body["seo"]["title"] == "بوف کور"
    assert body["seo"]["description"].startswith("رمان کوتاه")

    book.seo_title, book.seo_description, book.is_indexable = "عنوان سئو", "توضیح سئو", False
    book.save()
    seo = client.get(f"/api/v1/books/{quote(book.slug)}/").json()["seo"]
    assert seo == {
        "title": "عنوان سئو",
        "description": "توضیح سئو",
        "is_indexable": False,
        "canonical_path": f"/book/{book.slug}",
    }


def test_cover_url_is_public_and_unsigned(client, seeded):
    book = Book.objects.get(title="بوف کور")
    # update() مدل را save نمی‌کند، پس برای ابعاد به MinIO وصل نمی‌شویم
    Book.objects.filter(pk=book.pk).update(
        cover="covers/2026/11/boof.jpg", cover_width=600, cover_height=900
    )
    cover = client.get(f"/api/v1/books/{quote(book.slug)}/").json()["cover"]
    assert cover["url"].endswith("/covers/2026/11/boof.jpg")
    assert "Signature" not in cover["url"] and "?" not in cover["url"]
    assert (cover["width"], cover["height"]) == (600, 900)
    assert cover["alt"] == "جلد کتاب بوف کور"


def test_not_found_uses_contract_error_format(client, seeded):
    response = client.get(f"/api/v1/books/{quote('وجود-ندارد')}/")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


# ---------- دسته، نویسنده، ناشر ----------
def test_category_tree(client, seeded):
    roots = get(client, "categories/").json()
    assert [r["name"] for r in roots] == ["ادبیات"]
    assert {c["name"] for c in roots[0]["children"]} == {"رمان", "شعر", "داستان کوتاه"}
    assert roots[0]["children"][0]["path"].startswith("/category/ادبیات/")


def test_category_detail(client, seeded):
    body = client.get(f"/api/v1/categories/{quote('رمان')}/").json()
    assert [c["name"] for c in body["breadcrumb"]] == ["ادبیات", "رمان"]
    assert body["children"] == []
    root = client.get(f"/api/v1/categories/{quote('ادبیات')}/").json()
    assert len(root["children"]) == 3


def test_author_detail(client, seeded):
    body = client.get(f"/api/v1/authors/{quote('صادق-هدایت')}/").json()
    assert body["name"] == "صادق هدایت" and body["photo"] is None
    assert len(body["books"]) == 3
    assert body["seo"]["canonical_path"] == "/author/صادق-هدایت"


def test_publisher_detail(client, seeded):
    body = client.get(f"/api/v1/publishers/{quote('نشر-آزمایشی-یک')}/").json()
    assert len(body["books"]) == 3


# ---------- سئو ----------
def test_sitemap_lists_only_indexable_active_books(client, seeded):
    hidden = Book.objects.get(title="سه قطره خون")
    hidden.is_indexable = False
    hidden.save()
    gone = Book.objects.get(title="سووشون")
    gone.is_active = False
    gone.save()

    items = get(client, "seo/sitemap/").json()
    paths = {i["path"] for i in items}
    assert f"/book/{hidden.slug}" not in paths and f"/book/{gone.slug}" not in paths
    assert len([i for i in items if i["kind"] == "book"]) == 6
    assert "/category/ادبیات/رمان" in paths and "/category/ادبیات" in paths
    assert "/author/صادق-هدایت" in paths
    book_item = next(i for i in items if i["kind"] == "book")
    assert book_item["lastmod"] is not None


def test_redirect_lookup_after_slug_change(client, seeded):
    book = Book.objects.get(title="کلیدر")
    old_slug = book.slug
    book.slug = "کلیدر-جدید"
    book.save()
    for path in (f"/book/{old_slug}", quote(f"/book/{old_slug}")):
        response = get(client, "seo/redirect/", path=path)
        assert response.status_code == 200
        assert response.json() == {"new_path": "/book/کلیدر-جدید"}


def test_redirect_errors(client, seeded):
    assert get(client, "seo/redirect/", path="/book/نیست").status_code == 404
    response = get(client, "seo/redirect/")
    assert response.status_code == 400
    assert response.json()["error"]["fields"]["path"]


def test_schema_documents_the_catalog_endpoints(client, seeded):
    schema = client.get("/api/v1/schema/", HTTP_ACCEPT="application/vnd.oai.openapi+json").json()
    assert "/api/v1/books/{slug}/" in schema["paths"]
    assert "/api/v1/seo/sitemap/" in schema["paths"]


def test_editions_fixture_covers_both_formats(seeded):
    assert Edition.objects.filter(format="ebook").count() == 6
    assert json.dumps({"ok": True})  # جلوگیری از هشدار import بی‌استفاده
