"""
Django Management Command: Export Motor2 Static Data

Purpose:
    Exports Motor2 categories and subcategories to JSON files for frontend static data

Usage:
    python manage.py export_motor2_static

Output:
    Creates JSON files in static_exports/motor2/:
    - categories.json
    - metadata.json
    - subcategories/PRIVATE.json
    - subcategories/COMMERCIAL.json
    - subcategories/PSV.json
    - subcategories/MOTORCYCLE.json
    - subcategories/TUKTUK.json
    - subcategories/SPECIAL.json

Author: PataBima Development Team
Date: November 10, 2025
"""

from django.core.management.base import BaseCommand
from django.conf import settings
import json
import os
from datetime import datetime

# Import Motor2 models
try:
    from app.models import MotorCategory, MotorSubcategory
except ImportError:
    print("ERROR: Could not import Motor2 models. Make sure models.py has MotorCategory and MotorSubcategory.")
    MotorCategory = None
    MotorSubcategory = None


class Command(BaseCommand):
    help = 'Export Motor2 categories and subcategories to static JSON files for frontend'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output-dir',
            type=str,
            default='static_exports/motor2',
            help='Output directory for exported JSON files (default: static_exports/motor2)'
        )
        parser.add_argument(
            '--data-version',
            type=str,
            default='1.0.0',
            help='Version number for metadata (default: 1.0.0)'
        )

    def handle(self, *args, **options):
        """Main command handler"""
        
        if not MotorCategory or not MotorSubcategory:
            self.stdout.write(self.style.ERROR('❌ Motor2 models not found. Cannot export.'))
            return

        output_dir = options['output_dir']
        version = options['data_version']
        
        self.stdout.write(self.style.SUCCESS('=' * 70))
        self.stdout.write(self.style.SUCCESS('🚀 Motor2 Static Data Export'))
        self.stdout.write(self.style.SUCCESS('=' * 70))
        self.stdout.write(f'Output Directory: {output_dir}')
        self.stdout.write(f'Version: {version}')
        self.stdout.write('')

        # Create output directories
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(os.path.join(output_dir, 'subcategories'), exist_ok=True)
        
        # Export categories
        categories_data = self._export_categories()
        categories_path = os.path.join(output_dir, 'categories.json')
        with open(categories_path, 'w', encoding='utf-8') as f:
            json.dump(categories_data, f, indent=2, ensure_ascii=False)
        
        self.stdout.write(self.style.SUCCESS(f'✅ Exported {len(categories_data)} categories → {categories_path}'))
        
        # Export subcategories by category
        total_subcategories = 0
        for cat_data in categories_data:
            subcategories_data = self._export_subcategories(cat_data['code'])
            total_subcategories += len(subcategories_data)
            
            subcategories_path = os.path.join(output_dir, 'subcategories', f"{cat_data['code']}.json")
            with open(subcategories_path, 'w', encoding='utf-8') as f:
                json.dump(subcategories_data, f, indent=2, ensure_ascii=False)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Exported {len(subcategories_data)} subcategories for {cat_data["name"]} → {subcategories_path}'
                )
            )
        
        # Generate metadata
        metadata = self._generate_metadata(version, len(categories_data), total_subcategories)
        metadata_path = os.path.join(output_dir, 'metadata.json')
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        self.stdout.write(self.style.SUCCESS(f'✅ Exported metadata → {metadata_path}'))
        
        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 70))
        self.stdout.write(self.style.SUCCESS('📊 EXPORT SUMMARY'))
        self.stdout.write(self.style.SUCCESS('=' * 70))
        self.stdout.write(f'Total Categories: {len(categories_data)}')
        self.stdout.write(f'Total Subcategories: {total_subcategories}')
        self.stdout.write(f'Version: {version}')
        self.stdout.write(f'Output Directory: {output_dir}')
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('✅ EXPORT COMPLETE!'))
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('📝 NEXT STEPS:'))
        self.stdout.write('1. Copy JSON files to frontend/data/motor2/')
        self.stdout.write('2. Convert to JavaScript static files (see MOTOR2_STATIC_DATA_IMPLEMENTATION.md Step 2)')
        self.stdout.write('3. Update version in frontend/data/motor2/metadata.js')
        self.stdout.write('')

    def _export_categories(self):
        """Export all active motor categories"""
        categories = MotorCategory.objects.filter(is_active=True).order_by('sort_order')
        categories_data = []
        
        for cat in categories:
            # Build field requirements from model boolean flags
            field_requirements = {
                'requires_tonnage': cat.requires_tonnage,
                'requires_engine_capacity': cat.requires_engine_capacity,
                'requires_passenger_count': cat.requires_passenger_count,
                'requires_passenger_type': cat.requires_passenger_type,
                'requires_carrying_capacity': cat.requires_carrying_capacity,
                'supports_time_period_variants': cat.supports_time_period_variants,
            }
            
            categories_data.append({
                'id': str(cat.id),
                'code': cat.code,
                'name': cat.name,
                'description': cat.description or '',
                'icon': cat.icon or '🚗',
                'pricing_type': cat.pricing_type,
                'field_requirements': field_requirements,
                'min_vehicle_age': cat.min_vehicle_age,
                'max_vehicle_age': cat.max_vehicle_age,
                'is_active': cat.is_active,
                'sort_order': cat.sort_order,
            })
        
        return categories_data

    def _export_subcategories(self, category_code):
        """Export subcategories for a specific category"""
        try:
            category = MotorCategory.objects.get(code=category_code, is_active=True)
        except MotorCategory.DoesNotExist:
            self.stdout.write(self.style.WARNING(f'⚠️  Category {category_code} not found'))
            return []
        
        subcategories = MotorSubcategory.objects.filter(
            category=category,
            is_active=True
        ).order_by('public_sort_order', 'subcategory_name')
        
        subcategories_data = []
        for subcat in subcategories:
            subcategories_data.append({
                'id': str(subcat.id),
                'subcategory_code': subcat.subcategory_code,
                'name': subcat.subcategory_name,
                'description': getattr(subcat, 'description', ''),
                'category_code': category_code,
                'pricing_model': subcat.pricing_model,
                'product_type': subcat.product_type,
                'is_complex': subcat.is_complex,
                'additional_fields': subcat.additional_fields,
                'pricing_requirements': subcat.pricing_requirements,
                'is_active': subcat.is_active,
                'show_in_public': subcat.show_in_public,
                'public_sort_order': subcat.public_sort_order,
                'public_label': subcat.public_label or subcat.subcategory_name,
            })
        
        return subcategories_data

    def _generate_metadata(self, version, total_categories, total_subcategories):
        """Generate metadata file with version info"""
        
        # Get most recent update timestamp
        latest_category = MotorCategory.objects.filter(is_active=True).order_by('-date_updated').first()
        latest_subcategory = MotorSubcategory.objects.filter(is_active=True).order_by('-date_updated').first()
        
        last_updated = None
        if latest_category:
            last_updated = latest_category.date_updated
        if latest_subcategory and (not last_updated or latest_subcategory.date_updated > last_updated):
            last_updated = latest_subcategory.date_updated
        
        # Get category versions (all use same version)
        categories = MotorCategory.objects.filter(is_active=True)
        category_versions = {cat.code: version for cat in categories}
        
        metadata = {
            'version': version,
            'exported_at': datetime.now().isoformat(),
            'last_updated': last_updated.isoformat() if last_updated else None,
            'total_categories': total_categories,
            'total_subcategories': total_subcategories,
            'category_versions': category_versions,
            'schema_version': '1.0',
            'notes': 'Auto-generated by export_motor2_static management command'
        }
        
        return metadata
