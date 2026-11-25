from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import filter_books
from .models import Author, Book, Category, Publisher
from .serializers import (
    AuthorDetailSerializer,
    BookDetailSerializer,
    BookListSerializer,
    CategoryDetailSerializer,
    CategoryNodeSerializer,
    PublisherDetailSerializer,
    category_ref,
)


def active_books():
    return Book.objects.filter(is_active=True).prefetch_related("book_authors__author", "editions")


BOOK_LIST_PARAMS = [
    OpenApiParameter("q", OpenApiTypes.STR, description="جستجو در عنوان کتاب و نام نویسنده"),
    OpenApiParameter("category", OpenApiTypes.STR, description="اسلاگ دسته (با زیرمجموعه‌ها)"),
    OpenApiParameter("author", OpenApiTypes.STR, description="اسلاگ نویسنده"),
    OpenApiParameter("publisher", OpenApiTypes.STR, description="اسلاگ ناشر"),
    OpenApiParameter("format", OpenApiTypes.STR, enum=["print", "ebook"]),
    OpenApiParameter("min_price", OpenApiTypes.INT),
    OpenApiParameter("max_price", OpenApiTypes.INT),
    OpenApiParameter("in_stock", OpenApiTypes.BOOL, description="فقط کتاب‌های موجود"),
    OpenApiParameter(
        "ordering", OpenApiTypes.STR, enum=["price", "-price", "-published_year", "-created_at"]
    ),
    OpenApiParameter("page", OpenApiTypes.INT),
    OpenApiParameter("page_size", OpenApiTypes.INT, description="حداکثر ۴۸"),
]


@extend_schema(parameters=BOOK_LIST_PARAMS)
class BookListView(generics.ListAPIView):
    serializer_class = BookListSerializer

    def get_queryset(self):
        return filter_books(active_books(), self.request.query_params)


class BookDetailView(generics.RetrieveAPIView):
    serializer_class = BookDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return active_books().select_related("publisher", "category")


class AuthorDetailView(generics.RetrieveAPIView):
    serializer_class = AuthorDetailSerializer
    queryset = Author.objects.all()
    lookup_field = "slug"


class PublisherDetailView(generics.RetrieveAPIView):
    serializer_class = PublisherDetailSerializer
    queryset = Publisher.objects.all()
    lookup_field = "slug"


def _category_tree():
    """درخت دسته‌ها را با یک کوئری می‌سازد."""
    categories = list(Category.objects.select_related("parent").order_by("name"))
    by_id = {c.pk: c for c in categories}

    def path_of(category):
        slugs, node = [], category
        while node is not None:
            slugs.append(node.slug)
            node = by_id.get(node.parent_id)
        return "/category/" + "/".join(reversed(slugs))

    children = {}
    for category in categories:
        children.setdefault(category.parent_id, []).append(category)

    def build(category):
        return {
            "name": category.name,
            "slug": category.slug,
            "path": path_of(category),
            "children": [build(child) for child in children.get(category.pk, [])],
        }

    return [build(root) for root in children.get(None, [])]


class CategoryTreeView(APIView):
    @extend_schema(responses=CategoryNodeSerializer(many=True))
    def get(self, request):
        return Response(_category_tree())


class CategoryDetailView(generics.RetrieveAPIView):
    serializer_class = CategoryDetailSerializer
    queryset = Category.objects.select_related("parent")
    lookup_field = "slug"

    def retrieve(self, request, *args, **kwargs):
        category = self.get_object()
        data = {
            **category_ref(category),
            "breadcrumb": [category_ref(c) for c in category.ancestors(include_self=True)],
            "children": [category_ref(c) for c in category.children.order_by("name")],
        }
        return Response(data)
