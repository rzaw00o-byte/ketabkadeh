from django.contrib import admin

from .models import SlugRedirect


@admin.register(SlugRedirect)
class SlugRedirectAdmin(admin.ModelAdmin):
    list_display = ("old_path", "new_path", "created_at")
    search_fields = ("old_path", "new_path")
    ordering = ("-created_at",)
