import pytest
from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.db import IntegrityError, transaction
from django.urls import reverse

from apps.accounts.models import User
from apps.catalog.models import Author, Book, BookAuthor, Category, Edition, Publisher


@pytest.fixture
def publisher(db):
    return Publisher.objects.create(name="نشر نمونه")


@pytest.fixture
def category(db):
    return Category.objects.create(name="رمان")


@pytest.fixture
def book(publisher, category):
    return Book.objects.create(title="بوف کور", publisher=publisher, category=category)


def test_slug_is_generated_from_persian_title(book):
    assert book.slug == "بوف-کور"


def test_duplicate_titles_get_numbered_slugs(book, publisher, category):
    second = Book.objects.create(title="بوف کور", publisher=publisher, category=category)
    assert second.slug == "بوف-کور-2"


def test_explicit_slug_is_kept(publisher, category):
    book = Book.objects.create(title="x", slug="my-slug", publisher=publisher, category=category)
    assert book.slug == "my-slug"


def test_books_without_isbn_do_not_collide(publisher, category):
    Book.objects.create(title="الف", isbn="", publisher=publisher, category=category)
    second = Book.objects.create(title="ب", isbn="", publisher=publisher, category=category)
    assert second.isbn is None


def test_isbn_must_be_unique(publisher, category):
    Book.objects.create(
        title="الف", isbn="978-600-0000-00-0", publisher=publisher, category=category
    )
    with pytest.raises(IntegrityError), transaction.atomic():
        Book.objects.create(
            title="ب", isbn="978-600-0000-00-0", publisher=publisher, category=category
        )


def test_category_breadcrumb_and_str(db):
    root = Category.objects.create(name="ادبیات")
    child = Category.objects.create(name="رمان", parent=root)
    assert [c.name for c in child.ancestors(include_self=True)] == ["ادبیات", "رمان"]
    assert str(child) == "ادبیات › رمان"


def test_category_cannot_be_its_own_ancestor(db):
    root = Category.objects.create(name="ادبیات")
    child = Category.objects.create(name="رمان", parent=root)
    root.parent = child
    with pytest.raises(ValidationError):
        root.clean()


def test_print_edition_requires_stock(book):
    with pytest.raises(IntegrityError), transaction.atomic():
        Edition.objects.create(book=book, format="print", price=1000, stock=None)


def test_ebook_edition_cannot_have_stock(book):
    with pytest.raises(IntegrityError), transaction.atomic():
        Edition.objects.create(book=book, format="ebook", price=1000, stock=5)


def test_one_edition_per_format(book):
    Edition.objects.create(book=book, format="print", price=1000, stock=1)
    with pytest.raises(IntegrityError), transaction.atomic():
        Edition.objects.create(book=book, format="print", price=2000, stock=2)


def test_edition_in_stock_rules(book):
    printed = Edition(book=book, format="print", price=1000, stock=0)
    assert printed.in_stock is False
    printed.stock = 3
    assert printed.in_stock is True
    ebook = Edition(book=book, format="ebook", price=1000)
    assert ebook.in_stock is False
    ebook.file_key = "ebooks/a.epub"
    assert ebook.in_stock is True


def test_edition_clean_reports_stock_errors(book):
    with pytest.raises(ValidationError):
        Edition(book=book, format="print", price=1000, stock=None).clean()
    with pytest.raises(ValidationError):
        Edition(book=book, format="ebook", price=1000, stock=2).clean()


def test_same_author_role_cannot_repeat(book):
    author = Author.objects.create(name="صادق هدایت")
    BookAuthor.objects.create(book=book, author=author, role="author")
    with pytest.raises(IntegrityError), transaction.atomic():
        BookAuthor.objects.create(book=book, author=author, role="author")
    BookAuthor.objects.create(book=book, author=author, role="translator")


def test_seed_command_is_idempotent(db):
    call_command("seed_catalog", verbosity=0)
    counts = (Book.objects.count(), Edition.objects.count(), BookAuthor.objects.count())
    call_command("seed_catalog", verbosity=0)
    assert counts == (Book.objects.count(), Edition.objects.count(), BookAuthor.objects.count())
    assert Book.objects.count() == 8
    assert Edition.objects.filter(format="print", stock=0).exists()


@pytest.mark.parametrize(
    "url_name",
    [
        "admin:catalog_book_changelist",
        "admin:catalog_book_add",
        "admin:catalog_author_changelist",
        "admin:catalog_publisher_changelist",
        "admin:catalog_category_changelist",
        "admin:seo_slugredirect_changelist",
    ],
)
def test_admin_pages_render(client, db, url_name):
    admin = User.objects.create_superuser(phone="09120000000", password="S3cret-pass!")
    client.force_login(admin)
    assert client.get(reverse(url_name)).status_code == 200
