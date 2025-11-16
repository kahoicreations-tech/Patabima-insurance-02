# views/motor_flow.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from ..models import (
    MotorCategory,
    MotorSubcategory,
    Underwriter,
    InsuranceProvider,
    MotorPricing,
    CommercialTonnagePricing,
    # ExtendiblePricing removed - using InsuranceProvider.features.pricing
)
from app.services.subcategory_resolver import resolve_subcategory_code
from ..serializers import MotorCategorySerializer
from datetime import datetime, timedelta
from decimal import Decimal


# Strict allow-list of canonical subcategories per category for public listing
# This reflects the simplified products we want agents/customers to pick from in the UI
# Extend as needed for COMMERCIAL, PSV, MOTORCYCLE, TUKTUK, SPECIAL
ALLOWED_SUBCATEGORIES = {
    'PRIVATE': [
        'PRIVATE_TOR',
        'PRIVATE_THIRD_PARTY',
        'PRIVATE_THIRD_PARTY_EXT',
        'PRIVATE_MOTORCYCLE_TP',
        'PRIVATE_COMPREHENSIVE',
    ],
    'COMMERCIAL': [
        # Third Party (9)
        'COMMERCIAL_TOR',
        'COMMERCIAL_OWN_GOODS_TP',
        'COMMERCIAL_OWN_GOODS_TP_EXT',
        'COMMERCIAL_GENERAL_CARTAGE_TP',
        'COMMERCIAL_GENERAL_CARTAGE_TP_EXT',
        'COMMERCIAL_GENERAL_CARTAGE_TP_PM',
        'COMMERCIAL_GENERAL_CARTAGE_TP_EXT_PM',
        # Comprehensive (3)
        'COMMERCIAL_GENERAL_CARTAGE_COMP',
        'COMMERCIAL_OWN_GOODS_COMP',
    ],
    'PSV': [
        # Third Party – PSV (10)
        'PSV_UBER_TP',                    # PSV Uber Third-Party
        'PSV_TUKTUK_TP',                  # PSV Tuk-Tuk Third-Party
        'PSV_TUKTUK_TP_EXT',              # PSV Tuk-Tuk Third-Party Extendible
        'PSV_MATATU_1M_TP',               # 1 Month PSV Matatu Third-Party
        'PSV_MATATU_2WKS_TP',             # 2 Weeks PSV Matatu Third-Party
        'PSV_UBER_TP_EXT',                # PSV Uber Third-Party Extendible
        'PSV_TOUR_VAN_TP',                # PSV Tour Van Third-Party
        'PSV_MATATU_1WK_TP_EXT',          # 1 week PSV Matatu-third party Extendible
        'PSV_PLAIN_TPO',                  # PSV Plain TPO
        'PSV_TOUR_VAN_TP_EXT',            # PSV Tour Van Third-party Extendible
        # Comprehensive (2)
        'PSV_UBER_COMP',                  # PSV Uber Comprehensive
        'PSV_TOUR_VAN_COMP',              # PSV Tour Van Comprehensive
    ],
    'MOTORCYCLE': [
        # Third Party (3)
        'MOTORCYCLE_PRIVATE_TP',
        'MOTORCYCLE_PSV_TP',
        'MOTORCYCLE_PSV_TP_6M',
        # Comprehensive (3)
        'MOTORCYCLE_PRIVATE_COMP',
        'MOTORCYCLE_PSV_COMP',
        'MOTORCYCLE_PSV_COMP_6M',
    ],
    'TUKTUK': [
        # Third Party (4)
        'TUKTUK_PSV_TP',
        'TUKTUK_PSV_TP_EXT',
        'TUKTUK_COMMERCIAL_TP',
        'TUKTUK_COMMERCIAL_TP_EXT',
        # Comprehensive (2)
        'TUKTUK_COMMERCIAL_COMP',
        'TUKTUK_PSV_COMP',
    ],
    'SPECIAL': [
        # Third Party (4)
        'SPECIAL_AGRICULTURAL_TP',
        'SPECIAL_INSTITUTIONAL_TP',
        'SPECIAL_INSTITUTIONAL_TP_EXT',
        'SPECIAL_KG_PLATE_TP',
        'SPECIAL_DRIVING_SCHOOL_TP',
        # Comprehensive (5)
        'SPECIAL_AGRICULTURAL_COMP',
        'SPECIAL_INSTITUTIONAL_COMP',
        'SPECIAL_DRIVING_SCHOOL_COMP',
        'SPECIAL_FUEL_TANKER_COMP',
        'SPECIAL_AMBULANCE_COMP',
    ],
}


@api_view(['GET'])
@permission_classes([AllowAny])
def get_motor_categories(request):
    """
    Get all active motor categories for the simplified flow
    """
    categories = MotorCategory.objects.filter(is_active=True).order_by('sort_order')
    serialized = MotorCategorySerializer(categories, many=True)
    
    return Response({
        'categories': serialized.data,
        'total_count': categories.count()
    })


# get_cover_types function removed - use get_subcategories instead
# This endpoint is deprecated as part of the subcategory-only approach


