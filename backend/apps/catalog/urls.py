from django.urls import path

from . import views

urlpatterns = [
    path("categories/", views.CategoryTreeView.as_view(), name="category-tree"),
    path("categories/<str:slug>/", views.CategoryDetailView.as_view(), name="category-detail"),
    path("books/", views.BookListView.as_view(), name="book-list"),
    path("books/<str:slug>/", views.BookDetailView.as_view(), name="book-detail"),
    path("authors/<str:slug>/", views.AuthorDetailView.as_view(), name="author-detail"),
    path("publishers/<str:slug>/", views.PublisherDetailView.as_view(), name="publisher-detail"),
]
