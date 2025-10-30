# Motor Subcategory Reshuffling Plan for DMVIC Alignment

## Current Issues Identified

### 🚨 Critical Issues Found:
1. **PRIVATE category contains subcategories from ALL other categories** (major data integrity issue)
2. **Cross-contamination**: Commercial, PSV, Motorcycle, TukTuk, and Special subcategories are incorrectly placed in PRIVATE
3. **Missing subcategories**: Some subcategories from the ALLOWED_SUBCATEGORIES list don't exist in database
4. **Inconsistent naming**: Some subcategory names don't match their codes

---

## DMVIC Certificate Type → Category Mapping (Validated ✅)

| DMVIC Cert Type | Category | Expected Subcategories |
|-----------------|----------|----------------------|
| **Type A** | PRIVATE | Private vehicles only |
| **Type B** | COMMERCIAL | Commercial vehicles only |
| **Type C** | PSV | Public Service Vehicles only |
| **Type D** | MOTORCYCLE | Motorcycles only |
| **Type E** | TUKTUK | TukTuk vehicles (can be split between PSV/Commercial) |
| **Type F** | SPECIAL | Special classes (agricultural, institutional, etc.) |

---

## Recommended Subcategory Reshuffling

### 1. PRIVATE Category (Type A) - Clean Up Required ❌

**Current Issues:**
- Contains 19 subcategories (should have ~5)
- Has commercial, PSV, motorcycle, and special subcategories incorrectly assigned

**Recommended PRIVATE subcategories:**
```sql
-- Keep these subcategories in PRIVATE
'PRIVATE_TOR'                    ✅ Keep
'PRIVATE_THIRD_PARTY'            ✅ Keep  
'PRIVATE_THIRD_PARTY_EXT'        ✅ Keep
'PRIVATE_COMPREHENSIVE'          ✅ Keep
'PRIVATE_MOTORCYCLE_TP'          ❌ Move to MOTORCYCLE (this is a motorcycle, not private car)

-- Remove these from PRIVATE (move to correct categories)
'COMMERCIAL_GENERAL_CARTAGE_TP'   → Move to COMMERCIAL
'COMMERCIAL_OWN_GOODS_COMP'       → Move to COMMERCIAL
'COMMERCIAL_OWN_GOODS_TP'         → Move to COMMERCIAL
'COMMERCIAL_TOR'                  → Move to COMMERCIAL
'MOTORCYCLE_PRIVATE_COMP'         → Move to MOTORCYCLE
'PSV_MATATU_1M_TP'               → Move to PSV
'PSV_UBER_COMP'                  → Move to PSV
'SPECIAL_AGRICULTURAL_COMP'       → Move to SPECIAL
'SPECIAL_AGRICULTURAL_TP'         → Move to SPECIAL
'SPECIAL_AMBULANCE_COMP'          → Move to SPECIAL
'SPECIAL_INSTITUTIONAL_TP'        → Move to SPECIAL
'TUKTUK_COMMERCIAL_COMP'          → Move to TUKTUK
'TUKTUK_COMMERCIAL_TP'            → Move to TUKTUK
'TUKTUK_PSV_TP'                   → Move to TUKTUK
```

### 2. COMMERCIAL Category (Type B) - Mostly Correct ✅

**Current subcategories (10):** ✅ Correctly assigned
- All subcategories properly start with 'COMMERCIAL_'
- Tonnage-based pricing models are appropriate
- No cross-contamination detected

**Recommended additions from PRIVATE:**
- Move `COMMERCIAL_GENERAL_CARTAGE_TP` from PRIVATE
- Move `COMMERCIAL_OWN_GOODS_COMP` from PRIVATE  
- Move `COMMERCIAL_OWN_GOODS_TP` from PRIVATE
- Move `COMMERCIAL_TOR` from PRIVATE

### 3. PSV Category (Type C) - Mostly Correct ✅

**Current subcategories (12):** ✅ Correctly assigned
- All subcategories properly start with 'PSV_'
- Passenger-based pricing models are appropriate
- Includes proper TukTuk PSV variants

**Recommended additions from PRIVATE:**
- Move `PSV_MATATU_1M_TP` from PRIVATE
- Move `PSV_UBER_COMP` from PRIVATE

### 4. MOTORCYCLE Category (Type D) - Needs Additions ⚠️

**Current subcategories (6):** ✅ Correctly assigned
- All subcategories properly start with 'MOTORCYCLE_'
- Engine CC-based pricing is appropriate

**Recommended additions from PRIVATE:**
- Move `MOTORCYCLE_PRIVATE_COMP` from PRIVATE
- Move `PRIVATE_MOTORCYCLE_TP` from PRIVATE (rename to `MOTORCYCLE_PRIVATE_TP`)

