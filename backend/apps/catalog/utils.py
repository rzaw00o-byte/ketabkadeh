from django.utils.text import slugify


def generate_unique_slug(instance, source, max_length=200):
    """اسلاگ خوانا (فارسی مجاز) از متن می‌سازد و در صورت تکراری بودن، -2، -3 و... می‌افزاید."""
    base = slugify(source, allow_unicode=True)[: max_length - 8] or "item"
    others = type(instance).objects.exclude(pk=instance.pk)
    slug, counter = base, 2
    while others.filter(slug=slug).exists():
        slug = f"{base}-{counter}"
        counter += 1
    return slug
