from urllib.parse import unquote

from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Author, Book, BookAuthor, Category

from .models import SlugRedirect

SitemapItemSerializer = inline_serializer(
    "SitemapItem",
    {
        "path": serializers.CharField(),
        "lastmod": serializers.DateTimeField(allow_null=True),
        "kind": serializers.ChoiceField(choices=["book", "author", "category"]),
    },
    many=True,
)


class SitemapView(APIView):
    """فهرست نشانی‌های قابل نمایه برای sitemap.xml (فقط کتاب فعال و قابل نمایه)."""

    @extend_schema(responses=SitemapItemSerializer)
    def get(self, request):
        books = Book.objects.filter(is_active=True, is_indexable=True)
        items = [
            {"path": f"/book/{slug}", "lastmod": updated_at, "kind": "book"}
            for slug, updated_at in books.values_list("slug", "updated_at")
        ]

        author_ids = BookAuthor.objects.filter(book__in=books).values("author_id")
        items += [
            {"path": f"/author/{slug}", "lastmod": None, "kind": "author"}
            for slug in Author.objects.filter(pk__in=author_ids).values_list("slug", flat=True)
        ]

        # دسته‌هایی که کتاب فعال دارند، به‌همراه والدهایشان (برای صفحه‌ی مسیر کامل)
        categories = {c.pk: c for c in Category.objects.all()}
        used = set()
        for category_id in books.values_list("category_id", flat=True).distinct():
            node = categories.get(category_id)
            while node is not None and node.pk not in used:
                used.add(node.pk)
                node = categories.get(node.parent_id)

        def path_of(category):
            slugs, node = [], category
            while node is not None:
                slugs.append(node.slug)
                node = categories.get(node.parent_id)
            return "/category/" + "/".join(reversed(slugs))

        items += [
            {"path": path_of(categories[pk]), "lastmod": None, "kind": "category"}
            for pk in sorted(used)
        ]
        return Response(items)


class RedirectView(APIView):
    """نشانی قدیمی را به جدید تبدیل می‌کند؛ فرانتاند با کد ۳۰۱ هدایت می‌کند."""

    @extend_schema(
        responses=inline_serializer("RedirectTarget", {"new_path": serializers.CharField()})
    )
    def get(self, request):
        path = request.query_params.get("path")
        if not path:
            raise ValidationError({"path": ["پارامتر path الزامی است."]})
        redirect = SlugRedirect.objects.filter(old_path__in={path, unquote(path)}).first()
        if redirect is None:
            raise NotFound()
        return Response({"new_path": redirect.new_path})