### 5. TUKTUK Category (Type E) - Needs Additions ⚠️

**Current subcategories (6):** ✅ Correctly assigned
- Mix of PSV and Commercial TukTuk variants
- Proper pricing models (PASSENGER for PSV, FIXED for Commercial)

**Recommended additions from PRIVATE:**
- Move `TUKTUK_COMMERCIAL_COMP` from PRIVATE
- Move `TUKTUK_COMMERCIAL_TP` from PRIVATE
- Move `TUKTUK_PSV_TP` from PRIVATE

### 6. SPECIAL Category (Type F) - Needs Additions ⚠️

**Current subcategories (6):** ✅ Correctly assigned
- All subcategories properly start with 'SPECIAL_'
- Appropriate for special vehicle classes

**Recommended additions from PRIVATE:**
- Move `SPECIAL_AGRICULTURAL_COMP` from PRIVATE
- Move `SPECIAL_AGRICULTURAL_TP` from PRIVATE
- Move `SPECIAL_AMBULANCE_COMP` from PRIVATE
- Move `SPECIAL_INSTITUTIONAL_TP` from PRIVATE

---

## PostgreSQL Migration Script

```sql
-- Fix subcategory category assignments for PostgreSQL
-- WARNING: This will update existing data - backup first!
-- Database: PostgreSQL with UUID primary keys

BEGIN;

-- Store category UUIDs in variables for easier reference
DO $$
DECLARE
    private_id UUID := (SELECT id FROM app_motorcategory WHERE code = 'PRIVATE' AND is_active = true);
    commercial_id UUID := (SELECT id FROM app_motorcategory WHERE code = 'COMMERCIAL' AND is_active = true);
    psv_id UUID := (SELECT id FROM app_motorcategory WHERE code = 'PSV' AND is_active = true);
    motorcycle_id UUID := (SELECT id FROM app_motorcategory WHERE code = 'MOTORCYCLE' AND is_active = true);
    tuktuk_id UUID := (SELECT id FROM app_motorcategory WHERE code = 'TUKTUK' AND is_active = true);
    special_id UUID := (SELECT id FROM app_motorcategory WHERE code = 'SPECIAL' AND is_active = true);
BEGIN
    -- Display current state before migration
    RAISE NOTICE 'Category IDs:';
    RAISE NOTICE 'PRIVATE: %', private_id;
    RAISE NOTICE 'COMMERCIAL: %', commercial_id;
    RAISE NOTICE 'PSV: %', psv_id;
    RAISE NOTICE 'MOTORCYCLE: %', motorcycle_id;
    RAISE NOTICE 'TUKTUK: %', tuktuk_id;
    RAISE NOTICE 'SPECIAL: %', special_id;

    -- 1. Move COMMERCIAL subcategories from PRIVATE to COMMERCIAL
    UPDATE app_motorsubcategory 
    SET category_id = commercial_id,
        date_updated = NOW()
    WHERE subcategory_code IN (
        'COMMERCIAL_GENERAL_CARTAGE_TP',
        'COMMERCIAL_OWN_GOODS_COMP', 
        'COMMERCIAL_OWN_GOODS_TP',
        'COMMERCIAL_TOR'
    ) AND category_id = private_id;
    
    RAISE NOTICE 'Moved % COMMERCIAL subcategories from PRIVATE', GET DIAGNOSTICS_COUNT(ROW_COUNT);

    -- 2. Move PSV subcategories from PRIVATE to PSV  
    UPDATE app_motorsubcategory
    SET category_id = psv_id,
        date_updated = NOW()
    WHERE subcategory_code IN (
        'PSV_MATATU_1M_TP',
        'PSV_UBER_COMP'
    ) AND category_id = private_id;
    
    RAISE NOTICE 'Moved % PSV subcategories from PRIVATE', GET DIAGNOSTICS_COUNT(ROW_COUNT);

    -- 3. Move MOTORCYCLE subcategories from PRIVATE to MOTORCYCLE
    UPDATE app_motorsubcategory
    SET category_id = motorcycle_id,
        date_updated = NOW()
    WHERE subcategory_code IN (
        'MOTORCYCLE_PRIVATE_COMP',
        'PRIVATE_MOTORCYCLE_TP'
    ) AND category_id = private_id;
    
    RAISE NOTICE 'Moved % MOTORCYCLE subcategories from PRIVATE', GET DIAGNOSTICS_COUNT(ROW_COUNT);

    -- 4. Rename PRIVATE_MOTORCYCLE_TP to MOTORCYCLE_PRIVATE_TP for consistency
    UPDATE app_motorsubcategory 
    SET subcategory_code = 'MOTORCYCLE_PRIVATE_TP',
        subcategory_name = 'Private Motorcycle Third-Party',
        date_updated = NOW()
    WHERE subcategory_code = 'PRIVATE_MOTORCYCLE_TP';
    
    RAISE NOTICE 'Renamed PRIVATE_MOTORCYCLE_TP to MOTORCYCLE_PRIVATE_TP';

    -- 5. Move TUKTUK subcategories from PRIVATE to TUKTUK
    UPDATE app_motorsubcategory
    SET category_id = tuktuk_id,
        date_updated = NOW()
    WHERE subcategory_code IN (
        'TUKTUK_COMMERCIAL_COMP',
        'TUKTUK_COMMERCIAL_TP', 
        'TUKTUK_PSV_TP'
    ) AND category_id = private_id;
    
    RAISE NOTICE 'Moved % TUKTUK subcategories from PRIVATE', GET DIAGNOSTICS_COUNT(ROW_COUNT);

    -- 6. Move SPECIAL subcategories from PRIVATE to SPECIAL
    UPDATE app_motorsubcategory
    SET category_id = special_id,
        date_updated = NOW()
    WHERE subcategory_code IN (
        'SPECIAL_AGRICULTURAL_COMP',
        'SPECIAL_AGRICULTURAL_TP',
        'SPECIAL_AMBULANCE_COMP', 
        'SPECIAL_INSTITUTIONAL_TP'
    ) AND category_id = private_id;
    
    RAISE NOTICE 'Moved % SPECIAL subcategories from PRIVATE', GET DIAGNOSTICS_COUNT(ROW_COUNT);

END $$;

-- 7. Verify final state with PostgreSQL-specific aggregation
SELECT 
    c.code as category_code,
    c.name as category_name,
    COUNT(s.id) as subcategory_count,
    STRING_AGG(s.subcategory_code, ', ' ORDER BY s.subcategory_code) as subcategories
FROM app_motorcategory c
LEFT JOIN app_motorsubcategory s ON c.id = s.category_id AND s.is_active = true
WHERE c.is_active = true
GROUP BY c.code, c.name, c.sort_order
ORDER BY c.sort_order;

-- Additional verification: Show what's left in PRIVATE
SELECT 
    'Remaining in PRIVATE' as status,
    subcategory_code,
    subcategory_name
FROM app_motorsubcategory 
WHERE category_id = (SELECT id FROM app_motorcategory WHERE code = 'PRIVATE') 
    AND is_active = true
ORDER BY subcategory_code;

COMMIT;
```

