"""
Product label mappings for human-readable display names.
Maps database product codes to user-friendly names.
"""

PRODUCT_LABEL_MAP = {
    # Standard Private Products
    'PRIVATE_THIRD_PARTY': 'Private Third Party',
    'PRIVATE_TOR': 'Private Time on Risk',
    'PRIVATE_COMPREHENSIVE': 'Private Comprehensive',
    
    # Extendible Private Products
    'PRIVATE_THIRD_PARTY_EXT': 'Private Third Party',
    'PRIVATE_TOR_EXT': 'Private Time on Risk',
    
    # Standard Commercial Products
    'COMMERCIAL_GENERAL_CARTAGE_TP': 'General Cartage Third Party',
    'COMMERCIAL_GENERAL_CARTAGE_COMP': 'General Cartage Comprehensive',
    
    # Extendible Commercial Products
    'COMMERCIAL_GENERAL_CARTAGE_TP_EXT': 'General Cartage Third Party',
    
    # Standard PSV Products
    'PSV_MATATU_1WK_TP': 'PSV Matatu (1 Week)',
    'PSV_MATATU_1WK_COMP': 'PSV Matatu (1 Week) Comprehensive',
    'PSV_MATATU_1M_TP': 'PSV Matatu (1 Month)',
    'PSV_MATATU_1M_COMP': 'PSV Matatu (1 Month) Comprehensive',
    
    # Extendible PSV Products
    'PSV_MATATU_1WK_TP_EXT': 'PSV Matatu (1 Week)',
    'PSV_TUKTUK_TP_EXT': 'PSV Tuk-Tuk',
    
    # Standard TukTuk Products
    'TUKTUK_COMMERCIAL_TP': 'Tuk-Tuk Commercial',
    'TUKTUK_COMMERCIAL_COMP': 'Tuk-Tuk Comprehensive',
    
    # Extendible TukTuk Products
    'TUKTUK_COMMERCIAL_TP_EXT': 'Tuk-Tuk Commercial',
    
    # Motorcycle Products
    'MOTORCYCLE_THIRD_PARTY': 'Motorcycle Third Party',
    'MOTORCYCLE_COMPREHENSIVE': 'Motorcycle Comprehensive',
    
    # Special Classes
    'SPECIAL_AGRICULTURAL': 'Agricultural Vehicle',
    'SPECIAL_INSTITUTIONAL': 'Institutional Vehicle',
}


def get_product_label(product_code: str, include_extendible_suffix: bool = True) -> str:
    """
    Get human-readable label for product code.
    
    Args:
        product_code: Database product code (e.g., 'PRIVATE_THIRD_PARTY_EXT')
        include_extendible_suffix: If True, append ' (Extendible)' for extendible products
        
    Returns:
        Human-readable product name (e.g., 'Private Third Party (Extendible)')
    """
    if not product_code:
        return 'Unknown Product'
    
    # Get base label from map
    label = PRODUCT_LABEL_MAP.get(product_code)
    
    if not label:
        # Fallback: Convert underscore/hyphen to spaces and title case
        label = product_code.replace('_', ' ').replace('-', ' ').title()
        # Remove "EXT" suffix from fallback label
        if label.endswith(' Ext'):
            label = label[:-4]
    
    # Add extendible suffix if applicable
    is_extendible = '_EXT' in product_code or product_code.endswith('_EXT')
    if is_extendible and include_extendible_suffix:
        label += ' (Extendible)'
    
    return label


def format_policy_product_name(policy_data: dict) -> str:
    """
    Extract and format product name from policy data.
    
    Args:
        policy_data: Policy object or dict with product_details
        
    Returns:
        Formatted product name string
    """
    product_details = policy_data.get('product_details', {})
    
    # Try subcategory first (most specific)
    subcategory = product_details.get('subcategory')
    if subcategory:
        return get_product_label(subcategory)
    
    # Fallback to coverType
    cover_type = product_details.get('coverType') or product_details.get('coverageType')
    if cover_type:
        # If we have category, combine them
        category = product_details.get('category', '')
        if category:
            product_code = f"{category}_{cover_type}".upper()
            return get_product_label(product_code)
        return get_product_label(cover_type)
    
    return 'Motor Insurance'
