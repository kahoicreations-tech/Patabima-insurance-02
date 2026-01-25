import os
import uuid
from datetime import date
import sys


def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    django_root = os.path.join(repo_root, "insurance-app")
    if django_root not in sys.path:
        sys.path.insert(0, django_root)

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "insurance.settings")

    import django

    django.setup()

    from django.contrib.auth import get_user_model
    from rest_framework.test import APIClient

    User = get_user_model()
    try:
        user = User.objects.order_by("date_created").first()
    except Exception:
        user = None
    user = user or User.objects.first()
    if not user:
        raise RuntimeError("No users found in DB; create one and re-run.")

    client = APIClient()
    client.force_authenticate(user=user)

    txn = f"SMOKE-{uuid.uuid4()}"

    payload = {
        "quoteId": None,
        "clientDetails": {
            "fullName": "Smoke Test",
            "phone": "254700000001",
            "email": "smoke.test@example.com",
            "idNumber": "12345678",
            "kraPin": "A000000000A",
            "address": "Nairobi",
        },
        "vehicleDetails": {
            "registration": f"KSM{str(uuid.uuid4())[:5].upper()}",
            "make": "TOYOTA",
            "model": "COROLLA",
            "year": "2015",
            "coverStartDate": date.today().isoformat(),
        },
        "productDetails": {
            "category": "PRIVATE",
            "subcategory": "PRIVATE_THIRD_PARTY",
            "coverageType": "THIRD_PARTY",
        },
        "underwriterDetails": {
            "name": "Smoke Underwriter",
            "code": "SMOKE",
        },
        "premiumBreakdown": {
            "base_premium": 2975,
            "training_levy": 7.44,
            "pcf_levy": 7.44,
            "stamp_duty": 40,
            "total_amount": 3029.88,
        },
        "paymentDetails": {
            "method": "MANUAL",
            "amount": 3029.88,
            "status": "CONFIRMED",
            "transaction_id": txn,
        },
        "documents": [],
        "addons": [],
    }

    print("[1/4] POST /api/motor3/quotations/third-party/")
    r = client.post("/api/motor3/quotations/third-party/", payload, format="json")
    print("  status:", r.status_code)
    print("  keys:", sorted(list((r.data or {}).keys())))
    assert r.status_code in (200, 201), r.data
    quotation_id = (r.data or {}).get("quotation", {}).get("id")
    assert quotation_id, f"Missing quotation id: {r.data}"

    print("[2/4] GET /api/motor3/quotations/")
    r2 = client.get("/api/motor3/quotations/")
    print("  status:", r2.status_code)
    assert r2.status_code == 200, r2.data
    assert (r2.data or {}).get("success") is True, r2.data

    print("[3/4] GET /api/motor3/quotations/<id>/")
    r3 = client.get(f"/api/motor3/quotations/{quotation_id}/")
    print("  status:", r3.status_code)
    assert r3.status_code == 200, r3.data
    assert (r3.data or {}).get("quotation", {}).get("id") == quotation_id

    print("[4/4] POST /api/motor3/quotations/<id>/convert/")
    # This will attempt policy create+activate; if DMVIC is unavailable it may return a structured error.
    r4 = client.post(
        f"/api/motor3/quotations/{quotation_id}/convert/",
        {"paymentDetails": payload["paymentDetails"]},
        format="json",
    )
    print("  status:", r4.status_code)
    print("  success:", (r4.data or {}).get("success"))
    if r4.status_code >= 500:
        raise AssertionError(f"Convert returned 5xx: {r4.data}")

    print("\n✅ Motor3 smoke test completed (no 5xx).")


if __name__ == "__main__":
    main()
