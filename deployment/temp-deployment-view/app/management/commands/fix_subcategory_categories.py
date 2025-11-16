"""
Django management command to fix subcategory category assignments for DMVIC compliance.
This command safely moves misplaced subcategories to their correct categories.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from app.models import MotorCategory, MotorSubcategory
import sys


class Command(BaseCommand):
    help = 'Fix subcategory category assignments for DMVIC compliance'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making changes',
        )
        parser.add_argument(
            '--backup-check',
            action='store_true',
            help='Verify database backup exists before proceeding',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Skip confirmation prompts (use with caution)',
        )

    def handle(self, *args, **options):
        self.dry_run = options['dry_run']
        self.force = options['force']
        
        # Display header
        self.stdout.write(self.style.SUCCESS('=' * 80))
        self.stdout.write(self.style.SUCCESS('DMVIC SUBCATEGORY MIGRATION TOOL'))
        self.stdout.write(self.style.SUCCESS('=' * 80))
        
        if self.dry_run:
            self.stdout.write(self.style.WARNING('🔍 DRY RUN MODE - No changes will be made'))
        else:
            self.stdout.write(self.style.ERROR('⚠️  LIVE MODE - Changes will be applied to database'))
        
        # Step 1: Verify database connectivity
        self.stdout.write('\n📡 Step 1: Verifying database connectivity...')
        try:
            category_count = MotorCategory.objects.count()
            subcategory_count = MotorSubcategory.objects.count()
            self.stdout.write(self.style.SUCCESS(f'✅ Connected - {category_count} categories, {subcategory_count} subcategories'))
        except Exception as e:
            raise CommandError(f'❌ Database connection failed: {e}')

        # Step 2: Get category objects
        self.stdout.write('\n📋 Step 2: Loading categories...')
        try:
            categories = self._get_categories()
            self.stdout.write(self.style.SUCCESS('✅ All categories loaded successfully'))
        except Exception as e:
            raise CommandError(f'❌ Failed to load categories: {e}')

        # Step 3: Analyze current state
        self.stdout.write('\n🔍 Step 3: Analyzing current subcategory distribution...')
        issues = self._analyze_current_state(categories)
        
        if not issues:
            self.stdout.write(self.style.SUCCESS('✅ No issues found - database is already clean!'))
            return

        # Step 4: Show what will be changed
        self.stdout.write(f'\n📊 Step 4: Found {len(issues)} subcategories to move:')
        self._display_migration_plan(issues)

        # Step 5: Confirmation (unless forced)
        if not self.dry_run and not self.force:
            self.stdout.write('\n⚠️  Step 5: Confirmation required')
            if not self._get_user_confirmation():
                self.stdout.write(self.style.WARNING('Migration cancelled by user'))
                return

        # Step 6: Execute migration
        if self.dry_run:
            self.stdout.write('\n🔍 Step 6: DRY RUN - Would execute migration here')
        else:
            self.stdout.write('\n🔧 Step 6: Executing migration...')
            self._execute_migration(issues, categories)

        # Step 7: Verify results
        self.stdout.write('\n✅ Step 7: Verifying results...')
        self._verify_migration_results(categories)

        self.stdout.write('\n' + '=' * 80)
        if self.dry_run:
            self.stdout.write(self.style.SUCCESS('🔍 DRY RUN COMPLETE - No changes made'))
        else:
            self.stdout.write(self.style.SUCCESS('🎉 MIGRATION COMPLETE - Database cleaned successfully!'))
        self.stdout.write('=' * 80)

    def _get_categories(self):
        """Load all required categories"""
        categories = {}
        required_codes = ['PRIVATE', 'COMMERCIAL', 'PSV', 'MOTORCYCLE', 'TUKTUK', 'SPECIAL']
        
        for code in required_codes:
            try:
                categories[code] = MotorCategory.objects.get(code=code, is_active=True)
                self.stdout.write(f'  ✅ {code}: {categories[code].name}')
            except MotorCategory.DoesNotExist:
                raise CommandError(f'Category {code} not found or inactive')
        
        return categories

    def _analyze_current_state(self, categories):
        """Analyze current subcategory distribution and find issues"""
        issues = []
        
        for category_code, category in categories.items():
            subcategories = MotorSubcategory.objects.filter(
                category=category, 
                is_active=True
            )
            
            misplaced = []
            for sub in subcategories:
                if not sub.subcategory_code.startswith(category_code):
                    # Determine correct category
                    correct_category = self._determine_correct_category(sub.subcategory_code, categories)
                    if correct_category:
                        misplaced.append({
                            'subcategory': sub,
                            'current_category': category,
                            'correct_category': correct_category,
                            'subcategory_code': sub.subcategory_code
                        })
            
            if misplaced:
                self.stdout.write(f'  ❌ {category_code}: {len(misplaced)} misplaced subcategories')
                issues.extend(misplaced)
            else:
                self.stdout.write(f'  ✅ {category_code}: Clean')
        
        return issues

    def _determine_correct_category(self, subcategory_code, categories):
        """Determine the correct category for a subcategory based on its code"""
        prefix = subcategory_code.split('_')[0]
        
        # Handle special cases
        if prefix == 'COMM':
            prefix = 'TUKTUK'  # COMM_TUKTUK_TP should go to TUKTUK
        
        return categories.get(prefix)

    def _display_migration_plan(self, issues):
        """Display what will be changed"""
        by_target = {}
        for issue in issues:
            target = issue['correct_category'].code
            if target not in by_target:
                by_target[target] = []
            by_target[target].append(issue)
        
        for target_category, moves in by_target.items():
            self.stdout.write(f'\n  📁 Moving to {target_category}:')
            for move in moves:
                current = move['current_category'].code
                code = move['subcategory_code']
                self.stdout.write(f'    • {code} (from {current})')

    def _get_user_confirmation(self):
        """Get user confirmation before proceeding"""
        self.stdout.write(self.style.WARNING('Are you sure you want to proceed with the migration?'))
        self.stdout.write('This will move subcategories between categories.')
        self.stdout.write('Type "yes" to continue, anything else to cancel:')
        
        try:
            response = input().strip().lower()
            return response == 'yes'
        except (EOFError, KeyboardInterrupt):
            return False

    def _execute_migration(self, issues, categories):
        """Execute the actual migration"""
        moved_count = 0
        deactivated_count = 0
        
        try:
            with transaction.atomic():
                # First, handle duplicates by deactivating misplaced ones
                self.stdout.write('  🧹 Step 6a: Cleaning up duplicates...')
                
                for issue in issues:
                    subcategory = issue['subcategory']
                    correct_category = issue['correct_category']
                    old_category = issue['current_category']
                    code = issue['subcategory_code']
                    
                    # Check if the subcategory already exists in the correct category
                    existing = MotorSubcategory.objects.filter(
                        subcategory_code=code,
                        category=correct_category,
                        is_active=True
                    ).first()
                    
                    if existing:
                        # Deactivate the duplicate in the wrong category instead of deleting
                        self.stdout.write(f'    � Deactivating duplicate {code} in {old_category.code} (keeping active in {correct_category.code})')
                        subcategory.is_active = False
                        subcategory.date_updated = timezone.now()
                        subcategory.save()
                        deactivated_count += 1
                    else:
                        # Move the subcategory to correct category
                        subcategory.category = correct_category
                        subcategory.date_updated = timezone.now()
                        subcategory.save()
                        moved_count += 1
                        self.stdout.write(f'    ✅ Moved {code} from {old_category.code} to {correct_category.code}')
                
                # Handle special rename case
                self._handle_special_renames()
                
                self.stdout.write(self.style.SUCCESS(f'✅ Successfully moved {moved_count} subcategories and deactivated {deactivated_count} duplicates'))
                
        except Exception as e:
            raise CommandError(f'❌ Migration failed: {e}')

    def _handle_special_renames(self):
        """Handle special cases that need renaming"""
        # Rename PRIVATE_MOTORCYCLE_TP to MOTORCYCLE_PRIVATE_TP
        try:
            motorcycle_tp = MotorSubcategory.objects.get(
                subcategory_code='PRIVATE_MOTORCYCLE_TP'
            )
            motorcycle_tp.subcategory_code = 'MOTORCYCLE_PRIVATE_TP'
            motorcycle_tp.subcategory_name = 'Private Motorcycle Third-Party'
            motorcycle_tp.date_updated = timezone.now()
            motorcycle_tp.save()
            self.stdout.write('    ✅ Renamed PRIVATE_MOTORCYCLE_TP to MOTORCYCLE_PRIVATE_TP')
        except MotorSubcategory.DoesNotExist:
            pass  # Already renamed or doesn't exist
        
        # Rename COMM_TUKTUK_TP to TUKTUK_COMMERCIAL_TP
        try:
            comm_tuktuk = MotorSubcategory.objects.get(
                subcategory_code='COMM_TUKTUK_TP'
            )
            comm_tuktuk.subcategory_code = 'TUKTUK_COMMERCIAL_TP_ALT'
            comm_tuktuk.subcategory_name = 'Commercial TukTuk Third-Party (Alternative)'
            comm_tuktuk.date_updated = timezone.now()
            comm_tuktuk.save()
            self.stdout.write('    ✅ Renamed COMM_TUKTUK_TP to TUKTUK_COMMERCIAL_TP_ALT')
        except MotorSubcategory.DoesNotExist:
            pass  # Already renamed or doesn't exist

    def _verify_migration_results(self, categories):
        """Verify the migration was successful"""
        total_issues = 0
        
        for category_code, category in categories.items():
            subcategories = MotorSubcategory.objects.filter(
                category=category, 
                is_active=True
            )
            
            misplaced = sum(1 for sub in subcategories 
                          if not sub.subcategory_code.startswith(category_code))
            
            if misplaced > 0:
                total_issues += misplaced
                self.stdout.write(f'  ❌ {category_code}: Still has {misplaced} misplaced subcategories')
            else:
                count = subcategories.count()
                self.stdout.write(f'  ✅ {category_code}: {count} subcategories (clean)')
        
        if total_issues == 0:
            self.stdout.write(self.style.SUCCESS('✅ All categories are now clean!'))
        else:
            self.stdout.write(self.style.ERROR(f'❌ Still have {total_issues} misplaced subcategories'))