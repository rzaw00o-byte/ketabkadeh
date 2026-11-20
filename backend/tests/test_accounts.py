import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.urls import reverse

from apps.accounts.models import User


@pytest.mark.django_db
def test_create_user_with_valid_phone():
    user = User.objects.create_user(phone="09123456789", password="S3cret-pass!")
    assert user.phone == "09123456789"
    assert user.is_active and not user.is_staff


@pytest.mark.parametrize("phone", ["0912345678", "08123456789", "09abc456789", "+989123456789"])
def test_invalid_phone_is_rejected(phone):
    with pytest.raises(ValidationError):
        User(phone=phone).full_clean(exclude=["password"])


@pytest.mark.django_db
def test_phone_must_be_unique():
    User.objects.create_user(phone="09123456789", password="S3cret-pass!")
    with pytest.raises(IntegrityError):
        User.objects.create_user(phone="09123456789", password="Another-pass1")


@pytest.mark.django_db
def test_superuser_flags():
    admin = User.objects.create_superuser(phone="09120000000", password="S3cret-pass!")
    assert admin.is_staff and admin.is_superuser


@pytest.mark.django_db
def test_password_is_hashed_with_argon2():
    user = User.objects.create_user(phone="09123456789", password="S3cret-pass!")
    assert user.password.startswith("argon2$")
    assert user.check_password("S3cret-pass!")


@pytest.mark.django_db
def test_admin_add_user_page_renders(client):
    admin = User.objects.create_superuser(phone="09120000000", password="S3cret-pass!")
    client.force_login(admin)
    response = client.get(reverse("admin:accounts_user_add"))
    assert response.status_code == 200
