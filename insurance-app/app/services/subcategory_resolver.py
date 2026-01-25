from typing import Optional
from app.models import MotorSubcategory

# Fill this mapping as needed when codes differ between MotorCoverType.code and MotorSubcategory.subcategory_code
# Example: MAPPING = { 'PRIVATE_THIRD_PARTY': 'PRIVATE_TP', ... }
MAPPING: dict[str, str] = {}


def resolve_subcategory_code(subcategory_code: Optional[str] = None, cover_type_code: Optional[str] = None) -> str:
    """Resolve a subcategory code, preferring explicit subcategory_code. If not provided,
    try to map from a cover_type_code using exact match or the MAPPING dict.
    Raises ValueError if no resolution is possible.
    """
    # If client provided subcategory_code and it exists, return as-is
    if subcategory_code:
        if MotorSubcategory.objects.filter(subcategory_code=subcategory_code).exists():
            return subcategory_code
        # Try uppercase normalization
        up = subcategory_code.strip().upper()
        if MotorSubcategory.objects.filter(subcategory_code=up).exists():
            return up

    # Try cover_type_code path (legacy alias to subcategory_code)
    if cover_type_code:
        code = cover_type_code.strip().upper()
        # Exact subcategory match
        if MotorSubcategory.objects.filter(subcategory_code=code).exists():
            return code
        # Mapping dict
        mapped = MAPPING.get(code)
        if mapped and MotorSubcategory.objects.filter(subcategory_code=mapped).exists():
            return mapped
        # No subcategory found for legacy cover_type_code
        raise ValueError(
            f"No MotorSubcategory mapping found for cover_type_code='{code}'. "
            f"Add a mapping in app/services/subcategory_resolver.py:MAPPING or align codes."
        )

    raise ValueError("subcategory_code is required or must be resolvable from cover_type_code")
