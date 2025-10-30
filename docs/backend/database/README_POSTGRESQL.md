# PostgreSQL Setup for insurance-app

This project can use PostgreSQL via `DATABASE_URL`.

## 1) Install dependencies

```
pip install -r requirements.txt
```

## 2) Set DATABASE_URL (PowerShell)

Example for local Postgres:

```
$env:DATABASE_URL = "postgres://postgres:postgres@localhost:5432/patabima_insurance"
```

If using SSL, append `?sslmode=require`.

## 3) Create DB and run migrations

```
# Ensure your Postgres service is running and database exists
python manage.py migrate
```

## 4) Seed sample data

```
python manage.py seed_underwriters
python manage.py seed_motor_categories
python manage.py seed_comprehensive_pricing
python manage.py validate_pricing_data
```

## Notes

- Without `DATABASE_URL`, the project falls back to SQLite (`db.sqlite3`).
- Use `psql` or a GUI to create the database and user beforehand.