@api_view(['GET'])
@permission_classes([AllowAny])
def get_subcategories(request):
    """
    Get subcategories for a specific category (canonical product list going forward).

    Query params:
      - category: category code (e.g., PRIVATE, COMMERCIAL)
      - active_only: default true

    Response shape:
      { category: {...}, subcategories: [ { subcategory_code, subcategory_name, product_type, pricing_model } ] }
    """
    category_code = request.GET.get('category') or request.GET.get('category_code')
    if not category_code:
        return Response({'error': 'Category parameter required'}, status=400)

    active_only = request.GET.get('active_only', 'true').lower() != 'false'
    curated_only = request.GET.get('curated_only', 'true').lower() != 'false'
    try:
        category = MotorCategory.objects.get(code=category_code, is_active=True)
    except MotorCategory.DoesNotExist:
        return Response({'error': 'Category not found'}, status=404)

    qs = MotorSubcategory.objects.filter(category=category)
    if active_only and hasattr(qs, 'filter'):
        qs = qs.filter(is_active=True)
    # Prefer DB-managed visibility when curated_only=true
    if curated_only:
        qs = qs.filter(show_in_public=True).order_by('public_sort_order', 'subcategory_name')
    else:
        qs = qs.order_by('subcategory_name')

    results = []
    for s in qs:
        # Build item strictly from MotorSubcategory (MotorCoverType deprecated)
        item = {
            'subcategory_code': s.subcategory_code,
            'subcategory_name': s.subcategory_name,
            'product_type': (s.product_type or ''),
            'pricing_model': (s.pricing_model or ''),
        }
        # Prefer a human-readable display_name for UI (avoid underscore codes)
        display_name = (
            s.subcategory_name
            or str(s.subcategory_code or '').replace('_', ' ').title()
        )
        item['display_name'] = display_name
        # For public listing, also surface the friendly name as subcategory_name
        item['subcategory_name'] = display_name
        results.append(item)

    # Enforce strict output filtering to avoid cross-category leakage or legacy entries
    # If curated_only and DB flags returned zero (older DBs), fall back to allowlist/prefix
    filtered = results
    if curated_only:
        if not results:
            allow = ALLOWED_SUBCATEGORIES.get(category_code.upper())
            if allow:
                allow_set = set([c.upper() for c in allow])
                filtered = [it for it in results if str(it.get('subcategory_code', '')).upper() in allow_set]
            else:
                prefix = f"{category_code.upper()}_"
                filtered = [it for it in results if str(it.get('subcategory_code', '')).upper().startswith(prefix)]
    else:
        # Non-curated listing shows all category-prefixed active items
        prefix = f"{category_code.upper()}_"
        filtered = [it for it in results if str(it.get('subcategory_code', '')).upper().startswith(prefix)]

    # Sort listing: Third Party group first, then Comprehensive
    # Group includes THIRD_PARTY, THIRD_PARTY_EXT, PLAIN_TPO, ACT_ONLY, TOR
    priority_map = {
        'THIRD_PARTY': 1,
        'THIRD_PARTY_EXT': 2,
        'PLAIN_TPO': 3,
        'ACT_ONLY': 3,
        'TOR': 4,
        'COMPREHENSIVE': 4,
    }

    def sort_key(item: dict):
        kind = str(item.get('product_type') or '').upper()
        pri = priority_map.get(kind, 99)
        # If we have sort_order from subcategory, use it next; then fallback to name
        so = item.get('sort_order')
        so_val = so if isinstance(so, int) else (int(so) if isinstance(so, str) and so.isdigit() else 999)
        label = (item.get('display_name') or item.get('subcategory_name') or item.get('name') or '').upper()
        return (pri, so_val, label)

    # Only sort if not already using DB explicit sort field, but safe to re-apply stable sort
    filtered = sorted(filtered, key=sort_key)

    return Response({
        'category': MotorCategorySerializer(category).data,
        'subcategories': filtered,
        'total_count': len(filtered),
        'curated_only': curated_only,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_field_requirements(request):
    """
    Get complete field requirements for a specific product (category + subcategory)
    """
    category_code = request.GET.get('category') or request.GET.get('category_code')
    subcategory_code = request.GET.get('subcategory_code') or request.GET.get('subcategory')
    
    if not category_code:
        return Response({'error': 'Category parameter required'}, status=400)
        
    if not subcategory_code:
        return Response({'error': 'Subcategory parameter required'}, status=400)
    
    try:
        category = MotorCategory.objects.get(code=category_code, is_active=True)
        cover_kind = None  # TOR | THIRD_PARTY | THIRD_PARTY_EXT | COMPREHENSIVE

        # Get subcategory directly
        sub = MotorSubcategory.objects.filter(
            category=category,
            subcategory_code=subcategory_code,
            is_active=True
        ).first()
        
        if not sub:
            return Response({'error': f'Subcategory {subcategory_code} not found for category {category_code}'}, status=400)
            
        cover_kind = (sub.product_type or '').upper()
        
        # Build complete requirements combining category and cover type
        # Compute dynamic year bounds based on category rules
        current_year = datetime.now().year
        max_year = current_year
        min_year = max(current_year - (category.max_vehicle_age or 35), 1950)

        requirements = {
            'core_fields': {
                'financial_interest': {
                    'type': 'radio',
                    'required': True,
                    'options': ['YES', 'NO'],
                    'label': 'Financial Interest'
                },
                'vehicle_identification_method': {
                    'type': 'radio',
                    'required': True,
                    'options': ['REGISTRATION', 'CHASSIS'],
                    'label': 'Vehicle Identification Method'
                },
                'registration_number': {
                    'type': 'text',
                    'required': True,
                    'label': 'Registration Number',
                    'validation': 'kenyan_registration'
                },
                'vehicle_make': {
                    'type': 'dropdown',
                    'required': True,
                    'label': 'Vehicle Make',
                    'data_source': 'vehicle_makes'
                },
                'vehicle_model': {
                    'type': 'dropdown',
                    'required': True,
                    'label': 'Vehicle Model',
                    'data_source': 'vehicle_models',
                    'depends_on': 'vehicle_make'
                },
                'year_of_manufacture': {
                    'type': 'dropdown',
                    'required': True,
                    'label': 'Year of Manufacture',
                    'min_year': min_year,
                    'max_year': max_year
                },
                'cover_start_date': {
                    'type': 'date',
                    'required': True,
                    'label': 'Cover Start Date',
                    'min_date': 'today',
                    # Enforce business rule: no backdating, max 30 days forward
                    'max_date': 'today+30d',
                    'validation': {
                        'no_backdating': True,
                        'max_days_forward': 30,
                        'default_policy_term_days': 365
                    }
                }
            },
            'category_fields': {},
            'cover_type_fields': {},
            'payment_fields': {
                'payment_provider': {
                    'type': 'radio',
                    'required': True,
                    'options': ['MPESA', 'DPO_PAY'],
                    'label': 'Payment Method'
                },
                'phone_number': {
                    'type': 'tel',
                    'required': True,
                    'label': 'Phone Number',
                    'validation': 'kenyan_mobile'
                }
            },
            'kyc_fields': {
                'national_id': {
                    'type': 'file_upload',
                    'required': True,
                    'label': 'National ID',
                    'accepted_formats': ['pdf', 'jpg', 'png']
                },
                'kra_pin': {
                    'type': 'file_upload',
                    'required': True,
                    'label': 'KRA PIN Certificate',
                    'accepted_formats': ['pdf', 'jpg', 'png']
                },
                'logbook': {
                    'type': 'file_upload',
                    'required': True,
                    'label': 'Vehicle Logbook',
                    'accepted_formats': ['pdf', 'jpg', 'png']
                }
            }
        }
        
        # Add category/cover specific fields (OR logic: category-level OR cover-type level)
        if category.requires_tonnage:
            requirements['category_fields']['tonnage'] = {
                'type': 'number',
                'required': True,
                'label': 'Vehicle Tonnage',
                'min': 0,
                'max': 31,
                'unit': 'tons'
            }
            
        if category.requires_engine_capacity:
            requirements['category_fields']['engine_capacity'] = {
                'type': 'number',
                'required': True,
                'label': 'Engine Capacity',
                'min': 50,
                'max': 2000,
                'unit': 'cc'
            }
            
        if category.requires_passenger_count:
            requirements['category_fields']['passenger_count'] = {
                'type': 'number',
                'required': True,
                'label': 'Number of Passengers',
                'min': 1,
                'max': 100
            }
            
        if category.requires_passenger_type:
            requirements['category_fields']['passenger_type'] = {
                'type': 'dropdown',
                'required': True,
                'label': 'Passenger Type',
                'options': ['ADULTS', 'STUDENTS', 'MIXED']
            }
        
        if getattr(category, 'requires_carrying_capacity', False):
            requirements['category_fields']['carrying_capacity'] = {
                'type': 'number',
                'required': True,
                'label': 'Carrying Capacity',
                'min': 0,
                'unit': 'kg'
            }
        
        # Add cover-specific fields (derived from sub.product_type or legacy cover_type)
        if (cover_kind or '') == 'COMPREHENSIVE':
            requirements['cover_type_fields'].update({
                'vehicle_valuation': {
                    'type': 'number',
                    'required': True,
                    'label': 'Vehicle Valuation',
                    'min': None,
                    'max': None
                },
                'windscreen_value': {
                    'type': 'number',
                    'required': False,
                    'label': 'Windscreen Value',
                    'min': 0,
                    'max': 100000
                },
                'radio_value': {
                    'type': 'number',
                    'required': False,
                    'label': 'Radio/Cassette Value',
                    'min': 0,
                    'max': 50000
                }
            })
            
            if True:  # optional add-ons generally supported for comprehensive
                requirements['cover_type_fields']['optional_addons'] = {
                    'type': 'checkbox_group',
                    'required': False,
                    'label': 'Optional Add-ons',
                    'options': [
                        {'value': 'excess_protector', 'label': 'Excess Protector'},
                        {'value': 'political_violence', 'label': 'Political Violence & Terrorism'},
                        {'value': 'riot_strike', 'label': 'Riot, Strike & Malicious Damage'}
                    ]
                }
        
        return Response({
            'category': MotorCategorySerializer(category).data,
            'subcategory': {'code': subcategory_code, 'product_type': cover_kind},
            'field_requirements': requirements
        })
        
    except (MotorCategory.DoesNotExist, MotorSubcategory.DoesNotExist):
        return Response({'error': 'Category or product not found'}, status=404)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_underwriters(request):
    """
    Public endpoint to list available underwriters. Supports optional filters:
    - category_code: filter by supported_categories containing this code
    - active_only: default True
    """
    category_code = request.GET.get('category') or request.GET.get('category_code')
    active_only = request.GET.get('active_only', 'true').lower() != 'false'

    try:
        # Prefer the canonical InsuranceProvider model; Underwriter is legacy
        qs = InsuranceProvider.objects.all()
        if active_only:
            qs = qs.filter(is_active=True)
        if category_code:
            try:
                qs = qs.filter(supported_categories__contains=[category_code])
            except Exception:
                qs = [u for u in qs if isinstance(u.supported_categories, list) and category_code in u.supported_categories]

        has_any = qs.exists() if hasattr(qs, 'exists') else len(list(qs)) > 0
    except Exception:
        has_any = False
        qs = []

    if not has_any:
        fallback = [
            { 'name': 'CIC Insurance', 'code': 'CIC', 'rating': 4.6, 'supported_categories': ['PRIVATE','COMMERCIAL','PSV','MOTORCYCLE','TUKTUK','SPECIAL'] },
            { 'name': 'APA Insurance', 'code': 'APA', 'rating': 4.4, 'supported_categories': ['PRIVATE','COMMERCIAL','PSV','MOTORCYCLE'] },
            { 'name': 'Britam', 'code': 'BRITAM', 'rating': 4.3, 'supported_categories': ['PRIVATE','COMMERCIAL','PSV'] },
            { 'name': 'Jubilee Insurance', 'code': 'JUBILEE', 'rating': 4.2, 'supported_categories': ['PRIVATE','COMMERCIAL'] },
        ]
        return Response({ 'underwriters': fallback, 'count': len(fallback), 'source': 'fallback' })

    results = []
    for u in qs:
        results.append({
            'name': u.name if hasattr(u, 'name') else getattr(u, 'company_name', ''),
            'code': u.code if hasattr(u, 'code') else getattr(u, 'company_code', ''),
            'rating': float(getattr(u, 'rating', 0.0) or 0.0),
            'supported_categories': u.supported_categories or [],
        })
    return Response({ 'underwriters': results, 'count': len(results), 'source': 'database' })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_addons(request):
    """
    Public endpoint to list available add-ons for a given product.
    Optional underwriter-specific overrides when underwriter_code is provided.

    Query params:
      - category: category code (e.g., PRIVATE, COMMERCIAL)
      - cover_type: cover type code (subcategory code, e.g., PRIVATE_COMPREHENSIVE)
      - underwriter_code: optional underwriter short code (e.g., CIC)

    Returns shape:
      { addons: [ { id, name, pricing_type, base_rate, minimum_premium, calculation_base, ... } ] }
    """
    category_code = request.GET.get('category') or request.GET.get('category_code')
    cover_type_code = request.GET.get('cover_type') or request.GET.get('subcategory_code')
    underwriter_code = request.GET.get('underwriter_code') or request.GET.get('underwriter')

    # If not comprehensive (by cover type naming), most add-ons aren't applicable
    is_comprehensive = False
    try:
        if cover_type_code:
            # Resolve to subcategory and determine based on its product_type only
            sub_code = resolve_subcategory_code(subcategory_code=cover_type_code, cover_type_code=cover_type_code)
            sub = MotorSubcategory.objects.filter(subcategory_code=sub_code).first()
            if sub:
                is_comprehensive = (sub.product_type or '').upper() == 'COMPREHENSIVE'
    except Exception:
        pass

    # Standard default add-ons (aligned with frontend AddonCalculationService)
    default_addons = [
        {
            'id': 'excess_protector',
            'name': 'Excess Protector',
            'description': 'Covers the excess amount in case of a claim',
            'pricing_type': 'PERCENTAGE',
            'base_rate': 0.0025,
            'minimum_premium': 3000,
            'calculation_base': 'sum_insured',
            'conditional': False,
            'applicable_to': ['COMPREHENSIVE'],
            'category': 'protection',
        },
        {
            'id': 'political_violence_terrorism',
            'name': 'Political Violence & Terrorism (PVT)',
            'description': 'Covers damage from political violence and terrorism',
            'pricing_type': 'PERCENTAGE',
            'base_rate': 0.0025,
            'minimum_premium': 2500,
            'calculation_base': 'sum_insured',
            'conditional': False,
            'applicable_to': ['COMPREHENSIVE'],
            'category': 'protection',
        },
        {
            'id': 'loss_of_use',
            'name': 'Loss of Use',
            'description': 'Daily compensation when vehicle is being repaired',
            'pricing_type': 'FIXED',
            'base_rate': 3000,
            'maximum_limit': 30000,
            'calculation_base': 'fixed',
            'conditional': False,
            'applicable_to': ['COMPREHENSIVE'],
            'category': 'benefits',
        },
        {
            'id': 'windscreen_cover',
            'name': 'Windscreen Cover',
            'description': 'Extended windscreen replacement coverage',
            'pricing_type': 'PERCENTAGE',
            'base_rate': 0.10,
            'minimum_value_threshold': 30000,
            'calculation_base': 'windscreen_value',
            'conditional': True,
            'applicable_to': ['COMPREHENSIVE'],
            'category': 'accessories',
        },
        {
            'id': 'radio_cover',
            'name': 'Radio/Cassette Cover',
            'description': 'Audio system replacement coverage',
            'pricing_type': 'PERCENTAGE',
            'base_rate': 0.10,
            'minimum_value_threshold': 30000,
            'calculation_base': 'radio_cassette_value',
            'conditional': True,
            'applicable_to': ['COMPREHENSIVE'],
            'category': 'accessories',
        },
    ]

    # If not comprehensive, return empty set (can be extended per product rules)
    if not is_comprehensive:
        return Response({ 'addons': [], 'source': 'default', 'applicability': 'non-comprehensive' })

    # Attempt underwriter-specific overrides from features if available
    overrides = {}
    minimums = {}
    try:
        if underwriter_code:
            uw = InsuranceProvider.objects.filter(code=underwriter_code).first()
            if uw and isinstance(uw.features, dict):
                overrides = uw.features.get('addon_rates', {}) or {}
                minimums = uw.features.get('minimum_premiums', {}) or {}
    except Exception:
        pass

    # Apply overrides to defaults by id
    result = []
    for item in default_addons:
        data = dict(item)
        rate_override = overrides.get(item['id'])
        if isinstance(rate_override, (int, float)):
            data['base_rate'] = float(rate_override)
        min_override = minimums.get(item['id'])
        if isinstance(min_override, (int, float)):
            data['minimum_premium'] = float(min_override)
        result.append(data)

    return Response({
        'addons': result,
        'source': 'underwriter' if underwriter_code and (overrides or minimums) else 'default',
        'category': category_code,
        'cover_type': cover_type_code,
        'underwriter_code': underwriter_code,
    })


def _compute_base_premium_simple(category_code: str, subcategory_code: str, payload: dict) -> Decimal:
    """Very simple deterministic base premium logic to unblock UI until full rating tables are wired."""
    subcategory = (subcategory_code or '').upper()
    category = (category_code or '').upper()
    # Defaults
    base = Decimal('0')
    
    # Map subcategory to product type for simple calculation
    if 'THIRD_PARTY' in subcategory and 'EXT' not in subcategory:
        # Basic Third Party
        base = Decimal('3500') if category == 'PRIVATE' else Decimal('4000')
    elif 'THIRD_PARTY_EXT' in subcategory or 'TP_EXT' in subcategory:
        # Third Party Extended
        base = Decimal('4500') if category == 'PRIVATE' else Decimal('5000')
    elif 'TOR' in subcategory:
        # Time on Risk — scale linearly by days; default 30 days
        days = int(payload.get('duration_days') or payload.get('days') or 30)
        # Baseline 1500 per 30 days for private, 2000 for others
        per30 = Decimal('1500') if category == 'PRIVATE' else Decimal('2000')
        base = (per30 * Decimal(days) / Decimal(30)).quantize(Decimal('1.00'))
    elif 'COMPREHENSIVE' in subcategory:
        # Use a naive 3% of sum insured with min 15,000 for private; 3.5% for others as placeholder
        si = Decimal(str(payload.get('sum_insured') or payload.get('vehicle_valuation') or '0'))
        rate = Decimal('0.030') if category == 'PRIVATE' else Decimal('0.035')
        base = (si * rate).quantize(Decimal('1.00'))
        if base < Decimal('15000'):
            base = Decimal('15000')
    # Ensure non-negative
    return base if base >= 0 else Decimal('0')


def _normalize_subcategory_aliases(code: str) -> list[str]:
    """Return a list of reasonable alias keys for a given subcategory code.
    This makes provider.features.pricing tolerant to variations like TP vs THIRD_PARTY,
    TP_EXT vs THIRD_PARTY_EXT, COMP vs COMPREHENSIVE, etc.
    """
    c = (code or "").upper().strip()
    aliases = {c}
    # Variants for THIRD_PARTY
    if "THIRD_PARTY_EXT" in c:
        aliases.add(c.replace("THIRD_PARTY_EXT", "TP_EXT"))
        aliases.add(c.replace("THIRD_PARTY_EXT", "THIRD_PARTY-EXT"))
        aliases.add(c.replace("THIRD_PARTY_EXT", "THIRD-PARTY-EXT"))
    if "TP_EXT" in c:
        aliases.add(c.replace("TP_EXT", "THIRD_PARTY_EXT"))
    if "THIRD_PARTY" in c and "EXT" not in c:
        aliases.add(c.replace("THIRD_PARTY", "TP"))
    if "_TP" in c and "_EXT" not in c:
        aliases.add(c.replace("_TP", "_THIRD_PARTY"))
    # Variants for COMPREHENSIVE
    if "COMPREHENSIVE" in c:
        aliases.add(c.replace("COMPREHENSIVE", "COMP"))
    if "_COMP" in c:
        aliases.add(c.replace("_COMP", "_COMPREHENSIVE"))
    # Some historical typos we've seen (IP instead of TP)
    if "_IP" in c:
        aliases.add(c.replace("_IP", "_TP"))
        aliases.add(c.replace("_IP", "_THIRD_PARTY"))
    return list(aliases)


def _find_pricing_entry(pricing_map: dict, subcategory_code: str) -> dict | None:
    """Find a pricing entry in features.pricing that matches the given subcategory code,
    trying common alias spellings and doing a case-insensitive key match.
    """
    if not isinstance(pricing_map, dict):
        return None
    # 1) Exact match first (original case)
    if subcategory_code in pricing_map:
        entry = pricing_map.get(subcategory_code)
        return entry if isinstance(entry, dict) else None
    # 2) Case-insensitive exact match
    target_upper = (subcategory_code or "").upper()
    for k, v in pricing_map.items():
        if isinstance(v, dict) and str(k).upper() == target_upper:
            return v
    # 3) Try alias keys
    for alias in _normalize_subcategory_aliases(subcategory_code):
        if alias in pricing_map and isinstance(pricing_map[alias], dict):
            return pricing_map[alias]
        # Case-insensitive compare for alias too
        alias_upper = alias.upper()
        for k, v in pricing_map.items():
            if isinstance(v, dict) and str(k).upper() == alias_upper:
                return v
    return None


def _compute_underwriter_premium(underwriter_code: str, category_code: str, subcategory_code: str, payload: dict) -> Decimal:
    """Calculate premium using underwriter-specific pricing data.
    Only uses configured underwriter.features.pricing; does not fallback to simple estimates.
    """
    try:
        # Get underwriter
        underwriter = InsuranceProvider.objects.get(code=underwriter_code)

        # Get subcategory for product identification
        subcategory = MotorSubcategory.objects.filter(
            category__code=category_code,
            subcategory_code=subcategory_code
        ).first()

        if not subcategory:
            raise ValueError('Unknown subcategory code for category')

        # Get pricing from underwriter features
        pricing_features = underwriter.features.get('pricing', {}) if underwriter.features else {}
        product_pricing = _find_pricing_entry(pricing_features, subcategory_code)
        if not isinstance(product_pricing, dict):
            # No configured pricing for this product in underwriter features
            raise ValueError('Missing underwriter.features.pricing for code')

        pricing_type = product_pricing.get('pricing_type', 'fixed')

        if pricing_type == 'fixed':
            # Fixed premium (TOR, Third Party, etc.)
            base_premium = Decimal(str(product_pricing.get('base_premium', 0)))

            # Adjust for duration if TOR
            if 'TOR' in subcategory_code.upper():
                days = int(payload.get('duration_days') or payload.get('policy_term_days') or 30)
                base_premium = (base_premium * Decimal(days) / Decimal(30)).quantize(Decimal('1.00'))

        elif pricing_type == 'percentage':
            # Percentage-based (Comprehensive)
            rate = Decimal(str(product_pricing.get('rate', 0)))
            min_premium = Decimal(str(product_pricing.get('min_premium', 0)))
            sum_insured = Decimal(str(
                payload.get('sum_insured')
                or payload.get('vehicle_value')
                or payload.get('vehicle_valuation')
                or '0'
            ))

            if sum_insured > 0 and rate > 0:
                base_premium = (sum_insured * rate).quantize(Decimal('1.00'))
                if min_premium and base_premium < min_premium:
                    base_premium = min_premium
            else:
                # If required inputs missing, treat as not computable from features
                raise ValueError('Insufficient inputs for percentage pricing')
        else:
            # Unknown pricing type
            raise ValueError('Unsupported pricing_type in features')

        return base_premium

    except (InsuranceProvider.DoesNotExist, MotorSubcategory.DoesNotExist, ValueError):
        # Surface failure to the caller so it can try DB pricing or skip
        raise


def _compute_premium_from_db(underwriter_code: str, category_code: str, product_code: str, payload: dict):
    """Compute premium using DB pricing tables (MotorPricing / CommercialTonnagePricing).
    Returns Decimal on success, or None if no suitable pricing row exists.
    """
    try:
        uw = InsuranceProvider.objects.get(code=underwriter_code)
    except InsuranceProvider.DoesNotExist:
        return None

    sub = MotorSubcategory.objects.filter(
        category__code=str(category_code).upper(),
        subcategory_code=str(product_code).upper(),
        is_active=True,
    ).first()
    if not sub:
        return None

    # TONNAGE-BASED: Commercial/Special etc.
    if (sub.pricing_model or '').upper() == 'TONNAGE':
        try:
            ton = float(payload.get('tonnage'))
        except Exception:
            return None
        qs = CommercialTonnagePricing.objects.filter(
            subcategory=sub,
            underwriter=uw,
            is_active=True,
        )
        # Match range
        match = None
        for row in qs.order_by('tonnage_from'):
            if row.tonnage_to is None:
                if ton >= float(row.tonnage_from):
                    match = row
                    break
            else:
                if float(row.tonnage_from) <= ton <= float(row.tonnage_to):
                    match = row
                    break
        return Decimal(str(match.base_premium)) if match else None

    # PASSENGER-BASED: PSV variants
    if (sub.pricing_model or '').upper() == 'PASSENGER':
        # Treat as fixed base if MotorPricing exists; extensions handled via features elsewhere
        mp = MotorPricing.objects.filter(
            subcategory=sub,
            underwriter=uw,
            is_active=True,
        ).order_by('-effective_from').first()
        return Decimal(str(mp.base_premium)) if mp and mp.base_premium is not None else None

    # ENGINE_CC-based: Motorcycle
    if (sub.pricing_model or '').upper() == 'ENGINE_CC':
        mp = MotorPricing.objects.filter(
            subcategory=sub,
            underwriter=uw,
            is_active=True,
        ).order_by('-effective_from').first()
        return Decimal(str(mp.base_premium)) if mp and mp.base_premium is not None else None

    # COMPREHENSIVE and others: try MotorPricing with percentage via pricing_factors or bracket_pricing
    mp = MotorPricing.objects.filter(
        subcategory=sub,
        underwriter=uw,
        is_active=True,
    ).order_by('-effective_from').first()
    if not mp:
        return None
    # Decide computation
    si = Decimal(str(
        payload.get('sum_insured')
        or payload.get('vehicle_value')
        or payload.get('vehicle_valuation')
        or '0'
    ))
    if mp.bracket_pricing and si > 0:
        # Expect structure like {"rate": 0.03, "min": 15000} or list of brackets
        bp = mp.bracket_pricing
        if isinstance(bp, dict) and 'rate' in bp:
            rate = Decimal(str(bp.get('rate', 0)))
            min_p = Decimal(str(bp.get('min', 0)))
            base = (si * rate).quantize(Decimal('1.00'))
            return base if base >= min_p else min_p
        elif isinstance(bp, list):
            # Find matching bracket by sum insured
            chosen = None
            for b in bp:
                frm = Decimal(str(b.get('min', '0')))
                to = Decimal(str(b.get('max', '0')))
                rate = Decimal(str(b.get('rate', '0')))
                # If max is missing/null, treat as open-ended
                if frm <= si <= (to if to > 0 else si):
                    chosen = (rate, Decimal(str(b.get('min_premium', '0'))))
                    break
            if chosen:
                rate, min_p = chosen
                base = (si * rate).quantize(Decimal('1.00'))
                return base if base >= min_p else min_p
    # Fixed base_premium as last resort for this subcategory within DB-defined pricing
    if mp.base_premium is not None:
        return Decimal(str(mp.base_premium))
    return None


def _apply_mandatory_levies(base: Decimal) -> dict:
    itl = (base * Decimal('0.0025')).quantize(Decimal('1.00'))
    pcf = (base * Decimal('0.0025')).quantize(Decimal('1.00'))
    stamp = Decimal('40.00') if base > 0 else Decimal('0.00')
    total_levies = (itl + pcf + stamp).quantize(Decimal('1.00'))
    total = (base + total_levies).quantize(Decimal('1.00'))
    return {
        'base_premium': float(base),
        'training_levy': float(itl),
        'pcf_levy': float(pcf),
        'stamp_duty': float(stamp),
        'total_levies': float(total_levies),
        'total_premium': float(total),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def calculate_premium(request):
    """
    Public motor premium calculation with essential validations.
    Expected JSON body includes:
    - category (code), subcategory (code), cover_start_date (YYYY-MM-DD)
    - Optional: duration_days (for TOR), sum_insured (for COMPREHENSIVE), underwriter_code
    """
    data = request.data or {}
    # Extract required parameters
    category_code = data.get('category') or data.get('category_code') or 'PRIVATE'
    subcategory_code = data.get('subcategory') or data.get('subcategory_code')
    
    # Require explicit subcategory
    if not subcategory_code:
        return Response({
            'error': 'Missing required parameter: subcategory',
            'message': 'Please provide subcategory (e.g., PRIVATE_THIRD_PARTY, PRIVATE_COMPREHENSIVE, PRIVATE_TOR)'
        }, status=400)
    start_date_str = data.get('cover_start_date') or data.get('start_date')

    # Handle start date: default to today if not provided (still enforce forward limit when provided)
    today = datetime.now().date()
    if start_date_str:
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        except Exception:
            return Response({'error': 'cover_start_date must be in YYYY-MM-DD format'}, status=400)
        if start_date < today:
            return Response({'error': 'Backdating not allowed. Choose today or a future date.'}, status=400)
        if start_date > today + timedelta(days=30):
            return Response({'error': 'Cover start date cannot be more than 30 days in the future.'}, status=400)
    else:
        start_date = today

    # Policy term: allow multiple shapes, fallback to 365 days
    policy_term_days = None
    # Explicit days
    if data.get('policy_term_days') is not None:
        try:
            policy_term_days = int(data.get('policy_term_days'))
        except Exception:
            policy_term_days = None
    # Months-based inputs (e.g., 12, 6, 3)
    if policy_term_days is None:
        months = (
            data.get('policy_term_months')
            or data.get('coverage_months')
            or data.get('coverage_period_months')
        )
        if months is not None:
            try:
                policy_term_days = int(months) * 30
            except Exception:
                policy_term_days = None
    # TOR-style duration
    if policy_term_days is None and data.get('duration_days') is not None:
        try:
            policy_term_days = int(data.get('duration_days'))
        except Exception:
            policy_term_days = None
    if policy_term_days is None or policy_term_days <= 0:
        policy_term_days = 365

    end_date = start_date + timedelta(days=policy_term_days)

    # Compute base premium: prefer underwriter-specific pricing when underwriter_code is provided
    uw_code = data.get('underwriter_code') or data.get('underwriter')
    if uw_code:
        try:
            base = _compute_underwriter_premium(str(uw_code).upper(), category_code, subcategory_code, data)
        except Exception:
            # Fallback to simple placeholder if underwriter-specific calc fails
            base = _compute_base_premium_simple(category_code, subcategory_code, data)
    else:
        # Simple deterministic baseline when no underwriter is specified
        base = _compute_base_premium_simple(category_code, subcategory_code, data)
    breakdown = _apply_mandatory_levies(base)

    result = {
        'category': category_code,
        'subcategory': subcategory_code,
        'underwriter_code': uw_code,
        'policy_term': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'duration_days': policy_term_days,
        },
        'premium_breakdown': breakdown,
        # Top-level fields to satisfy various client normalizers
        'base_premium': breakdown.get('base_premium'),
        'total_premium': breakdown.get('total_premium'),
    }
    return Response(result)


@api_view(['POST'])
@permission_classes([AllowAny])
def compare_pricing(request):
    """
    Compute premium for multiple underwriters automatically for a given product.
    No need to specify underwriter_codes - system fetches all available underwriters.
    Payload: { category_code, cover_type, subcategory_code, ...vehicle/pricing fields }
    Returns: { comparisons: [ { underwriter_code, result: {...} } ] }
    """
    data = request.data or {}
    
    # Extract category and product info - simplified to use subcategory directly
    category_code = data.get('category_code') or data.get('category') or 'PRIVATE'
    subcategory_code = data.get('subcategory_code') or data.get('subcategory')
    
    # Require explicit subcategory - no more cover_type fallbacks
    if not subcategory_code:
        available_for_category = ALLOWED_SUBCATEGORIES.get(category_code, [])
        return Response({
            'error': 'Missing required parameter: subcategory', 
            'message': f'Please provide subcategory for category {category_code}',
            'available_subcategories': available_for_category
        }, status=400)
    
    # Automatically get all underwriters that support this category
    # Prefer underwriters that explicitly support this category; fallback gracefully for backends without JSON contains
    qs = InsuranceProvider.objects.filter(is_active=True)
    try:
        qs_specific = InsuranceProvider.objects.filter(
            is_active=True,
            supported_categories__contains=[category_code]
        )
        # Force evaluation here to catch backends that don't support contains
        if qs_specific.exists():
            qs = qs_specific
    except Exception:
        # Keep qs as all active providers
        pass

    # Prepare candidate list with basic info
    all_underwriters = [{'code': u.code, 'name': u.name, 'underwriter': u} for u in qs]

    # Check if this is an extendible product (ends with _EXT or _EXTENDED)
    is_extendible_product = (
        '_EXT' in subcategory_code.upper() or 
        '_EXTENDED' in subcategory_code.upper()
    )

    # Filter to only underwriters with configured pricing source (features or DB)
    candidates = []
    for uwd in all_underwriters:
        uo = uwd['underwriter']
        has_features = False
        has_extendible_config = False
        
        try:
            feat = uo.features or {}
            pricing_map = (feat.get('pricing') or {}) if isinstance(feat, dict) else {}
            # Use alias-tolerant lookup for features presence
            product_pricing = _find_pricing_entry(pricing_map, subcategory_code)
            has_features = bool(product_pricing)

            # For extendible products, also check if extendible_config exists
            if has_features and is_extendible_product:
                has_extendible_config = bool(product_pricing.get('extendible_config'))
        except Exception:
            has_features = False
            has_extendible_config = False

        has_db = False
        sub = MotorSubcategory.objects.filter(
            category__code=str(category_code).upper(),
            subcategory_code=str(subcategory_code).upper(),
            is_active=True,
        ).first()
        if sub:
            has_db = (
                MotorPricing.objects.filter(subcategory=sub, underwriter=uo, is_active=True).exists() or
                CommercialTonnagePricing.objects.filter(subcategory=sub, underwriter=uo, is_active=True).exists()
            )

        # For extendible products, ONLY include underwriters with extendible_config
        if is_extendible_product:
            if has_extendible_config or has_db:
                uwd['has_features'] = has_features
                uwd['has_db'] = has_db
                uwd['has_extendible_config'] = has_extendible_config
                candidates.append(uwd)
        else:
            # For non-extendible products, include any with pricing
            if has_features or has_db:
                uwd['has_features'] = has_features
                uwd['has_db'] = has_db
                candidates.append(uwd)

    comparisons = []
    for underwriter_data in candidates:
        code = underwriter_data['code']
        name = underwriter_data['name']

        underwriter_obj = underwriter_data.get('underwriter')
        market_position = None
        features = underwriter_obj.features or {}
        rating = 4.0
        underwriter_id = underwriter_obj.id if underwriter_obj else None

        if features and isinstance(features, dict):
            market_position = features.get('market_position', 'COMPETITIVE')
            if features.get('is_budget'):
                market_position = 'BUDGET'
            elif features.get('is_premium'):
                market_position = 'PREMIUM'

        rating_map = {
            'BUDGET': 4.2,
            'COMPETITIVE': 4.5,
            'PREMIUM': 4.8
        }
        rating = rating_map.get(market_position, 4.0)

        pricing_source = None
        try:
            base = None
            # Try features first when present
            if underwriter_data.get('has_features'):
                base = _compute_underwriter_premium(code, category_code, subcategory_code, data)
                pricing_source = 'features'
            # Then DB
            if base is None and underwriter_data.get('has_db'):
                base = _compute_premium_from_db(code, category_code, subcategory_code, data)
                if base is not None:
                    pricing_source = 'db'

            if base is None:
                raise ValueError('No configured pricing (features or DB) for this product')

            breakdown = _apply_mandatory_levies(base)

            # Term computation
            start_date_str = data.get('cover_start_date') or data.get('start_date')
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            except Exception:
                start_date = datetime.now().date()

            # Use duration_days if available (for TOR), otherwise default to 365
            duration_days = int(data.get('duration_days') or data.get('policy_term_days') or 365)
            end_date = start_date + timedelta(days=duration_days)

            result = {
                'category': category_code,
                'cover_type': subcategory_code,
                'underwriter_id': underwriter_id,
                'underwriter_code': code,
                'underwriter_name': name,
                'market_position': market_position,
                'features': features,
                'rating': rating,
                'policy_term': {
                    'start_date': start_date.strftime('%Y-%m-%d'),
                    'end_date': end_date.strftime('%Y-%m-%d'),
                    'duration_days': duration_days,
                },
                'premium_breakdown': breakdown,
                'base_premium': breakdown.get('base_premium'),
                'total_premium': breakdown.get('total_premium'),
                'pricing_source': pricing_source,
            }
            
            # Add extendible config if this is an extendible product (read from features.pricing)
            if 'EXT' in subcategory_code.upper():
                try:
                    # Read extendible_config directly from the provider's features.pricing
                    features_cfg = (underwriter_obj.features or {}) if underwriter_obj else {}
                    pricing_map = features_cfg.get('pricing') or {}

                    # Use alias-tolerant lookup for product config
                    product_cfg = _find_pricing_entry(pricing_map, subcategory_code)

                    ext_cfg = None
                    if isinstance(product_cfg, dict):
                        ext_cfg = product_cfg.get('extendible_config') or product_cfg.get('extendibleConfig')

                    if isinstance(ext_cfg, dict):
                        # Get configured amounts (may or may not include levies)
                        initial_amount_raw = float(ext_cfg.get('initial_amount', 0))
                        balance_amount_raw = float(ext_cfg.get('balance_amount', 0))
                        total_annual_raw = float(ext_cfg.get('total_annual_premium', 0))
                        
                        # Check if levies are already included in the configured amounts
                        # If total_annual matches base_premium, levies need to be added
                        # If total_annual is higher than base by ~1%, levies are already included
                        base_from_result = float(breakdown.get('base_premium', 0))
                        levies_from_result = float(breakdown.get('total_levies', 0))
                        total_with_levies = float(breakdown.get('total_premium', 0))
                        
                        # Detect if config values already include levies by comparing totals
                        levies_included = abs(total_annual_raw - total_with_levies) < 1.0  # Within 1 KSh tolerance
                        
                        if not levies_included and base_from_result > 0:
                            # Levies not included in config, add them proportionally
                            total_base_configured = initial_amount_raw + balance_amount_raw
                            if total_base_configured > 0:
                                # Calculate what percentage each payment represents
                                initial_pct = initial_amount_raw / total_base_configured
                                balance_pct = balance_amount_raw / total_base_configured
                                
                                # Add levies proportionally
                                initial_levies = round(levies_from_result * initial_pct, 2)
                                balance_levies = round(levies_from_result * balance_pct, 2)
                                
                                # Adjust for rounding to ensure sum equals total levies
                                if abs((initial_levies + balance_levies) - levies_from_result) >= 0.5:
                                    balance_levies = levies_from_result - initial_levies
                                
                                initial_amount_final = initial_amount_raw + initial_levies
                                balance_amount_final = balance_amount_raw + balance_levies
                                total_annual_final = total_with_levies
                                
                                print(f"💡 Applied levies to extendible config for {subcategory_code} - {name}:")
                                print(f"   Initial: {initial_amount_raw} + {initial_levies} = {initial_amount_final}")
                                print(f"   Balance: {balance_amount_raw} + {balance_levies} = {balance_amount_final}")
                                print(f"   Total: {total_annual_final}")
                            else:
                                # Fallback if config is zero/invalid
                                initial_amount_final = initial_amount_raw
                                balance_amount_final = balance_amount_raw
                                total_annual_final = total_annual_raw
                        else:
                            # Levies already included or cannot calculate
                            initial_amount_final = initial_amount_raw
                            balance_amount_final = balance_amount_raw
                            total_annual_final = total_annual_raw
                            if levies_included:
                                print(f"✅ Extendible config already includes levies for {subcategory_code} - {name}")
                        
                        result['extendible_config'] = {
                            'initial_period_days': int(ext_cfg.get('initial_period_days', 30)),
                            'initial_amount': float(initial_amount_final),
                            'balance_amount': float(balance_amount_final),
                            'total_annual_premium': float(total_annual_final),
                            'extension_deadline_days': int(ext_cfg.get('extension_deadline_days', ext_cfg.get('initial_period_days', 30))),
                            'grace_period_days': int(ext_cfg.get('grace_period_days', 7)),
                            'penalty_for_late_extension': float(ext_cfg.get('penalty_for_late_extension', ext_cfg.get('late_fee_percentage', 0))),
                            'allow_partial_extension': bool(ext_cfg.get('allow_partial_extension', False))
                        }
                        result['is_extendible'] = True
                        result['payment_plan'] = 'EXTENDIBLE'
                        print(f"✅ Added extendible config from features.pricing for {subcategory_code} - {name}")
                    else:
                        print(f"⚠️ No extendible_config in features.pricing for {subcategory_code} - {name}")
                        # Mark for exclusion - will be filtered out later
                        result['is_extendible'] = False
                        result['_exclude_from_ext_product'] = True
                except Exception as e:
                    print(f"❌ Error reading extendible_config from features.pricing for {subcategory_code} - {name}: {e}")
                    import traceback
                    traceback.print_exc()
                    result['is_extendible'] = False
                    # Mark for exclusion if it's an EXT product but failed to load config
                    result['_exclude_from_ext_product'] = True

        except Exception as e:
            result = {
                'category': category_code,
                'cover_type': subcategory_code,
                'underwriter_id': underwriter_id,
                'underwriter_code': code,
                'underwriter_name': name,
                'market_position': market_position,
                'features': features,
                'rating': rating,
                'error': str(e),
                'base_premium': 0,
                'total_premium': 0,
                'pricing_source': pricing_source or 'none',
                'is_extendible': 'EXT' in subcategory_code.upper() if subcategory_code else False,
                '_exclude_from_ext_product': True  # Exclude errors for EXT products
            }

        comparisons.append({'underwriter_code': code, 'result': result})

    # Filter out underwriters that don't support the requested product
    # For EXT products: exclude underwriters without valid extendible_config
    # For standard products: exclude underwriters without pricing for this subcategory
    is_extendible_product = 'EXT' in subcategory_code.upper() if subcategory_code else False
    
    filtered_comparisons = []
    for comp in comparisons:
        result = comp.get('result', {})
        
        # Skip underwriters marked for exclusion
        if result.get('_exclude_from_ext_product'):
            print(f"🚫 Excluding {result.get('underwriter_name')} - no extendible_config for {subcategory_code}")
            continue
        
        # Skip underwriters with errors (unless we want to show them)
        if 'error' in result and result.get('total_premium', 0) == 0:
            print(f"⚠️ Excluding {result.get('underwriter_name')} - pricing error")
            continue
            
        # Clean up internal flags before sending to frontend
        result.pop('_exclude_from_ext_product', None)
        filtered_comparisons.append(comp)
    
    print(f"\n📊 Comparison Results: {len(filtered_comparisons)} out of {len(comparisons)} underwriters shown for {subcategory_code}")
    
    return Response({'comparisons': filtered_comparisons, 'count': len(filtered_comparisons)})