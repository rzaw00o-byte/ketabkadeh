from django.urls import path

from . import views

urlpatterns = [
    path("seo/sitemap/", views.SitemapView.as_view(), name="seo-sitemap"),
    path("seo/redirect/", views.RedirectView.as_view(), name="seo-redirect"),
]
