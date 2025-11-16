#!/bin/bash
# Run database migrations after deployment

source /var/app/venv/*/bin/activate
cd /var/app/current

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Migrations completed!"
