from django.utils.text import Truncator
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Author, Book, Edition, Publisher


class CoverSerializer(serializers.Serializer):
    url = serializers.URLField()
    alt = serializers.CharField()
    width = serializers.IntegerField(allow_null=True)
    height = serializers.IntegerField(allow_null=True)


class AuthorRefSerializer(serializers.Serializer):
    name = serializers.CharField()
    slug = serializers.CharField()
    role = serializers.CharField()


class PublisherRefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publisher
        fields = ("name", "slug")


class CategoryRefSerializer(serializers.Serializer):
    name = serializers.CharField()
    slug = serializers.CharField()
    path = serializers.CharField()


class CategoryWithBreadcrumbSerializer(CategoryRefSerializer):
    breadcrumb = CategoryRefSerializer(many=True)


class EditionSerializer(serializers.ModelSerializer):
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Edition
        fields = ("id", "format", "price", "stock", "in_stock")


class RatingSerializer(serializers.Serializer):
    average = serializers.FloatField(allow_null=True)
    count = serializers.IntegerField()


class SeoSerializer(serializers.Serializer):
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    is_indexable = serializers.BooleanField()
    canonical_path = serializers.CharField()


def category_ref(category):
    return {"name": category.name, "slug": category.slug, "path": category.path}


class BookListSerializer(serializers.ModelSerializer):
    """آیتم فهرست کتاب‌ها (کارت کتاب)."""

    cover = serializers.SerializerMethodField()
    authors = serializers.SerializerMethodField()
    price_from = serializers.SerializerMethodField()
    in_stock = serializers.SerializerMethodField()
    formats = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = ("id", "title", "slug", "cover", "authors", "price_from", "in_stock", "formats")

    @extend_schema_field(CoverSerializer(allow_null=True))
    def get_cover(self, obj):
        if not obj.cover:
            return None
        return {
            "url": obj.cover.url,
            "alt": obj.cover_alt or obj.title,
            "width": obj.cover_width,
            "height": obj.cover_height,
        }

    @extend_schema_field(AuthorRefSerializer(many=True))
    def get_authors(self, obj):
        return [
            {"name": ba.author.name, "slug": ba.author.slug, "role": ba.role}
            for ba in obj.book_authors.all()
        ]

    @extend_schema_field(serializers.IntegerField(allow_null=True))
    def get_price_from(self, obj):
        prices = [e.price for e in obj.editions.all()]
        return min(prices) if prices else None

    def get_in_stock(self, obj) -> bool:
        return any(e.in_stock for e in obj.editions.all())

    def get_formats(self, obj) -> list[str]:
        return [e.format for e in obj.editions.all()]


class BookDetailSerializer(BookListSerializer):
    publisher = PublisherRefSerializer()
    category = serializers.SerializerMethodField()
    editions = EditionSerializer(many=True)
    rating = serializers.SerializerMethodField()
    seo = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = (
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
        )

    @extend_schema_field(CategoryWithBreadcrumbSerializer())
    def get_category(self, obj):
        chain = obj.category.ancestors(include_self=True)
        return {**category_ref(obj.category), "breadcrumb": [category_ref(c) for c in chain]}

    @extend_schema_field(RatingSerializer())
    def get_rating(self, obj):
        # اپ نظرات هنوز ساخته نشده؛ بعداً از Review محاسبه می‌شود.
        return {"average": None, "count": 0}

    @extend_schema_field(SeoSerializer())
    def get_seo(self, obj):
        return {
            "title": obj.seo_title or obj.title,
            "description": obj.seo_description or Truncator(obj.description).chars(160),
            "is_indexable": obj.is_indexable,
            "canonical_path": f"/book/{obj.slug}",
        }


class AuthorDetailSerializer(serializers.ModelSerializer):
    photo = serializers.SerializerMethodField()
    books = serializers.SerializerMethodField()
    seo = serializers.SerializerMethodField()

    class Meta:
        model = Author
        fields = ("name", "slug", "bio", "photo", "books", "seo")

    def get_photo(self, obj) -> str | None:
        return obj.photo.url if obj.photo else None

    @extend_schema_field(BookListSerializer(many=True))
    def get_books(self, obj):
        books = (
            Book.objects.filter(is_active=True, book_authors__author=obj)
            .prefetch_related("book_authors__author", "editions")
            .distinct()
        )
        return BookListSerializer(books, many=True, context=self.context).data

    @extend_schema_field(SeoSerializer())
    def get_seo(self, obj):
        return {
            "title": obj.name,
            "description": Truncator(obj.bio).chars(160),
            "is_indexable": True,
            "canonical_path": f"/author/{obj.slug}",
        }


class PublisherDetailSerializer(serializers.ModelSerializer):
    books = serializers.SerializerMethodField()

    class Meta:
        model = Publisher
        fields = ("name", "slug", "books")

    @extend_schema_field(BookListSerializer(many=True))
    def get_books(self, obj):
        books = Book.objects.filter(is_active=True, publisher=obj).prefetch_related(
            "book_authors__author", "editions"
        )
        return BookListSerializer(books, many=True, context=self.context).data


class CategoryNodeSerializer(CategoryRefSerializer):
    children = serializers.SerializerMethodField()

    def get_children(self, obj) -> list:
        return []


class CategoryDetailSerializer(CategoryWithBreadcrumbSerializer):
    children = CategoryRefSerializer(many=True)
