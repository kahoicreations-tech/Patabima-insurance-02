# PataBima Motor Insurance - Postman

This folder contains a ready-to-import Postman collection and environment to exercise the Motor Insurance endpoints implemented in the Django backend.

## Files

- `PataBima Motor Insurance.postman_collection.json` — Requests for auth, product listing, premium calculation, and comparison.
- `PataBima Motor Insurance.postman_environment.json` — Environment with `base_url` and variables.

## Prerequisites

- Backend running locally with PostgreSQL configured in `.env`.
- An existing user account or ability to sign up, and knowledge of the password.

## Start Backend

```powershell
cd "c:\Users\USER\Desktop\PATABIMA\PATABIMA FRONT\PATA BIMA AGENCY - Copy\insurance-app"
python manage.py migrate
python manage.py seed_underwriters
python manage.py seed_motor_categories
python manage.py seed_comprehensive_pricing
set PYTHONUTF8=1; python manage.py runserver 0.0.0.0:8000
```

## Import Into Postman

1. Import the environment JSON, select `PataBima Local`.
2. Import the collection JSON.
3. Set active environment to `PataBima Local`.

## Flow

1. Auth → "Login (OTP send)" (sets `otp_code`).
2. Auth → "Auth Login (with OTP)" (sets `access_token`).
3. Motor Insurance → request any of:
   - "List Categories + Subcategories"
   - "List Underwriters"
   - "Calculate Premium (Comprehensive)" — requires `subcategory_code_comp` and `sum_insured`.
   - "Calculate Premium (Tonnage)" — requires `subcategory_code_tonnage` and `tonnage`.
   - "Calculate Premium (PSV)" — requires `subcategory_code_psv` and `passenger_count`.
   - "Compare Pricing (APA vs JUB)" — uses `APA` and `JUB` by default.

## Notes

- All protected endpoints require `Authorization: Bearer {{access_token}}`.
- Base path is `{{base_url}}` → `http://localhost:8000/api/v1/public_app`.
- Example subcategory codes seeded: `PRIVATE_COMPREHENSIVE`, `COMM_TONNAGE`, `PSV_STANDARD`. See `app/management/commands/seed_motor_categories.py` for more.
