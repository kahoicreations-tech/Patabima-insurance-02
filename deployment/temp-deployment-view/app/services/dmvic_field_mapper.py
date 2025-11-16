"""
DMVIC Field Mapper Service
Maps PataBima MotorPolicy data to DMVIC API payload format

This service ensures all field names, formats, and values match DMVIC's exact requirements:
- Correct field name casing (Chassisnumber, Phonenumber, InsuredPIN)
- Date format: DD/MM/YYYY (not YYYY-MM-DD)
- Certificate type mapping (A/B/C/D)
- Cover type codes (100=COMP, 200=TPO, 300=TPTF)
- Only mandatory fields (no extra fields DMVIC doesn't expect)
"""

import re
from datetime import datetime, date
from typing import Dict, Any, Optional
from django.conf import settings
from django.utils import timezone


class DMVICFieldMapper:
    """Maps PataBima policy data to DMVIC-compliant payloads"""
    
    # Certificate Type Mapping
    CERTIFICATE_TYPE_CODES = {
        'A': 7,  # Third Party Only (TPO)
        'B': 8,  # Comprehensive
        'C': 7,  # Third Party + PLL (uses TPO code)
        'D': 8,  # Comprehensive + PLL (uses COMP code)
    }
    
    # Cover Type Mapping
    COVER_TYPE_CODES = {
        'COMPREHENSIVE': 100,
        'THIRD_PARTY': 200,
        'TOR': 300,  # Third Party Fire & Theft
        'TPTF': 300,
    }
    
    # Vehicle Type Mapping (DMVIC codes)
    VEHICLE_TYPE_CODES = {
        'PRIVATE': 'PC',      # Private Car
        'COMMERCIAL': 'CV',   # Commercial Vehicle
        'PSV': 'PSV',         # Public Service Vehicle
        'MOTORCYCLE': 'MC',   # Motorcycle
        'TUKTUK': 'TT',       # TukTuk/Three-wheeler
        'SPECIAL': 'SV',      # Special Vehicle
    }
    
    # Body Type Mapping (common codes)
    BODY_TYPE_CODES = {
        'SEDAN': 'SD',
        'STATION WAGON': 'SW',
        'HATCHBACK': 'HB',
        'SUV': 'SU',
        'PICK-UP': 'PU',
        'VAN': 'VN',
        'BUS': 'BT',
        'TRUCK': 'TR',
        'LORRY': 'LR',
        'SALOON': 'SL',
        'MATATU': 'MT',
        'MOTORCYCLE': 'MC',
        'TUKTUK': 'TT',
    }
    
    @staticmethod
    def clean_phone_number(phone: str) -> str:
        """
        Clean and format phone number.
        Spec table shows 9-digit numeric (e.g., 999999999). To be safe and
        compatible with various inputs (+2547..., 07...), we normalize to the
        last 9 digits.
        """
        if not phone:
            return ''
        
        # Remove all non-digit characters
        phone = re.sub(r'\D', '', str(phone))

        # Use the last 9 digits (as per DMVIC example/validator hint)
        if len(phone) >= 9:
            return phone[-9:]
        return phone

    @staticmethod
    def sanitize_alnum_upper(value: str) -> str:
        """
        DMVIC rejects special characters for some fields (e.g., Chassisnumber).
        Keep only A-Z and 0-9, uppercase the result.
        """
        if not value:
            return ''
        return re.sub(r'[^A-Za-z0-9]', '', str(value)).upper()
    
    @staticmethod
    def clean_registration_number(registration: str) -> str:
        """
        Clean registration number (uppercase, remove spaces)
        Input: kca 123a or KCA-123-A
        Output: KCA123A
        """
        if not registration:
            return ''
        
        # Remove spaces and hyphens, convert to uppercase
        return re.sub(r'[\s\-]', '', str(registration).upper())
    
    @staticmethod
    def format_date_dmvic(date_input: Any) -> str:
        """
        Format date to DMVIC format: DD/MM/YYYY
        Input: datetime.datetime, datetime.date, ISO string, or DD/MM/YYYY string
        Output: DD/MM/YYYY
        """
        if not date_input:
            return ''
        
        # If already in DD/MM/YYYY format, return as-is
        if isinstance(date_input, str) and '/' in date_input:
            parts = date_input.split('/')
            if len(parts) == 3 and len(parts[2]) == 4:
                return date_input
        
        # Parse datetime.datetime or datetime.date objects
        if isinstance(date_input, (datetime, date)):
            return date_input.strftime('%d/%m/%Y')
        
        # Parse ISO string (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
        if isinstance(date_input, str):
            try:
                # Try ISO format
                dt = datetime.fromisoformat(date_input.replace('Z', '+00:00'))
                return dt.strftime('%d/%m/%Y')
            except ValueError:
                pass
            
            try:
                # Try YYYY-MM-DD
                dt = datetime.strptime(date_input[:10], '%Y-%m-%d')
                return dt.strftime('%d/%m/%Y')
            except ValueError:
                pass
        
        return ''
    
    @staticmethod
    def get_body_type_code(body_type: str) -> str:
        """
        Get DMVIC body type code from vehicle body type
        Input: "Sedan" or "STATION WAGON"
        Output: "SD" or "SW"
        """
        if not body_type:
            return 'SD'  # Default to sedan
        
        body_upper = body_type.upper().strip()
        return DMVICFieldMapper.BODY_TYPE_CODES.get(body_upper, 'SD')
    
    @staticmethod
    def determine_certificate_type(policy_data: Dict) -> str:
        """
        Determine DMVIC certificate type (A/B/C/D)
        
        A = Third Party Only (no PLL)
        B = Comprehensive (no PLL)
        C = Third Party + PLL
        D = Comprehensive + PLL
        """
        coverage_type = policy_data.get('product_details', {}).get('coverage_type', '').upper()
        has_pll = policy_data.get('product_details', {}).get('has_pll', False)
        
        # Check addons for PLL
        addons = policy_data.get('addons', [])
        if isinstance(addons, list):
            has_pll = has_pll or any('PLL' in str(addon).upper() for addon in addons)
        
        # Determine type
        is_comprehensive = 'COMP' in coverage_type
        
        if is_comprehensive:
            return 'D' if has_pll else 'B'
        else:
            return 'C' if has_pll else 'A'
    
    @staticmethod
    def map_to_type_a_payload(policy_data: Dict) -> Dict[str, Any]:
        """
        Map policy data to DMVIC Type A certificate payload (Third Party Only)
        
        Based on DMVIC API Documentation v1.8.0
        
        MANDATORY Fields (Mandatory=Yes):
        1. TypeOfCertificate: int (7 for Type A)
        3. Typeofcover: int (200=TPO, 300=TPTF)
        4. Policyholder: string (Insurer name)
        5. policynumber: string (Our internal policy number)
        6. Commencingdate: string (DD/MM/YYYY)
        7. Expiringdate: string (DD/MM/YYYY)
        10. Phonenumber: string (9-digit, 0-9 only)
        11. Bodytype: string (e.g., "SD", "SW")
        12. Licensedtocarry: int (tonnage or passenger capacity)
        17. Email: string (Certificate will be sent here)
        19. InsuredPIN: string (KRA PIN, max 11 chars)
        
        OPTIONAL Fields (Mandatory=No) - Include if available:
        2. IntermediaryIRANumber: string (IRA registration) - OPTIONAL
        8. Registrationnumber: string - OPTIONAL but recommended
        9. Chassisnumber: string - OPTIONAL but recommended
        13. Vehiclemake: string - OPTIONAL
        14. Vehiclemodel: string - OPTIONAL
        16. Enginenumber: string - OPTIONAL
        20. Yearofmanufacture: int (YYYY) - OPTIONAL
        21. HudumaNumber: string - OPTIONAL
        """
        vehicle = policy_data.get('vehicle_details', {})
        client = policy_data.get('client_details', {})
        product = policy_data.get('product_details', {})
        
        # Determine cover type
        coverage_type = product.get('coverage_type', '').upper()
        cover_code = 300 if 'TOR' in coverage_type or 'TPTF' in coverage_type else 200
        
        # Get policy number (PataBima internal number)
        policy_number = policy_data.get('policy_number', '')
        
        # Get insured name (handle both fullName and first_name/last_name formats)
        insured_name = client.get('fullName', '') or client.get('full_name', '')
        if not insured_name:
            first = client.get('first_name', '')
            last = client.get('last_name', '')
            insured_name = f"{first} {last}".strip()
        
        # Build payload with ALL REQUIRED fields
        # CRITICAL: Field names MUST match DMVIC API example EXACTLY (case-sensitive)
        payload = {
            # STRICTLY MANDATORY FIELDS (exact casing from DMVIC example)
            # IntermediaryIRANumber is optional; include only if configured
            # via settings.DMVIC_IRA_NUMBER
            **({ 'IntermediaryIRANumber': getattr(settings, 'DMVIC_IRA_NUMBER', '') }
               if getattr(settings, 'DMVIC_IRA_NUMBER', '') else {}),
            'TypeOfCertificate': 7,  # Type A code
            'Typeofcover': cover_code,  # 200=TPO, 300=TPTF (lowercase 'cover')
            'Policyholder': 'PATABIMA',  # Insurer name
            'policynumber': policy_number,  # Our policy number (POL-2025-456789)
            'Commencingdate': DMVICFieldMapper.format_date_dmvic(  # lowercase 'date'!
                policy_data.get('cover_start_date')
            ),
            'Expiringdate': DMVICFieldMapper.format_date_dmvic(  # lowercase 'date'!
                policy_data.get('cover_end_date')
            ),
            'Phonenumber': DMVICFieldMapper.clean_phone_number(
                client.get('phone', '')
            ),
            'Bodytype': DMVICFieldMapper.get_body_type_code(
                vehicle.get('body_type', 'Sedan')
            ),
            # Support both camelCase (frontend) and snake_case (legacy) formats
            'Licensedtocarry': int(
                vehicle.get('tonnage') or 
                vehicle.get('passenger_capacity') or 
                vehicle.get('passengerCapacity') or 
                vehicle.get('seating_capacity') or 
                5  # Default to 5 for private vehicles if missing
            ),
            'Email': client.get('email', ''),
            # Support both camelCase (kraPin) and snake_case (kra_pin)
            'InsuredPIN': (
                client.get('kra_pin') or 
                client.get('kraPin') or 
                ''
            ).upper(),
            
            # CONDITIONALLY MANDATORY
            'Registrationnumber': DMVICFieldMapper.clean_registration_number(
                vehicle.get('registration', '')
            ),
            # Support both camelCase (chassisNumber) and snake_case (chassis_number)
            'Chassisnumber': DMVICFieldMapper.sanitize_alnum_upper(
                vehicle.get('chassis_number') or 
                vehicle.get('chassisNumber') or 
                ''
            ),
            
            # RECOMMENDED OPTIONAL FIELDS (Better data quality)
            'VehicleMake': (vehicle.get('make') or '').upper(),  # CAPITAL M per spec!
            'VehicleModel': (vehicle.get('model') or '').upper(),  # CAPITAL M per spec!
            # Support both camelCase (engineNumber) and snake_case (engine_number)
            'Enginenumber': DMVICFieldMapper.sanitize_alnum_upper(
                vehicle.get('engine_number') or 
                vehicle.get('engineNumber') or 
                ''
            ),
            'Yearofmanufacture': int(vehicle.get('year', 0)),
        }
        
        # Add truly optional fields only if available
        if client.get('huduma_number'):
            payload['HudumaNumber'] = client.get('huduma_number', '')
        
        return payload
    
    @staticmethod
    def map_to_type_b_payload(policy_data: Dict) -> Dict[str, Any]:
        """
        Map policy data to DMVIC Type B certificate payload (Comprehensive)
        
        DMVIC Type B Required Fields (EXACT casing per API spec):
        - IntermediaryIRANumber: PataBima IRA registration
        - TypeOfCertificate: 8
        - Typeofcover: 100 (Comprehensive) - lowercase 'cover'
        - Policyholder: Insurer name
        - policynumber: PataBima internal policy number
        - Commencingdate: DD/MM/YYYY
        - Expiringdate: DD/MM/YYYY
        - Registrationnumber: Vehicle registration
        - Chassisnumber: Chassis number
        - Phonenumber: Client phone
        - Bodytype: Body type code
        - Licensedtocarry: Tonnage or capacity
        - Vehiclemake: Make
        - Vehiclemodel: Model
        - Enginenumber: Engine number
        - Email: Client email
        - SumInsured: Vehicle value
        - InsuredPIN: KRA PIN
        - Yearofmanufacture: Manufacturing year
        - HudumaNumber: Huduma number (optional)
        """
        vehicle = policy_data.get('vehicle_details', {})
        client = policy_data.get('client_details', {})
        premium = policy_data.get('premium_breakdown', {})
        
        # Get policy number (PataBima internal number)
        policy_number = policy_data.get('policy_number', '')
        
        return {
            **({ 'IntermediaryIRANumber': getattr(settings, 'DMVIC_IRA_NUMBER', '') }
               if getattr(settings, 'DMVIC_IRA_NUMBER', '') else {}),
            'TypeOfCertificate': 8,  # Type B code
            'Typeofcover': 100,  # Comprehensive - lowercase 'cover'
            'Policyholder': 'PATABIMA',  # Insurer name
            'policynumber': policy_number,  # PataBima policy number (POL-2025-456789)
            'Commencingdate': DMVICFieldMapper.format_date_dmvic(
                policy_data.get('cover_start_date')
            ),
            'Expiringdate': DMVICFieldMapper.format_date_dmvic(
                policy_data.get('cover_end_date')
            ),
            'Registrationnumber': DMVICFieldMapper.clean_registration_number(
                vehicle.get('registration', '')
            ),
            # Support both camelCase (chassisNumber) and snake_case (chassis_number)
            'Chassisnumber': DMVICFieldMapper.sanitize_alnum_upper(
                vehicle.get('chassis_number') or 
                vehicle.get('chassisNumber') or 
                ''
            ),
            'Phonenumber': DMVICFieldMapper.clean_phone_number(
                client.get('phone', '')
            ),
            'Bodytype': DMVICFieldMapper.get_body_type_code(
                vehicle.get('body_type', 'Sedan')
            ),
            # Support both camelCase and snake_case formats
            'Licensedtocarry': int(
                vehicle.get('tonnage') or 
                vehicle.get('passenger_capacity') or 
                vehicle.get('passengerCapacity') or 
                vehicle.get('seating_capacity') or 
                5  # Default to 5 for private vehicles
            ),
            'Vehiclemake': (vehicle.get('make') or '').upper(),
            'Vehiclemodel': (vehicle.get('model') or '').upper(),
            # Support both camelCase (engineNumber) and snake_case (engine_number)
            'Enginenumber': DMVICFieldMapper.sanitize_alnum_upper(
                vehicle.get('engine_number') or 
                vehicle.get('engineNumber') or 
                ''
            ),
            'Email': client.get('email', ''),
            # Support both camelCase (sumInsured) and snake_case (sum_insured)
            'SumInsured': float(
                vehicle.get('sum_insured') or 
                vehicle.get('sumInsured') or 
                0
            ),
            # Support both camelCase (kraPin) and snake_case (kra_pin)
            'InsuredPIN': (
                client.get('kra_pin') or 
                client.get('kraPin') or 
                ''
            ).upper(),
            'Yearofmanufacture': int(vehicle.get('year', 0)),
            'HudumaNumber': client.get('huduma_number', '')  # Optional
        }
    
    @staticmethod
    def map_to_type_c_payload(policy_data: Dict) -> Dict[str, Any]:
        """
        Map policy data to DMVIC Type C certificate payload (API v5 - IssuanceTypeCCertificate)

        IMPORTANT differences from Type A:
        - Do NOT include `TypeOfCertificate` for Type C
        - `Licensedtocarry` is NOT part of the Type C request elements table
        - `Registrationnumber` is optional (include if available)
        - `SumInsured` is required only when Typeofcover is 100 (COMP) or 300 (TPTF)

        Fields (exact casing per spec screenshot 4.4.3 - v1.8.0):
        - IntermediaryIRANumber (No)
        - Typeofcover (Yes) 100|200|300
        - Policyholder (Yes)
        - policynumber (Yes)
        - Commencingdate (Yes) DD/MM/YYYY
        - Expiringdate (Yes) DD/MM/YYYY
        - Registrationnumber (No)
        - Chassisnumber (Yes)
        - Phonenumber (Yes)
        - Bodytype (Yes)
        - Vehiclemake (Yes)
        - Vehiclemodel (Yes)
        - Enginenumber (No)
        - Email (Yes)
        - SumInsured (Yes when 100 or 300)
        - InsuredPIN (Yes)
        - Yearofmanufacture (No)
        - HudumaNumber (No)
        """
        vehicle = policy_data.get('vehicle_details', {})
        client = policy_data.get('client_details', {})
        product = policy_data.get('product_details', {})

        # Determine cover type code
        coverage_type = product.get('coverage_type', '').upper()
        if 'COMP' in coverage_type:
            cover_code = 100
        elif 'TOR' in coverage_type or 'TPTF' in coverage_type:
            cover_code = 300
        else:
            cover_code = 200  # default to TPO

        policy_number = policy_data.get('policy_number', '')

        payload: Dict[str, Any] = {
            **({ 'IntermediaryIRANumber': getattr(settings, 'DMVIC_IRA_NUMBER', '') }
               if getattr(settings, 'DMVIC_IRA_NUMBER', '') else {}),
            # NOTE: No TypeOfCertificate here for Type C
            'Typeofcover': cover_code,
            'Policyholder': 'PATABIMA',
            'policynumber': policy_number,
            'Commencingdate': DMVICFieldMapper.format_date_dmvic(
                policy_data.get('cover_start_date')
            ),
            'Expiringdate': DMVICFieldMapper.format_date_dmvic(
                policy_data.get('cover_end_date')
            ),
            # Registrationnumber is optional (include if available)
            'Registrationnumber': DMVICFieldMapper.clean_registration_number(
                vehicle.get('registration', '')
            ) if vehicle.get('registration') else '',
            # Support both camelCase (chassisNumber) and snake_case (chassis_number)
            'Chassisnumber': DMVICFieldMapper.sanitize_alnum_upper(
                vehicle.get('chassis_number') or 
                vehicle.get('chassisNumber') or 
                ''
            ),
            'Phonenumber': DMVICFieldMapper.clean_phone_number(
                client.get('phone', '')
            ),
            'Bodytype': DMVICFieldMapper.get_body_type_code(
                vehicle.get('body_type', 'Sedan')
            ),
            'Vehiclemake': (vehicle.get('make') or '').upper(),
            'Vehiclemodel': (vehicle.get('model') or '').upper(),
            # Support both camelCase (engineNumber) and snake_case (engine_number)
            'Enginenumber': DMVICFieldMapper.sanitize_alnum_upper(
                vehicle.get('engine_number') or 
                vehicle.get('engineNumber') or 
                ''
            ),
            'Email': client.get('email', ''),
            # Support both camelCase (kraPin) and snake_case (kra_pin)
            'InsuredPIN': (
                client.get('kra_pin') or 
                client.get('kraPin') or 
                ''
            ).upper(),
            'Yearofmanufacture': int(vehicle.get('year', 0)) if vehicle.get('year') else 0,
        }

        # Conditional SumInsured: required for 100 (COMP) and 300 (TPTF)
        if cover_code in (100, 300):
            # Support both camelCase (sumInsured) and snake_case (sum_insured)
            payload['SumInsured'] = float(
                vehicle.get('sum_insured') or 
                vehicle.get('sumInsured') or 
                0
            )

        # Optional HudumaNumber
        if client.get('huduma_number'):
            payload['HudumaNumber'] = client.get('huduma_number')

        return payload
    
    @staticmethod
    def map_to_type_d_payload(policy_data: Dict) -> Dict[str, Any]:
        """
        Map policy data to DMVIC Type D certificate payload (Comprehensive + PLL)
        
        Same as Type B but with PLL addon details
        """
        payload = DMVICFieldMapper.map_to_type_b_payload(policy_data)
        # Type D uses same structure as Type B (still code 8)
        # PLL is indicated by separate addon registration (not in certificate payload)
        return payload
    
    @staticmethod
    def map_policy_to_dmvic(policy, certificate_type: str) -> Dict[str, Any]:
        """
        Main mapping function - converts MotorPolicy model to DMVIC payload
        
        Args:
            policy: MotorPolicy model instance
            certificate_type: 'A', 'B', 'C', or 'D'
        
        Returns:
            Dict with DMVIC-compliant payload
        """
        # Build unified policy data structure
        policy_data = {
            'policy_number': policy.policy_number,  # Add policy number
            'vehicle_details': policy.vehicle_details,
            'client_details': policy.client_details,
            'product_details': policy.product_details,
            'premium_breakdown': policy.premium_breakdown,
            'cover_start_date': policy.cover_start_date,
            'cover_end_date': policy.cover_end_date,
            'addons': policy.addons or []
        }
        
        # Map based on certificate type
        mapper = {
            'A': DMVICFieldMapper.map_to_type_a_payload,
            'B': DMVICFieldMapper.map_to_type_b_payload,
            'C': DMVICFieldMapper.map_to_type_c_payload,
            'D': DMVICFieldMapper.map_to_type_d_payload,
        }
        
        if certificate_type not in mapper:
            raise ValueError(f"Invalid certificate type: {certificate_type}. Must be A, B, C, or D")
        
        return mapper[certificate_type](policy_data)
    
    @staticmethod
    def validate_payload(payload: Dict[str, Any], certificate_type: str) -> tuple[bool, list]:
        """
        Validate DMVIC payload has all required fields
        Field names updated to match DMVIC v5 example (exact casing)
        
        Returns:
            (is_valid: bool, missing_fields: list)
        """
        # Per-type required fields
        base_fields = [
            'Typeofcover',  # always present
            'Chassisnumber',
            'Phonenumber',
            'Bodytype',
            'Commencingdate',
            'Expiringdate',
            'InsuredPIN',
            'Email',
            'policynumber',
            'Policyholder',
        ]

        if certificate_type == 'A':
            required_fields = ['TypeOfCertificate', 'Registrationnumber', 'Licensedtocarry'] + base_fields
        elif certificate_type in ['B', 'D']:
            required_fields = ['TypeOfCertificate', 'Registrationnumber', 'Licensedtocarry', 'SumInsured'] + base_fields
        elif certificate_type == 'C':
            # No TypeOfCertificate, Registrationnumber optional, no Licensedtocarry
            required_fields = base_fields.copy()
            # Conditional SumInsured when cover 100/300
            cover_code = payload.get('Typeofcover')
            if cover_code in (100, 300):
                required_fields.append('SumInsured')
        else:
            required_fields = base_fields

        missing = [field for field in required_fields if not payload.get(field)]

        return len(missing) == 0, missing


# Singleton instance
_field_mapper = DMVICFieldMapper()


def get_dmvic_field_mapper() -> DMVICFieldMapper:
    """Get singleton instance of DMVIC Field Mapper"""
    return _field_mapper
