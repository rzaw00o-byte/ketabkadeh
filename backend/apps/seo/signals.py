from django.db.models.signals import pre_save
from django.dispatch import receiver

from apps.catalog.models import Author, Book

from .models import record_redirect


def _track_slug_change(sender, instance):
    if not instance.pk:
        return
    old_slug = sender.objects.filter(pk=instance.pk).values_list("slug", flat=True).first()
    if old_slug and old_slug != instance.slug:
        prefix = sender.PATH_PREFIX
        record_redirect(f"/{prefix}/{old_slug}", f"/{prefix}/{instance.slug}")


@receiver(pre_save, sender=Book)
def book_slug_changed(sender, instance, **kwargs):
    _track_slug_change(sender, instance)


@receiver(pre_save, sender=Author)
def author_slug_changed(sender, instance, **kwargs):
    _track_slug_change(sender, instance)
