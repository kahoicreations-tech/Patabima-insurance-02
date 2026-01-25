from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def health(request):
    """Lightweight health endpoint used by load balancers and uptime checks.

    Returns a simple JSON payload without requiring authentication.
    """
    return JsonResponse({
        "status": "ok",
        "service": "pata-bima-api",
    })