### Alternative Django Management Command Approach

For safer execution, create a Django management command:

```python
# management/commands/fix_subcategory_categories.py
from django.core.management.base import BaseCommand
from django.db import transaction
from app.models import MotorCategory, MotorSubcategory

class Command(BaseCommand):
    help = 'Fix subcategory category assignments for DMVIC compliance'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes will be made'))
        
        # Get category objects
        try:
            categories = {
                'PRIVATE': MotorCategory.objects.get(code='PRIVATE'),
                'COMMERCIAL': MotorCategory.objects.get(code='COMMERCIAL'),
                'PSV': MotorCategory.objects.get(code='PSV'),
                'MOTORCYCLE': MotorCategory.objects.get(code='MOTORCYCLE'),
                'TUKTUK': MotorCategory.objects.get(code='TUKTUK'),
                'SPECIAL': MotorCategory.objects.get(code='SPECIAL'),
            }
        except MotorCategory.DoesNotExist as e:
            self.stdout.write(self.style.ERROR(f'Category not found: {e}'))
            return

        # Define moves
        moves = [
            (['COMMERCIAL_GENERAL_CARTAGE_TP', 'COMMERCIAL_OWN_GOODS_COMP', 
              'COMMERCIAL_OWN_GOODS_TP', 'COMMERCIAL_TOR'], 'COMMERCIAL'),
            (['PSV_MATATU_1M_TP', 'PSV_UBER_COMP'], 'PSV'),
            (['MOTORCYCLE_PRIVATE_COMP', 'PRIVATE_MOTORCYCLE_TP'], 'MOTORCYCLE'),
            (['TUKTUK_COMMERCIAL_COMP', 'TUKTUK_COMMERCIAL_TP', 'TUKTUK_PSV_TP'], 'TUKTUK'),
            (['SPECIAL_AGRICULTURAL_COMP', 'SPECIAL_AGRICULTURAL_TP',
              'SPECIAL_AMBULANCE_COMP', 'SPECIAL_INSTITUTIONAL_TP'], 'SPECIAL'),
        ]

        with transaction.atomic():
            for subcategory_codes, target_category in moves:
                subcategories = MotorSubcategory.objects.filter(
                    subcategory_code__in=subcategory_codes,
                    category=categories['PRIVATE']
                )
                
                count = subcategories.count()
                if count > 0:
                    self.stdout.write(
                        f'Moving {count} subcategories to {target_category}: '
                        f'{list(subcategories.values_list("subcategory_code", flat=True))}'
                    )
                    
                    if not dry_run:
                        subcategories.update(category=categories[target_category])
            
            # Handle rename
            if not dry_run:
                MotorSubcategory.objects.filter(
                    subcategory_code='PRIVATE_MOTORCYCLE_TP'
                ).update(
                    subcategory_code='MOTORCYCLE_PRIVATE_TP',
                    subcategory_name='Private Motorcycle Third-Party'
                )
            
            # Show final state
            self.stdout.write('\nFinal distribution:')
            for code, category in categories.items():
                count = MotorSubcategory.objects.filter(
                    category=category, 
                    is_active=True
                ).count()
                self.stdout.write(f'{code}: {count} subcategories')
```

