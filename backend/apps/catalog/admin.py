from django.contrib import admin

from .models import Author, Book, BookAuthor, Category, Edition, Publisher


class BookAuthorInline(admin.TabularInline):
    model = BookAuthor
    extra = 1
    autocomplete_fields = ("author",)


class EditionInline(admin.TabularInline):
    model = Edition
    extra = 1
    max_num = 2


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "publisher", "is_active", "is_indexable", "updated_at")
    list_filter = ("is_active", "is_indexable", "category", "publisher", "editions__format")
    search_fields = ("title", "isbn", "authors__name", "publisher__name")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("publisher", "category")
    readonly_fields = ("created_at", "updated_at")
    inlines = (BookAuthorInline, EditionInline)
    fieldsets = (
        (None, {"fields": ("title", "slug", "isbn", "publisher", "category", "is_active")}),
        ("مشخصات", {"fields": ("description", "pages", "published_year", "cover")}),
        (
            "سئو",
            {"fields": ("seo_title", "seo_description", "cover_alt", "is_indexable")},
        ),
        ("تاریخ‌ها", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Publisher)
class PublisherAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "parent", "slug")
    list_filter = ("parent",)
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    autocomplete_fields = ("parent",)
