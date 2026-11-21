from django.db import models
from django.db.models import F, Q


class SlugRedirect(models.Model):
    """هدایت ۳۰۱ از نشانی قدیمی به نشانی جدید، وقتی اسلاگ تغییر می‌کند."""

    old_path = models.CharField("نشانی قدیمی", max_length=500, unique=True)
    new_path = models.CharField("نشانی جدید", max_length=500)
    created_at = models.DateTimeField("تاریخ ثبت", auto_now_add=True)

    class Meta:
        verbose_name = "هدایت ۳۰۱"
        verbose_name_plural = "هدایت‌های ۳۰۱"
        ordering = ("-created_at",)
        constraints = [
            models.CheckConstraint(
                condition=~Q(old_path=F("new_path")),
                name="seo_redirect_old_differs_from_new",
            ),
        ]

    def __str__(self):
        return f"{self.old_path} → {self.new_path}"


def record_redirect(old_path, new_path):
    """هدایت را ثبت می‌کند، بدون زنجیره و بدون حلقه."""
    if old_path == new_path:
        return
    # برگشتن به نشانی قبلی: هدایتِ آن نشانی دیگر لازم نیست (جلوگیری از حلقه)
    SlugRedirect.objects.filter(old_path=new_path).delete()
    # زنجیره A→B و B→C را به A→C و B→C تبدیل می‌کنیم
    SlugRedirect.objects.filter(new_path=old_path).update(new_path=new_path)
    SlugRedirect.objects.update_or_create(old_path=old_path, defaults={"new_path": new_path})
