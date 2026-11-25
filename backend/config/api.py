"""قالب پاسخ خطا و صفحه‌بندی مشترک API، طبق CONTRACT.md."""

from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import exception_handler as drf_exception_handler

ERROR_CODES = {
    400: ("validation_error", "اطلاعات واردشده معتبر نیست."),
    401: ("not_authenticated", "ابتدا وارد شوید."),
    403: ("permission_denied", "اجازه‌ی دسترسی ندارید."),
    404: ("not_found", "موردی پیدا نشد."),
    405: ("method_not_allowed", "این روش درخواست مجاز نیست."),
    429: ("throttled", "تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید."),
}


def api_exception_handler(exc, context):
    """همه‌ی خطاها را به شکل {"error": {"code", "message", "fields"}} برمی‌گرداند."""
    response = drf_exception_handler(exc, context)
    if response is None:
        return None
    code, message = ERROR_CODES.get(response.status_code, ("error", "خطایی رخ داد."))
    fields = {}
    if isinstance(exc, ValidationError):
        data = response.data
        fields = data if isinstance(data, dict) else {"non_field_errors": data}
    response.data = {"error": {"code": code, "message": message, "fields": fields}}
    return response


class StandardPagination(PageNumberPagination):
    page_size_query_param = "page_size"
    max_page_size = 48
