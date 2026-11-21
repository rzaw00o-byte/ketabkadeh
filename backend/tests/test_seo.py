import pytest

from apps.catalog.models import Author, Book, Category, Publisher
from apps.seo.models import SlugRedirect, record_redirect


@pytest.fixture
def book(db):
    return Book.objects.create(
        title="عنوان",
        slug="a",
        publisher=Publisher.objects.create(name="ناشر"),
        category=Category.objects.create(name="دسته"),
    )


def change_slug(obj, slug):
    obj.slug = slug
    obj.save()


def test_changing_book_slug_creates_redirect(book):
    change_slug(book, "b")
    redirect = SlugRedirect.objects.get()
    assert (redirect.old_path, redirect.new_path) == ("/book/a", "/book/b")


def test_unchanged_slug_creates_no_redirect(book):
    book.description = "متن جدید"
    book.save()
    assert SlugRedirect.objects.count() == 0


def test_redirect_chain_is_flattened(book):
    change_slug(book, "b")
    change_slug(book, "c")
    pairs = set(SlugRedirect.objects.values_list("old_path", "new_path"))
    assert pairs == {("/book/a", "/book/c"), ("/book/b", "/book/c")}


def test_going_back_to_old_slug_removes_loop(book):
    change_slug(book, "b")
    change_slug(book, "a")
    pairs = set(SlugRedirect.objects.values_list("old_path", "new_path"))
    assert pairs == {("/book/b", "/book/a")}


def test_author_slug_change_creates_redirect(db):
    author = Author.objects.create(name="نویسنده", slug="x")
    change_slug(author, "y")
    assert SlugRedirect.objects.get().old_path == "/author/x"


def test_same_path_is_ignored(db):
    record_redirect("/book/a", "/book/a")
    assert SlugRedirect.objects.count() == 0


def test_redirect_str(db):
    record_redirect("/book/a", "/book/b")
    assert str(SlugRedirect.objects.get()) == "/book/a → /book/b"
