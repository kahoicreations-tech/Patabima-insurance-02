#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.core.management import call_command

# Generate migrations specifically for the app models
try:
    print("Generating migrations for enhanced motor models...")
    call_command('makemigrations', 'app', verbosity=2)
    print("Migrations generated successfully!")
except Exception as e:
    print(f"Error generating migrations: {e}")