### Usage:
```bash
# Test first with dry run
python manage.py fix_subcategory_categories --dry-run

# Execute the changes
python manage.py fix_subcategory_categories
```

---

## Post-Migration Validation

### Expected Final Distribution:

| Category | Count | Subcategories |
|----------|-------|---------------|
| **PRIVATE** | 4 | PRIVATE_TOR, PRIVATE_THIRD_PARTY, PRIVATE_THIRD_PARTY_EXT, PRIVATE_COMPREHENSIVE |
| **COMMERCIAL** | 14 | All COMMERCIAL_* subcategories (including moved ones) |
| **PSV** | 14 | All PSV_* subcategories (including moved ones) |
| **MOTORCYCLE** | 8 | All MOTORCYCLE_* subcategories (including moved ones) |
| **TUKTUK** | 9 | All TUKTUK_* subcategories (including moved ones) |
| **SPECIAL** | 10 | All SPECIAL_* subcategories (including moved ones) |

### DMVIC Certificate Validation Logic Update:

```python
def validate_dmvic_certificate_mapping(category_code, certificate_type):
    """
    Validate DMVIC certificate type matches selected category
    Updated mapping after reshuffling
    """
    certificate_mapping = {
        'Type A': ['PRIVATE'],           # Private vehicles only
        'Type B': ['COMMERCIAL'],        # Commercial vehicles only  
        'Type C': ['PSV'],              # Public Service Vehicles only
        'Type D': ['MOTORCYCLE'],       # Motorcycles only
        'Type E': ['TUKTUK'],           # TukTuk (both PSV and Commercial variants)
        'Type F': ['SPECIAL'],          # Special classes
    }
    
    allowed_categories = certificate_mapping.get(certificate_type, [])
    
    if category_code not in allowed_categories:
        raise DMVICValidationError(
            f"DMVIC Certificate {certificate_type} is not valid for {category_code} category. "
            f"Valid categories: {', '.join(allowed_categories)}"
        )
    
    return True
```

---

## Implementation Priority

### High Priority (Fix Data Integrity) 🔴
1. **Execute migration script** to move misplaced subcategories
2. **Update ALLOWED_SUBCATEGORIES** in motor_flow.py to match new structure
3. **Test DMVIC validation** with corrected mappings

### Medium Priority (Enhance UX) 🟡  
1. **Update subcategory names** for better user experience
2. **Review pricing models** to ensure consistency
3. **Update frontend category displays** to reflect clean structure

### Low Priority (Optimization) 🟢
1. **Add validation rules** to prevent future cross-contamination
2. **Create admin interface constraints** for subcategory creation
3. **Add automated tests** for category-subcategory integrity

---

## Risk Assessment

### Risks:
- **Data Migration**: Moving subcategories may affect existing quotations
- **API Dependencies**: Frontend may expect specific subcategory placements
- **Pricing Impact**: Moved subcategories retain their pricing models

### Mitigation:
- **Backup database** before migration
- **Test in staging** environment first
- **Update API responses** simultaneously
- **Monitor frontend** for any breaking changes
- **Rollback plan** available if issues arise

---

## Conclusion

The current subcategory structure has **major data integrity issues** with cross-contamination between categories. The reshuffling plan will:

✅ **Align with DMVIC certificate types perfectly**  
✅ **Fix data integrity issues**  
✅ **Improve user experience**  
✅ **Enable proper certificate validation**  
✅ **Maintain existing functionality**

**Recommendation**: Execute this reshuffling immediately to ensure DMVIC integration works correctly and prevent further data inconsistencies.