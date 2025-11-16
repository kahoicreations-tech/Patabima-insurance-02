#!/bin/bash
# Collect static files after deployment

source /var/app/venv/*/bin/activate
cd /var/app/current

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Static files collected!"
