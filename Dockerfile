# Use Python 3.11 slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        gcc \
        python3-dev \
        libpq-dev \
        curl \
        gettext \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY insurance-app/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY insurance-app/ /app/

# Create static files directory
RUN mkdir -p /app/staticfiles

# Collect static files
RUN python manage.py collectstatic --noinput

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Wait for database to be ready\n\
until pg_isready -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER; do\n\
  echo "Waiting for database..."\n\
  sleep 2\n\
done\n\
\n\
echo "Database is ready!"\n\
\n\
# Run migrations\n\
python manage.py migrate --noinput\n\
\n\
# Create superuser if it does not exist\n\
python manage.py shell -c "\
from django.contrib.auth.models import User; \
User.objects.filter(username='"'"'admin'"'"').exists() or \
User.objects.create_superuser('"'"'admin'"'"', '"'"'admin@patabima.com'"'"', '"'"'admin123'"'"')"\n\
\n\
# Start Gunicorn\n\
exec gunicorn --bind 0.0.0.0:8000 --workers 3 --timeout 60 insurance.wsgi:application' > /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8000/api/health/ || exit 1

# Run entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]