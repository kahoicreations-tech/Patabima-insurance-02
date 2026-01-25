"""
DMVIC Integration Service
Handles all communication with DMVIC (Department of Motor Vehicle Insurance Coordinator) API
for vehicle verification, certificate issuance, and validation.

INTEGRATION APPROACH (Updated January 18, 2026):
================================================
PataBima operates as an INTERMEDIARY (Broker) in DMVIC's system.

We use a HYBRID integration approach:

1. MEMBER COMPANY ENDPOINTS (v5 - /api/v5/Integration/*)
   - Vehicle Search: Search NTSA database for vehicle details
   - Validate Double Insurance: Check for existing active policies
   - Used for: Vehicle verification and regulatory compliance checks
   - Reason: Intermediary endpoints don't provide vehicle search capability

2. INTERMEDIARY INTEGRATION ENDPOINTS (v6 - /api/v6/IntermediaryIntegration/*)
   - Preview Certificate: Generate preview without inventory allocation
   - Validate Certificate: Pre-validate data before issuance
   - Issue Certificate: Issue actual certificate with proper intermediary accounting
   - Used for: All certificate operations (preview, validate, issue)
   - Reason: As a broker, we must use Intermediary endpoints for proper commission
     tracking and to reflect that we compare multiple insurers before issuing

DMVIC API Specification References:
- 4.1: DMVIC Login API (Authentication)
- 4.2.1: Vehicle Search - Member Company (v5)
- 4.11: Validate Double Insurance - Member Company (v5)
- 4.12: Certificate Operations - Intermediary Integration (v6)
- 4.13: Validate Certificate - Intermediary (v6)
- 4.14: Certificates Inventory - Intermediary (v6)

Author: PataBima Development Team
Date: November 3, 2025
Updated: January 18, 2026 - Clarified Intermediary Integration usage
"""

import os
import requests
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Any
from django.conf import settings
from cryptography.hazmat.primitives.serialization import pkcs12, Encoding, PrivateFormat, NoEncryption

logger = logging.getLogger(__name__)


class DMVICAuthenticationError(Exception):
    """Raised when DMVIC authentication fails"""
    pass


class DMVICAPIError(Exception):
    """Raised when DMVIC API call fails"""
    pass


class DMVICService:
    """
    Service class for interacting with DMVIC API.
    Handles authentication, vehicle search, certificate issuance, and validation.
    """

    def __init__(self):
        """Initialize DMVIC service with configuration from Django settings"""
        self.base_url = getattr(settings, 'DMVIC_BASE_URL', 'https://uat-api.dmvic.com')
        self.username = getattr(settings, 'DMVIC_USERNAME', None)
        self.password = getattr(settings, 'DMVIC_PASSWORD', None)
        self.client_id = getattr(settings, 'DMVIC_CLIENT_ID', None)
        self.member_code = getattr(settings, 'DMVIC_MEMBER_CODE', 'PATABIMA')
        
        # Certificate authentication
        self.pfx_path = getattr(settings, 'DMVIC_PFX_PATH', None)
        self.passphrase = getattr(settings, 'DMVIC_PASSPHRASE', None)
        
        # Token management
        self.access_token = None
        self.token_expiry = None
        self.refresh_token = None
        # APIM subscription key from login or settings override
        self.apim_subscription_key = getattr(settings, 'DMVIC_APIM_SUBSCRIPTION_KEY', None)
        
        # Certificate cache
        self._cert = None
        self._key = None

        # SSL verification (default secure). Allow disabling only in DEBUG or UAT base URL.
        requested_verify = getattr(settings, 'DMVIC_SSL_VERIFY', True)
        self.ssl_verify = bool(requested_verify)
        if requested_verify is False:
            allow_insecure = bool(getattr(settings, 'DEBUG', False)) or ('uat' in (self.base_url or '').lower())
            if allow_insecure:
                self.ssl_verify = False
                logger.warning(
                    "DMVIC SSL verification disabled via DMVIC_SSL_VERIFY=False (UAT/local only). "
                    "Do NOT use this in production."
                )
            else:
                self.ssl_verify = True
                logger.warning(
                    "DMVIC_SSL_VERIFY=False ignored because environment is not DEBUG and DMVIC_BASE_URL is not UAT."
                )
        
        # Validate required configuration
        self._validate_config()

    def _validate_config(self):
        """Validate that all required DMVIC configuration is present"""
        missing = []
        
        if not self.username:
            missing.append('DMVIC_USERNAME')
        if not self.password:
            missing.append('DMVIC_PASSWORD')
        if not self.client_id:
            missing.append('DMVIC_CLIENT_ID')
        if not self.passphrase:
            missing.append('DMVIC_PASSPHRASE')
        
        if missing:
            logger.warning(
                f"DMVIC configuration incomplete. Missing: {', '.join(missing)}. "
                "DMVIC integration will not work until these are configured."
            )
        
        # Store configuration status for later checks
        self._is_configured = len(missing) == 0

    def is_configured(self):
        """Check if DMVIC is properly configured"""
        return hasattr(self, '_is_configured') and self._is_configured

    def load_certificate(self):
        """
        Load .pfx certificate for client authentication.
        Returns tuple of (cert_pem, key_pem) for use with requests library.
        
        Returns:
            tuple: (certificate_path, key_path) or None if not configured
        """
        if not self.pfx_path or not self.passphrase:
            logger.warning("DMVIC certificate not configured")
            return None
        
        # Check if already loaded
        if self._cert and self._key:
            return (self._cert, self._key)
        
        try:
            # Build full path
            if not os.path.isabs(self.pfx_path):
                # Relative to project root
                pfx_full_path = os.path.join(settings.BASE_DIR, self.pfx_path)
            else:
                pfx_full_path = self.pfx_path
            
            # Check if file exists
            if not os.path.exists(pfx_full_path):
                logger.error(f"DMVIC certificate file not found: {pfx_full_path}")
                return None
            
            # Read PFX file
            with open(pfx_full_path, 'rb') as f:
                pfx_data = f.read()
            
            # Load PKCS12 structure using cryptography library
            private_key, certificate, additional_certs = pkcs12.load_key_and_certificates(
                pfx_data,
                self.passphrase.encode()
            )
            
            # Convert to PEM format
            cert_pem = certificate.public_bytes(Encoding.PEM)
            key_pem = private_key.private_bytes(
                Encoding.PEM,
                PrivateFormat.TraditionalOpenSSL,
                NoEncryption()
            )
            
            # Save to temporary files for requests library
            import tempfile
            cert_file = tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.pem')
            key_file = tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.pem')
            
            cert_file.write(cert_pem)
            cert_file.close()
            key_file.write(key_pem)
            key_file.close()
            
            self._cert = cert_file.name
            self._key = key_file.name
            
            logger.info("DMVIC certificate loaded successfully")
            return (self._cert, self._key)
            
        except Exception as e:
            logger.error(f"Failed to load DMVIC certificate: {str(e)}")
            raise DMVICAuthenticationError(f"Certificate loading failed: {str(e)}")

    def ensure_authenticated(self):
        """
        Ensure we have a valid access token.
        Automatically refreshes token if expired.
        """
        # Check if token exists and is still valid
        if self.access_token and self.token_expiry:
            # Handle timezone-aware datetime comparison
            now = datetime.now()
            expiry = self.token_expiry
            
            # Convert to naive datetime if expiry is timezone-aware
            if hasattr(expiry, 'tzinfo') and expiry.tzinfo is not None:
                expiry = expiry.replace(tzinfo=None)
            
            if now < expiry:
                return True
        
        # Token missing or expired, login again
        return self.login()

    def login(self) -> bool:
        """
        DMVIC Login API (V1)
        Authenticates with DMVIC using username/password.
        Returns access token for subsequent API calls.
        
        API Version: 1.8.0
        Endpoint: POST /api/V1/Account/Login
        
        Returns:
            bool: True if login successful, False otherwise
        
        Raises:
            DMVICAuthenticationError: If authentication fails
        """
        try:
            logger.info("Attempting DMVIC login...")
            
            # Load certificate
            cert = self.load_certificate()
            
            # Build login endpoint (API V1)
            login_url = f"{self.base_url}/api/V1/Account/Login"
            
            # Prepare payload (Username and Password as separate emails per API docs)
            payload = {
                "Username": self.username,
                "Password": self.password,
                "ClientID": self.client_id
            }
            
            # Make request with certificate authentication
            # Some DMVIC gateways require headers even for Login
            headers = {
                "Content-Type": "application/json",
                "ClientID": self.client_id or "",
                "ClientId": self.client_id or "",  # be tolerant to casing
            }
            if self.apim_subscription_key:
                headers["Ocp-Apim-Subscription-Key"] = self.apim_subscription_key
            response = requests.post(
                login_url,
                json=payload,
                headers=headers,
                cert=cert,
                timeout=30,
                verify=self.ssl_verify
            )
            
            # Check response
            if response.status_code == 200:
                data = response.json()

                # Extract token (support multiple common response shapes)
                success_block = data.get('Success') if isinstance(data, dict) else None
                if not isinstance(success_block, dict):
                    success_block = {}

                self.access_token = (
                    (data.get('token') if isinstance(data, dict) else None)
                    or (data.get('access_token') if isinstance(data, dict) else None)
                    or success_block.get('token')
                    or success_block.get('access_token')
                )
                
                # Extract APIM subscription key (required for API calls)
                # Prefer ApimSubscriptionKey from login; fallback to settings value
                if isinstance(data, dict):
                    self.apim_subscription_key = (
                        data.get('ApimSubscriptionKey')
                        or success_block.get('ApimSubscriptionKey')
                        or self.apim_subscription_key
                    )
                
                if self.access_token:
                    # Token expiry from response
                    expires_str = None
                    expires_in = None
                    if isinstance(data, dict):
                        expires_str = data.get('expires') or success_block.get('expires')
                        expires_in = data.get('expires_in') or success_block.get('expires_in')

                    if expires_str:
                        from dateutil import parser
                        self.token_expiry = parser.parse(expires_str)
                    elif expires_in:
                        try:
                            self.token_expiry = datetime.now() + timedelta(seconds=int(expires_in))
                        except Exception:
                            self.token_expiry = datetime.now() + timedelta(days=7)
                    else:
                        self.token_expiry = datetime.now() + timedelta(days=7)
                    
                    logger.info(f"DMVIC login successful. Token expires at {self.token_expiry}")
                    if self.apim_subscription_key:
                        logger.info("APIM subscription key captured")
                    return True
                else:
                    error_msg = f"DMVIC login succeeded but no token in response: {data}"
                    logger.error(error_msg)
                    raise DMVICAuthenticationError(error_msg)
            else:
                error_msg = f"DMVIC login failed: {response.status_code} - {response.text}. URL: {login_url}"
                logger.error(error_msg)
                raise DMVICAuthenticationError(error_msg)
                
        except requests.exceptions.RequestException as e:
            error_msg = f"DMVIC login network error: {str(e)}. URL: {login_url}"
            logger.error(error_msg)
            raise DMVICAuthenticationError(error_msg)
        except Exception as e:
            error_msg = f"DMVIC login unexpected error: {str(e)}"
            logger.error(error_msg)
            raise DMVICAuthenticationError(error_msg)

    def _make_authenticated_request(
        self, 
        endpoint: str, 
        method: str = 'GET', 
        data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Make an authenticated request to DMVIC API.
        Automatically handles authentication and retries.
        
        Args:
            endpoint: API endpoint path (e.g., '/api/vehicles/search')
            method: HTTP method (GET, POST, PUT, DELETE)
            data: Request payload (for POST/PUT)
        
        Returns:
            dict: Response data from DMVIC API
        
        Raises:
            DMVICAPIError: If API request fails
        """
        # Ensure we have valid token
        self.ensure_authenticated()
        
        # Build full URL
        url = f"{self.base_url}{endpoint}"
        
        # Load certificate
        cert = self.load_certificate()
        
        # Prepare headers (CRITICAL: ClientID is mandatory for all authenticated requests)
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "ClientID": self.client_id,  # ← DMVIC REQUIREMENT
            "ClientId": self.client_id,  # tolerate casing differences
            "Content-Type": "application/json",
        }
        
        # Add APIM subscription key if available
        if self.apim_subscription_key:
            headers["Ocp-Apim-Subscription-Key"] = self.apim_subscription_key
        
        try:
            # Make request
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, cert=cert, timeout=30, verify=self.ssl_verify)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, cert=cert, timeout=30, verify=self.ssl_verify)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers, cert=cert, timeout=30, verify=self.ssl_verify)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, cert=cert, timeout=30, verify=self.ssl_verify)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            # Handle 401 (token expired) - retry once with new token
            if response.status_code == 401:
                logger.warning("DMVIC token expired, retrying with fresh token...")
                self.access_token = None  # Force re-login
                self.ensure_authenticated()
                
                # Update headers with new token
                headers["Authorization"] = f"Bearer {self.access_token}"
                
                # Retry request
                if method.upper() == 'GET':
                    response = requests.get(url, headers=headers, cert=cert, timeout=30, verify=self.ssl_verify)
                elif method.upper() == 'POST':
                    response = requests.post(url, json=data, headers=headers, cert=cert, timeout=30, verify=self.ssl_verify)
            
            # Check for success
            if response.status_code in [200, 201]:
                return response.json()
            else:
                error_msg = f"DMVIC API error: {response.status_code} - {response.text}. URL: {url}, Payload: {data}"
                logger.error(error_msg)
                raise DMVICAPIError(error_msg)
                
        except requests.exceptions.RequestException as e:
            error_msg = f"DMVIC API network error: {str(e)}. URL: {url}, Payload: {data}"
            logger.error(error_msg)
            raise DMVICAPIError(error_msg)

    def search_vehicle(self, registration_number: str) -> Dict[str, Any]:
        """
        DMVIC Vehicle Search API (v5)
        Searches DMVIC database for vehicle by registration number.
        Returns vehicle details (make, model, year, chassis, etc.)
        
        API Version: 1.8.0
        Endpoint: POST /api/v5/Integration/VehicleSearch
        
        Args:
            registration_number: Vehicle registration number (e.g., 'KCA 123A')
        
        Returns:
            dict: Vehicle details from DMVIC database
                {
                    "registration_number": "KCA123A",
                    "chassis_number": "JTFSH3P26J3012345",
                    "make": "Toyota",
                    "model": "Fielder",
                    "year_of_manufacture": 2015,
                    "engine_capacity": 1500,
                    "vehicle_type": "SALOON",
                    "color": "SILVER",
                    "tonnage": null,
                    "passenger_capacity": 5,
                    "owner_name": "JOHN DOE",
                    "owner_id": "12345678"
                }
        
        Raises:
            DMVICAPIError: If vehicle not found or API error
        """
        logger.info(f"Searching DMVIC for vehicle: {registration_number}")
        
        # Clean registration number (remove spaces, convert to uppercase)
        reg_clean = registration_number.replace(' ', '').upper()
        
        # Build payload - DMVIC API expects PascalCase field names
        payload = {
            "VehicleRegistrationNumber": reg_clean
        }
        
        try:
            # Make API request (v5)
            response = self._make_authenticated_request(
                endpoint='/api/v5/Integration/VehicleSearch',
                method='POST',
                data=payload
            )
            
            # Debug logging - log the raw response
            logger.info(f"DMVIC Raw Response for {reg_clean}: {response}")
            
            # Extract vehicle data from nested structure
            # Most common: {"callbackObj": {"Vehicle": [...], "PolicyHistory": [...]}}
            # Some gateways return vehicle fields at the top level (no callbackObj).
            if isinstance(response, dict) and "callbackObj" in response:
                callback = response.get("callbackObj", {})
                vehicle_data_raw = callback.get("Vehicle", [])
                policy_history = callback.get("PolicyHistory", [])
            else:
                vehicle_data_raw = response if isinstance(response, dict) else {}
                policy_history = []
            
            # Handle both array and object formats for Vehicle
            if isinstance(vehicle_data_raw, list):
                vehicle = vehicle_data_raw[0] if vehicle_data_raw else {}
            elif isinstance(vehicle_data_raw, dict):
                vehicle = vehicle_data_raw
            else:
                vehicle = {}
            
            logger.info(f"Vehicle data type: {type(vehicle_data_raw)}")
            logger.info(f"Vehicle content: {vehicle}")
            logger.info(f"Policy History Count: {len(policy_history)}")
            if policy_history:
                logger.info(f"Policy History: {policy_history}")
            
            # Check if DMVIC returned empty vehicle data (all critical fields empty)
            # NOTE: We now treat responses with non-empty PolicyHistory as valid,
            # even if the Vehicle block is empty. DMVIC sometimes omits vehicle
            # attributes while still returning policy history (e.g. Business
            # Confidential entries). In such cases we still want to surface
            # has_active_cover / policy details to the caller.
            is_empty_vehicle = (
                not vehicle.get("VehicleRegistrationNumber") and
                not vehicle.get("ChassisNumber") and
                not vehicle.get("VehicleMake") and
                not vehicle.get("VehicleModel") and
                not vehicle.get("VehicleRegistrationYear")
            )

            has_policy_history = bool(policy_history)

            if is_empty_vehicle and not has_policy_history:
                logger.warning(
                    f"DMVIC returned empty data for vehicle {reg_clean} - "
                    f"vehicle may not exist in DMVIC database"
                )
                raise DMVICAPIError(
                    f"Vehicle {reg_clean} not found in DMVIC database. "
                    f"The vehicle may not be registered or data is not available in the system. "
                    f"Please verify the registration number or contact support if you believe this is an error."
                )

            # Get latest active policy if exists
            active_policy = None
            latest_expired_policy = None
            
            if policy_history and len(policy_history) > 0:
                from datetime import datetime
                current_date = datetime.now().date()
                
                # Filter for truly active policies (cover end date is in the future)
                active_policies = []
                expired_policies = []
                
                for policy in policy_history:
                    cover_end_str = policy.get("CoverEndDate", "")
                    if cover_end_str:
                        try:
                            # Parse cover end date (format: "2026-01-15" or similar)
                            cover_end_date = datetime.strptime(cover_end_str.split('T')[0], "%Y-%m-%d").date()
                            if cover_end_date >= current_date:
                                active_policies.append(policy)
                            else:
                                expired_policies.append(policy)
                        except (ValueError, AttributeError):
                            # If date parsing fails, include it to be safe
                            active_policies.append(policy)
                
                # If we have active policies, get the one with the latest end date
                if active_policies:
                    active_policy = sorted(
                        active_policies, 
                        key=lambda p: p.get("CoverEndDate", ""), 
                        reverse=True
                    )[0]
                
                # Get the most recently expired policy if no active policy
                if not active_policy and expired_policies:
                    latest_expired_policy = sorted(
                        expired_policies,
                        key=lambda p: p.get("CoverEndDate", ""),
                        reverse=True
                    )[0]
            
            # Transform response to standard format
            vehicle_data = {
                # Basic vehicle information - handle both field name formats
                "registration_number": (
                    vehicle.get("VehicleRegistrationNumber") or 
                    vehicle.get("RegistrationNumber") or 
                    reg_clean
                ),
                "chassis_number": vehicle.get("ChassisNumber"),
                "make": vehicle.get("VehicleMake") or vehicle.get("Make"),
                "model": vehicle.get("VehicleModel") or vehicle.get("Model"),
                "year_of_manufacture": int(
                    vehicle.get("VehicleRegistrationYear") or 
                    vehicle.get("YearOfManufacture") or 0
                ) if (vehicle.get("VehicleRegistrationYear") or vehicle.get("YearOfManufacture")) else None,
                "engine_capacity": vehicle.get("EngineCapacity"),
                "vehicle_type": vehicle.get("BodyType") or vehicle.get("TypeOfBody"),
                "color": vehicle.get("VehicleColour"),
                "tonnage": vehicle.get("Tonnage"),
                "passenger_capacity": (
                    vehicle.get("PassengerCapacity") or 
                    vehicle.get("CarryingCapacity")
                ),
                "owner_name": vehicle.get("OwnerName"),
                "owner_id": vehicle.get("OwnerIdNumber"),
                "engine_number": vehicle.get("EngineNumber"),
                
                # Current insurance cover information (if exists)
                "has_active_cover": active_policy is not None,
                "policy_expiry_date": active_policy.get("CoverEndDate") if active_policy else None,
                "last_policy_expiry_date": latest_expired_policy.get("CoverEndDate") if latest_expired_policy else None,
                "current_policy": {
                    "policy_number": active_policy.get("PolicyNumber") if active_policy else None,
                    "certificate_type": active_policy.get("TypeOfCover") if active_policy else None,
                    "cover_start_date": active_policy.get("CoverStartDate") if active_policy else None,
                    "cover_end_date": active_policy.get("CoverEndDate") if active_policy else None,
                    "member_company": active_policy.get("MemberCompany") if active_policy else None,
                    "insurer_code": None,  # Not provided in vehicle search
                } if active_policy else None,
                
                # Full policy history for reference
                "policy_history": policy_history
            }
            
            logger.info(f"Vehicle found in DMVIC: {vehicle_data.get('make')} {vehicle_data.get('model')}")
            logger.info(f"Total policies in history: {len(policy_history)}")
            logger.info(f"Has active cover: {vehicle_data.get('has_active_cover')}")
            logger.info(f"Policy expiry date: {vehicle_data.get('policy_expiry_date')}")
            logger.info(f"Last policy expiry date: {vehicle_data.get('last_policy_expiry_date')}")
            
            if active_policy:
                logger.info(f"Active cover found: {active_policy.get('MemberCompany')} - Policy: {active_policy.get('PolicyNumber')} - Valid until {active_policy.get('CoverEndDate')}")
            elif latest_expired_policy:
                logger.info(f"Last cover expired on: {latest_expired_policy.get('CoverEndDate')} - Insurer: {latest_expired_policy.get('MemberCompany')}")
            else:
                logger.info("No active cover found (all policies have expired or no policies exist)")
            
            return vehicle_data
            
        except DMVICAPIError as e:
            if '404' in str(e):
                logger.warning(f"Vehicle not found in DMVIC: {reg_clean}")
                raise DMVICAPIError(f"Vehicle {reg_clean} not found in DMVIC database")
            raise

    def validate_double_insurance(self, registration_number: str) -> Dict[str, Any]:
        """
        DMVIC Validate Double Insurance API (v5)
        Checks if vehicle already has active cover from another insurer.
        CRITICAL: Must be called before issuing any certificate.
        
        API Version: 1.8.0
    Endpoint: POST /api/V5/Integration/ValidateDoubleInsurance
        
        Args:
            registration_number: Vehicle registration number
        
        Returns:
            dict: Double insurance check result
                {
                    "exists": True/False,
                    "policy": {
                        "certificate_number": "CHB432123",
                        "insurer": "CIC Insurance",
                        "insurer_code": "CIC",
                        "cover_start_date": "2025-01-01",
                        "cover_end_date": "2026-01-01",
                        "policy_type": "COMPREHENSIVE"
                    } or None
                }
        
        Raises:
            DMVICAPIError: If API request fails
        """
        logger.info(f"Checking double insurance for: {registration_number}")
        
        # Clean registration number
        reg_clean = registration_number.replace(' ', '').upper()
        
        # Build payload
        payload = {
            "registration_number": reg_clean
        }
        
        try:
            # Make API request (v5)
            response = self._make_authenticated_request(
                endpoint='/api/V5/Integration/ValidateDoubleInsurance',
                method='POST',
                data=payload
            )
            
            # Check if active cover exists
            has_active_cover = response.get("hasActiveCover", False)
            
            if has_active_cover:
                # Extract policy details
                result = {
                    "exists": True,
                    "policy": {
                        "certificate_number": response.get("certificateNumber"),
                        "insurer": response.get("insurerName"),
                        "insurer_code": response.get("insurerCode"),
                        "cover_start_date": response.get("coverStartDate"),
                        "cover_end_date": response.get("coverEndDate"),
                        "policy_type": response.get("policyType"),
                        "premium_amount": response.get("premiumAmount")
                    }
                }
                logger.warning(
                    f"Existing cover found for {reg_clean}: "
                    f"{result['policy']['insurer']} (expires {result['policy']['cover_end_date']})"
                )
            else:
                result = {
                    "exists": False,
                    "policy": None
                }
                logger.info(f"No existing cover found for {reg_clean}")
            
            return result
            
        except DMVICAPIError as e:
            logger.error(f"Double insurance validation failed: {str(e)}")
            raise

    def issue_type_a_certificate(self, dmvic_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        DMVIC Issue Type A Certificate API (v5)
        Issues Third-Party certificate to DMVIC.
        
        CRITICAL: This method expects PRE-MAPPED payload from DMVICFieldMapper.
        Do NOT pass raw policy data. Use dmvic_field_mapper.map_to_type_a_payload() first.
        
        API Version: 1.8.0
    Endpoint: POST /api/v5/Integration/IssuanceTypeACertificate
        
        Required Fields in dmvic_payload (EXACT casing from DMVIC spec):
            - TypeOfCertificate: 7 (Type A code)
            - TypeofCover: 200 (TPO) or 300 (TPTF)
            - Chassisnumber: Vehicle chassis number
            - RegistrationNumber: Vehicle registration
            - InsuredName: Client full name (UPPERCASE)
            - Phonenumber: Phone (254712345678 format)
            - InsuredPIN: KRA PIN (UPPERCASE)
            - Bodytype: Vehicle body type code (e.g., "SD")
            - Licensedbodycty: Tonnage or passenger capacity
            - CommencingDate: Cover start (DD/MM/YYYY)
            - ExpiryDate: Cover end (DD/MM/YYYY)
            - hudumanumber: Huduma number (optional)
        
        Args:
            dmvic_payload: DMVIC-compliant payload (from DMVICFieldMapper)
        
        Returns:
            dict: Certificate issuance result from DMVIC
                {
                    "Inputs": { ... },
                    "callbackObj": {
                        "issueCertificate": {
                            "TransactionNo": "Q-AA0108",
                            "actualCNo": "A1020703",
                            "Email": "client@example.com"
                        }
                    },
                    "success": true,
                    "Error": [],
                    "APIRequestNumber": "O-AA0024"
                }
        
        Raises:
            DMVICAPIError: If certificate issuance fails
        """
        logger.info(
            "Issuing Type A certificate for %s",
            dmvic_payload.get('Registrationnumber')
            or dmvic_payload.get('RegistrationNumber')
            or dmvic_payload.get('Registrationnumber'.lower())
        )
        
        # Validate payload has required fields
        from app.services.dmvic_field_mapper import get_dmvic_field_mapper
        mapper = get_dmvic_field_mapper()
        is_valid, missing = mapper.validate_payload(dmvic_payload, 'A')
        
        if not is_valid:
            raise DMVICAPIError(f"Invalid Type A payload. Missing fields: {', '.join(missing)}")
        
        # Use payload as-is (already DMVIC-compliant from field mapper)
        payload = dmvic_payload
        
        try:
            # Try multiple candidate endpoints to handle UAT variations
            candidate_endpoints = [
                '/api/v6/Integration/IssuanceTypeACertificate',
                '/api/v6/Integration/IssueTypeACertificate',
                '/api/v5/Integration/IssuanceTypeACertificate',
                '/api/v5/Integration/IssueTypeACertificate',
                '/api/v4/Integration/IssuanceTypeACertificate',
                '/api/v4/Integration/IssueTypeACertificate',
                '/api/V5/Integration/IssuanceTypeACertificate',
            ]

            last_error = None
            for ep in candidate_endpoints:
                try:
                    response = self._make_authenticated_request(
                        endpoint=ep,
                        method='POST',
                        data=payload
                    )

                    if response.get('success'):
                        callback_obj = response.get('callbackObj', {})
                        issue_cert = callback_obj.get('issueCertificate', {})

                        result = {
                            "certificate_number": issue_cert.get("actualCNo"),
                            "transaction_no": issue_cert.get("TransactionNo"),
                            "api_request_number": response.get("APIRequestNumber"),
                            "email": issue_cert.get("Email"),
                            "status": "ACTIVE"
                        }
                        logger.info(f"Type A certificate issued via {ep}: {result['certificate_number']}")
                        return result
                    else:
                        errors = response.get('Error', [])
                        logger.warning(f"✗ Endpoint {ep} failed: {errors}")
                        last_error = DMVICAPIError(f"Endpoint {ep} failed: {errors}")
                        continue
                except DMVICAPIError as e:
                    logger.warning(f"✗ Endpoint {ep} exception: {str(e)}")
                    last_error = e
                    continue

            # If no endpoint succeeded
            raise last_error or DMVICAPIError("All candidate endpoints failed for Type A issuance")

        except DMVICAPIError as e:
            logger.error(f"Type A certificate issuance failed: {str(e)}")
            raise

    def preview_type_a_certificate(self, dmvic_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        DMVIC Preview Type A Certificate API (v5)
        Generates a PREVIEW of Type A certificate WITHOUT official registration.
        Use this for testing before issuing actual certificates.
        
        API Version: 1.8.0
    Endpoint: POST /api/V5/Integration/PreviewTypeACertificate
        
        Note: Preview certificates:
        - Are NOT registered in DMVIC official system
        - Do NOT get certificate numbers
        - PDF URL expires in 24 hours
        - Perfect for testing integration
        
        Args:
            dmvic_payload: DMVIC-compliant payload (same as issue_type_a_certificate)
        
        Returns:
            dict: Preview result
                {
                    "preview_url": "https://dmvic.com/preview/xyz.pdf",
                    "api_request_number": "O-AA0030",
                    "expires_at": "2025-11-04T10:30:00Z"
                }
        """
        logger.info(f"Previewing Type A certificate for {dmvic_payload.get('Registrationnumber') or dmvic_payload.get('RegistrationNumber')}")

        # Per DMVIC spec (4.4.9), TypeOfCertificate IS included in preview payload
        # Use the payload as provided by the field mapper (no stripping)
        payload = dict(dmvic_payload)

        try:
            # Try multiple API versions from DMVIC spec documentation
            candidate_endpoints = [
                '/api/v4/Integration/PreviewTypeACertificate',  # v1.7
                '/api/VC3/Integration/PreviewTypeACertificate',  # v1.7.1
                '/api/v5/Integration/PreviewTypeACertificate',  # v1.8.0
                '/api/V5/Integration/PreviewTypeACertificate',  # v1.8.0 uppercase
            ]

            last_error = None
            for ep in candidate_endpoints:
                try:
                    logger.info(f"Trying preview endpoint: {ep}")
                    response = self._make_authenticated_request(
                        endpoint=ep,
                        method='POST',
                        data=payload
                    )

                    if response.get('success'):
                        callback_obj = response.get('callbackObj', {})
                        result = {
                            "preview_url": callback_obj.get("previewCertificateURL"),
                            "api_request_number": response.get("APIRequestNumber"),
                            "expires_in": "24 hours"
                        }
                        logger.info(f"✓ Preview certificate generated via {ep}")
                        return result
                    else:
                        errors = response.get('Error', [])
                        logger.warning(f"✗ Endpoint {ep} failed: {errors}")
                        last_error = DMVICAPIError(f"Preview endpoint {ep} failed: {errors}")
                        continue
                except DMVICAPIError as e:
                    logger.warning(f"✗ Endpoint {ep} exception: {str(e)}")
                    last_error = e
                    continue

            raise last_error or DMVICAPIError("All candidate endpoints failed for Type A preview")

        except DMVICAPIError as e:
            logger.error(f"Type A preview failed: {str(e)}")
            raise

    def issue_type_b_certificate(self, dmvic_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        DMVIC Issue Type B Certificate API (v5)
        Issues Comprehensive certificate to DMVIC.
        
        CRITICAL: This method expects PRE-MAPPED payload from DMVICFieldMapper.
        Do NOT pass raw policy data. Use dmvic_field_mapper.map_to_type_b_payload() first.
        
        API Version: 1.8.0
        Endpoint: POST /api/v5/Integration/IssuanceTypeBCertificate
        
        Required Fields in dmvic_payload (EXACT casing from DMVIC example):
            - TypeOfCertificate: 8 (Type B code)
            - Typeofcover: 100 (Comprehensive)
            - Chassisnumber: Vehicle chassis number
            - Registrationnumber: Vehicle registration
            - Phonenumber: Phone (254712345678 format)
            - InsuredPIN: KRA PIN (UPPERCASE)
            - Bodytype: Vehicle body type code
            - Licensedtocarry: Tonnage or passenger capacity
            - Commencingdate: Cover start (DD/MM/YYYY)
            - Expiringdate: Cover end (DD/MM/YYYY)
            - SumInsured: Vehicle value
            - HudumaNumber: Huduma number (optional)
        
        Args:
            dmvic_payload: DMVIC-compliant payload (from DMVICFieldMapper)
        
        Returns:
            dict: Certificate issuance result (from DMVIC response)
        
        Raises:
            DMVICAPIError: If certificate issuance fails
        """
        logger.info(f"Issuing Type B certificate for {dmvic_payload.get('Registrationnumber') or dmvic_payload.get('RegistrationNumber')}")
        
        # Validate payload has required fields
        from app.services.dmvic_field_mapper import get_dmvic_field_mapper
        mapper = get_dmvic_field_mapper()
        is_valid, missing = mapper.validate_payload(dmvic_payload, 'B')
        
        if not is_valid:
            raise DMVICAPIError(f"Invalid Type B payload. Missing fields: {', '.join(missing)}")
        
        # Use payload as-is (already DMVIC-compliant from field mapper)
        payload = dmvic_payload
        
        try:
            # Try multiple candidate endpoints (UAT differences)
            candidate_endpoints = [
                '/api/v5/Integration/IssuanceTypeBCertificate',
                '/api/v5/Integration/IssueTypeBCertificate',
                '/api/v4/Integration/IssuanceTypeBCertificate',
                '/api/v4/Integration/IssueTypeBCertificate',
            ]

            last_error = None
            for ep in candidate_endpoints:
                try:
                    response = self._make_authenticated_request(
                        endpoint=ep,
                        method='POST',
                        data=payload
                    )

                    # Expect v5-style envelope when success
                    if response.get('success'):
                        callback_obj = response.get('callbackObj', {})
                        issue_cert = callback_obj.get('issueCertificate', {})
                        result = {
                            "certificate_number": issue_cert.get("actualCNo"),
                            "transaction_no": issue_cert.get("TransactionNo"),
                            "api_request_number": response.get("APIRequestNumber"),
                            "email": issue_cert.get("Email"),
                            "status": "ACTIVE"
                        }
                        logger.info(f"Type B certificate issued via {ep}: {result['certificate_number']}")
                        return result
                    else:
                        errors = response.get('Error', [])
                        last_error = DMVICAPIError(f"Endpoint {ep} failed: {errors}")
                        continue
                except DMVICAPIError as e:
                    last_error = e
                    continue

            # If we get here, all candidates failed
            raise last_error or DMVICAPIError("All candidate endpoints failed for Type B issuance")
            
            logger.info(f"Type B certificate issued: {result['certificate_number']}")
            return result
            
        except DMVICAPIError as e:
            logger.error(f"Type B certificate issuance failed: {str(e)}")
            raise

    def issue_type_c_certificate(self, dmvic_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        DMVIC Issue Type C Certificate API (v5)
        Issues Type C certificate via /IssuanceTypeCCertificate.

        CRITICAL differences vs A/B:
        - Do NOT include TypeOfCertificate in payload (per v1.8.0 doc 4.4.3)
        - Registrationnumber is optional
        - SumInsured required only for Typeofcover=100 or 300

    Endpoint (primary): POST /api/v5/Integration/IssuanceTypeCCertificate
        Fallbacks tried (UAT variations):
          - /api/v5/Integration/IssueTypeCCertificate
          - /api/v4/Integration/IssuanceTypeCCertificate

        Returns v5-style envelope on success.
        """
        logger.info(
            f"Issuing Type C certificate for {dmvic_payload.get('Registrationnumber') or dmvic_payload.get('RegistrationNumber')}"
        )

        # Validate payload using mapper rules for Type C
        from app.services.dmvic_field_mapper import get_dmvic_field_mapper
        mapper = get_dmvic_field_mapper()
        is_valid, missing = mapper.validate_payload(dmvic_payload, 'C')
        if not is_valid:
            raise DMVICAPIError(f"Invalid Type C payload. Missing fields: {', '.join(missing)}")

        payload = dmvic_payload

        try:
            candidate_endpoints = [
                '/api/v5/Integration/IssuanceTypeCCertificate',
                '/api/v5/Integration/IssueTypeCCertificate',
                '/api/v4/Integration/IssuanceTypeCCertificate',
                '/api/v4/Integration/IssueTypeCCertificate',
            ]

            last_error = None
            for ep in candidate_endpoints:
                try:
                    response = self._make_authenticated_request(
                        endpoint=ep,
                        method='POST',
                        data=payload
                    )

                    if response.get('success'):
                        callback_obj = response.get('callbackObj', {})
                        issue_cert = callback_obj.get('issueCertificate', {})
                        result = {
                            "certificate_number": issue_cert.get("actualCNo"),
                            "transaction_no": issue_cert.get("TransactionNo"),
                            "api_request_number": response.get("APIRequestNumber"),
                            "email": issue_cert.get("Email"),
                            "status": "ACTIVE",
                        }
                        # If DMVIC returns an IssuanceRequestID flow, surface it
                        if callback_obj.get('IssuanceRequestID') and not result["certificate_number"]:
                            result.update({
                                "issuance_request_id": callback_obj.get('IssuanceRequestID'),
                                "status": "PENDING_CONFIRMATION"
                            })
                        logger.info(f"Type C certificate issued via {ep}: {result}")
                        return result
                    else:
                        errors = response.get('Error', [])
                        last_error = DMVICAPIError(f"Endpoint {ep} failed: {errors}")
                        continue
                except DMVICAPIError as e:
                    last_error = e
                    continue

            raise last_error or DMVICAPIError("All candidate endpoints failed for Type C issuance")

        except DMVICAPIError as e:
            logger.error(f"Type C certificate issuance failed: {str(e)}")
            raise

    def issue_type_d_certificate(self, dmvic_payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        DMVIC Issue Type D Certificate API (v4)
        Issues Comprehensive + PLL certificate to DMVIC.
        
        Type D uses same payload structure as Type B (Comprehensive).
        PLL coverage is indicated separately (not in main certificate payload).
        
        API Version: 1.8.0
    Endpoint: POST /api/V4/Integration/IssueTypeBCertificate (uses Type B endpoint)
        
        Args:
            dmvic_payload: DMVIC-compliant payload (from DMVICFieldMapper.map_to_type_d_payload)
        
        Returns:
            dict: Certificate issuance result
        
        Raises:
            DMVICAPIError: If certificate issuance fails
        """
        logger.info(f"Issuing Type D certificate (COMP+PLL) for {dmvic_payload.get('RegistrationNumber')}")
        
        # Type D uses Type B endpoint with same payload structure
        return self.issue_type_b_certificate(dmvic_payload)

    def get_certificate_pdf(self, certificate_number: str) -> bytes:
        """Download DMVIC certificate PDF bytes for a certificate number."""
        logger.info(f"Downloading certificate PDF: {certificate_number}")
        
        try:
            # Build URL
            url = f"{self.base_url}/api/certificates/{certificate_number}/pdf"
            
            # Ensure authenticated
            self.ensure_authenticated()
            
            # Load certificate
            cert = self.load_certificate()
            
            # Prepare headers
            headers = {
                "Authorization": f"Bearer {self.access_token}"
            }
            
            # Make request
            response = requests.get(url, headers=headers, cert=cert, timeout=60, verify=self.ssl_verify)
            
            if response.status_code == 200:
                logger.info(f"Certificate PDF downloaded: {len(response.content)} bytes")
                return response.content
            else:
                error_msg = f"Certificate PDF download failed: {response.status_code}"
                logger.error(error_msg)
                raise DMVICAPIError(error_msg)
                
        except requests.exceptions.RequestException as e:
            error_msg = f"Certificate PDF download network error: {str(e)}"
            logger.error(error_msg)
            raise DMVICAPIError(error_msg)

    def validate_certificate(self, certificate_number: str, certificate_type: str = 'A') -> Dict[str, Any]:
        """Validate DMVIC certificate authenticity (Type A/B)."""
        logger.info(f"Validating certificate: {certificate_number} (Type {certificate_type})")
        
        # Build payload
        payload = {
            "certificate_number": certificate_number,
            "certificate_type": certificate_type
        }
        
        try:
            # Make API request
            response = self._make_authenticated_request(
                endpoint=f'/api/certificates/validate/type-{certificate_type.lower()}',
                method='POST',
                data=payload
            )
            
            # Extract validation result
            result = {
                "valid": response.get("isValid", False),
                "certificate_number": response.get("certificateNumber"),
                "status": response.get("status"),
                "registration_number": response.get("registrationNumber"),
                "insurer": response.get("insurerName"),
                "cover_start_date": response.get("coverStartDate"),
                "cover_end_date": response.get("coverEndDate")
            }
            
            logger.info(f"Certificate validation result: {result['valid']}")
            return result
            
        except DMVICAPIError as e:
            logger.error(f"Certificate validation failed: {str(e)}")
            raise

    def cancel_certificate(self, certificate_number: str, reason: str) -> Dict[str, Any]:
        """Cancel an issued DMVIC certificate via v5 API (debit note flow)."""
        logger.info(f"Cancelling certificate: {certificate_number}")
        
        # Build payload
        payload = {
            "certificate_number": certificate_number,
            "cancellation_reason": reason,
            "cancelled_by": self.username
        }
        
        try:
            # Make API request (v5)
            response = self._make_authenticated_request(
                endpoint='/api/V5/Integration/CancelCertificate',
                method='POST',
                data=payload
            )
            
            # Extract result
            result = {
                "success": response.get("success", False),
                "certificate_number": response.get("certificateNumber"),
                "cancelled_at": response.get("cancelledAt"),
                "debit_note_number": response.get("debitNoteNumber")
            }
            
            logger.info(f"Certificate cancelled: {certificate_number}")
            return result
            
        except DMVICAPIError as e:
            logger.error(f"Certificate cancellation failed: {str(e)}")
            raise

    def confirm_certificate_issuance(
        self,
        issuance_request_id: str,
        is_approved: bool,
        is_logbook_verified: bool,
        is_vehicle_inspected: bool,
        additional_comments: str = "",
        username: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        4.15 Logbook Verify and Submit (ConfirmCertificateIssuance)

        Endpoint: POST /api/v5/Integration/ConfirmCertificateIssuance
        Headers: Authorization: Bearer <token>, ClientID: <id>
        Body (case-insensitive per spec):
          - IssuanceRequestID (Yes)
          - IsApproved (Yes)
          - IsLogBookVerified (Yes)
          - IsVehicleInspected (Yes)
          - AdditionalComments (Yes)
          - UserName (Yes)
        """
        logger.info(f"Confirming issuance: {issuance_request_id}")

        payload = {
            "IssuanceRequestID": issuance_request_id,
            "IsApproved": bool(is_approved),
            "IsLogBookVerified": bool(is_logbook_verified),
            "IsVehicleInspected": bool(is_vehicle_inspected),
            "AdditionalComments": additional_comments or "",
            "UserName": username or (self.username or ""),
        }

        try:
            response = self._make_authenticated_request(
                endpoint='/api/v5/Integration/ConfirmCertificateIssuance',
                method='POST',
                data=payload,
            )

            if response.get('success'):
                callback_obj = response.get('callbackObj', {})
                issue_cert = callback_obj.get('issueCertificate', {})
                return {
                    "certificate_number": issue_cert.get("actualCNo"),
                    "transaction_no": issue_cert.get("TransactionNo"),
                    "email": issue_cert.get("Email"),
                    "api_request_number": response.get("APIRequestNumber"),
                    "status": "ACTIVE",
                }
            else:
                errors = response.get('Error', [])
                raise DMVICAPIError(f"ConfirmCertificateIssuance failed: {errors}")

        except DMVICAPIError as e:
            logger.error(f"Confirm issuance failed: {str(e)}")
            raise

    # =========================================================================
    # HELPER FUNCTIONS FOR DMVIC INTERMEDIARY INTEGRATION
    # =========================================================================

    def _determine_certificate_type(self, body_type: str, cover_type: str) -> int:
        """
        Determine DMVIC certificate type based on vehicle body type and coverage.
        
        Certificate Types (from DMVIC API spec):
        - 7: Private
        - 8: PSV/Taxi
        - 9: Commercial
        
        Args:
            body_type: Vehicle body type (e.g., 'SALOON', 'MINIBUS', 'LORRY')
            cover_type: Coverage type ('COMPREHENSIVE', 'THIRD_PARTY', 'TPTF')
        
        Returns:
            int: Certificate type code (7, 8, or 9)
        """
        body_type = (body_type or '').upper()
        
        # PSV/Taxi types (Type 8)
        psv_types = [
            'TAXI', 'MINIBUS', 'BUS', 'MATATU', 'PSV', 
            'OMNIBUS', 'PASSENGER SERVICE VEHICLE'
        ]
        
        # Commercial types (Type 9)
        commercial_types = [
            'LORRY', 'TRUCK', 'VAN', 'PICKUP', 'TRAILER',
            'TIPPER', 'TANKER', 'PRIME MOVER', 'TRACTOR'
        ]
        
        # Check PSV first
        if any(psv in body_type for psv in psv_types):
            return 8
        
        # Check commercial
        if any(comm in body_type for comm in commercial_types):
            return 9
        
        # Default to private (Type 7) for cars, sedans, SUVs, etc.
        return 7

    def _prepare_dmvic_payload(self, policy_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform Motor3/MotorPolicy data to DMVIC IntermediaryIntegration payload format.
        
        Handles:
        - Chassis number cleaning (remove hyphens)
        - Year conversion (2-digit to 4-digit)
        - Date formatting (YYYY-MM-DD to DD/MM/YYYY)
        - Cover type mapping (COMPREHENSIVE → 100, THIRD_PARTY → 200, TPTF → 300)
        - Certificate type determination
        
        Args:
            policy_data: Dictionary with motor policy/quotation data
        
        Returns:
            dict: DMVIC-formatted payload ready for API submission
        """
        from datetime import datetime
        
        # Extract and clean vehicle data
        registration_no = policy_data.get('registration_number', '')
        chassis_no = policy_data.get('chassis_number', '').replace('-', '').replace(' ', '')
        engine_no = policy_data.get('engine_number', '')
        
        # Year conversion (handle 2-digit to 4-digit)
        year_of_manufacture = policy_data.get('year_of_manufacture', '')
        if year_of_manufacture:
            year_str = str(year_of_manufacture)
            if len(year_str) == 2:
                # Convert 2-digit to 4-digit (e.g., '13' → '2013')
                year_int = int(year_str)
                current_year_2digit = datetime.now().year % 100
                if year_int <= current_year_2digit:
                    year_of_manufacture = 2000 + year_int
                else:
                    year_of_manufacture = 1900 + year_int
            else:
                year_of_manufacture = int(year_str)
        
        # Cover type mapping
        cover_type = policy_data.get('cover_type', 'THIRD_PARTY').upper()
        cover_type_map = {
            'COMPREHENSIVE': 100,
            'THIRD_PARTY': 200,
            'TPTF': 300,
            'THIRD_PARTY_FIRE_THEFT': 300,
        }
        cover_type_code = cover_type_map.get(cover_type, 200)
        
        # Determine certificate type
        body_type = policy_data.get('body_type', '')
        cert_type = self._determine_certificate_type(body_type, cover_type)
        
        # Date formatting helper
        def format_dmvic_date(date_input):
            """Convert date to DD/MM/YYYY format"""
            if not date_input:
                return datetime.now().strftime('%d/%m/%Y')
            
            if isinstance(date_input, str):
                # Try parsing different formats
                for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%Y-%m-%d %H:%M:%S']:
                    try:
                        dt = datetime.strptime(date_input, fmt)
                        return dt.strftime('%d/%m/%Y')
                    except ValueError:
                        continue
                # If parsing fails, return today
                return datetime.now().strftime('%d/%m/%Y')
            elif hasattr(date_input, 'strftime'):
                # datetime object
                return date_input.strftime('%d/%m/%Y')
            else:
                return datetime.now().strftime('%d/%m/%Y')
        
        # Policyholder data
        customer_name = policy_data.get('customer_name', '')
        if not customer_name:
            # Try alternative fields
            first_name = policy_data.get('first_name', '')
            last_name = policy_data.get('last_name', '')
            customer_name = f"{first_name} {last_name}".strip()
        
        customer_id_no = policy_data.get('id_number', '') or policy_data.get('customer_id_no', '')
        phone_no = policy_data.get('phone_number', '') or policy_data.get('customer_phone', '')
        email = policy_data.get('email', '') or policy_data.get('customer_email', '')
        postal_address = policy_data.get('postal_address', '') or policy_data.get('customer_address', '')
        
        # Policy dates
        policy_start_date = format_dmvic_date(policy_data.get('start_date') or policy_data.get('cover_from'))
        policy_end_date = format_dmvic_date(policy_data.get('end_date') or policy_data.get('cover_to'))
        
        # Policy details
        policy_number = policy_data.get('policy_number', '')
        sum_insured = policy_data.get('sum_insured', 0)
        premium_amount = policy_data.get('premium', 0) or policy_data.get('total_premium', 0)
        
        # Vehicle details
        make = policy_data.get('make', '')
        model = policy_data.get('model', '')
        color = policy_data.get('color', '')
        seating_capacity = policy_data.get('seating_capacity', 0) or policy_data.get('seats', 0)
        
        # Build DMVIC payload
        payload = {
            "MemberCompanyID": int(getattr(settings, 'DMVIC_MEMBER_COMPANY_ID', 97218)),
            "CertificateType": cert_type,
            "CoverType": cover_type_code,
            "RegistrationNo": registration_no,
            "ChassisNo": chassis_no,
            "EngineNo": engine_no,
            "YearOfManufacture": int(year_of_manufacture) if year_of_manufacture else 0,
            "Make": make,
            "Model": model,
            "BodyType": body_type,
            "Color": color,
            "SeatingCapacity": int(seating_capacity) if seating_capacity else 0,
            "PolicyNumber": policy_number,
            "PolicyStartDate": policy_start_date,
            "PolicyEndDate": policy_end_date,
            "SumInsured": float(sum_insured) if sum_insured else 0.0,
            "PremiumAmount": float(premium_amount) if premium_amount else 0.0,
            "CustomerName": customer_name,
            "CustomerIDNo": customer_id_no,
            "CustomerPhoneNo": phone_no,
            "CustomerEmail": email,
            "CustomerPostalAddress": postal_address,
        }
        
        logger.info(f"Prepared DMVIC payload for {registration_no}: CertType={cert_type}, CoverType={cover_type_code}")
        return payload

    # =========================================================================
    # DMVIC INTERMEDIARY INTEGRATION ENDPOINTS
    # =========================================================================

    def preview_type_a_certificate_intermediary(
        self, 
        policy_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate preview of Type A certificate using Intermediary Integration endpoint.
        
        Endpoint: POST /api/v6/IntermediaryIntegration/PreviewTypeACertificate
        
        This works WITHOUT inventory allocation (returns Azure Blob URL).
        
        Args:
            policy_data: Dictionary containing motor policy/quotation data
        
        Returns:
            dict: {
                'success': bool,
                'preview_url': str (Azure Blob URL with SAS token),
                'certificate_type': int,
                'errors': list
            }
        """
        logger.info(f"Generating certificate preview for {policy_data.get('registration_number')}")
        
        try:
            # Prepare payload
            payload = self._prepare_dmvic_payload(policy_data)
            
            # Make API request
            response = self._make_authenticated_request(
                endpoint='/api/v6/IntermediaryIntegration/PreviewTypeACertificate',
                method='POST',
                data=payload
            )
            
            success = response.get('Success', False)
            errors = response.get('Error', [])
            
            if success:
                preview_url = response.get('PreviewUrl', '')
                return {
                    'success': True,
                    'preview_url': preview_url,
                    'certificate_type': payload.get('CertificateType'),
                    'errors': [],
                }
            else:
                logger.warning(f"Preview generation returned errors: {errors}")
                return {
                    'success': False,
                    'preview_url': None,
                    'certificate_type': payload.get('CertificateType'),
                    'errors': errors,
                }
                
        except Exception as e:
            logger.error(f"Preview generation failed: {str(e)}")
            return {
                'success': False,
                'preview_url': None,
                'certificate_type': None,
                'errors': [str(e)],
            }

    def validate_type_a_certificate_intermediary(
        self, 
        policy_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate Type A certificate data before actual issuance.
        
        Endpoint: POST /api/v6/IntermediaryIntegration/ValidateTypeACertificate
        
        Returns validation errors (ER007 warnings, ER004 date errors, etc.)
        May return ER006 if no inventory allocated.
        
        Args:
            policy_data: Dictionary containing motor policy/quotation data
        
        Returns:
            dict: {
                'success': bool,
                'is_valid': bool,
                'warnings': list,
                'errors': list
            }
        """
        logger.info(f"Validating certificate for {policy_data.get('registration_number')}")
        
        try:
            payload = self._prepare_dmvic_payload(policy_data)
            
            response = self._make_authenticated_request(
                endpoint='/api/v6/IntermediaryIntegration/ValidateTypeACertificate',
                method='POST',
                data=payload
            )
            
            success = response.get('Success', False)
            errors = response.get('Error', [])
            
            # Check for warnings vs critical errors
            warnings = [err for err in errors if err.get('ErrorCode') in ['ER007', 'ER001']]
            critical_errors = [err for err in errors if err.get('ErrorCode') not in ['ER007', 'ER001']]
            
            return {
                'success': success,
                'is_valid': success or (len(critical_errors) == 0),
                'warnings': warnings,
                'errors': critical_errors,
            }
            
        except Exception as e:
            logger.error(f"Validation failed: {str(e)}")
            return {
                'success': False,
                'is_valid': False,
                'warnings': [],
                'errors': [{'ErrorCode': 'EXCEPTION', 'ErrorMessage': str(e)}],
            }

    def issue_type_a_certificate_intermediary(
        self, 
        policy_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Issue actual Type A certificate using Intermediary Integration endpoint.
        
        Endpoint: POST /api/v6/IntermediaryIntegration/IssuanceTypeACertificate
        
        **WILL FAIL WITH ER006 until DMVIC allocates PSV sticker inventory.**
        
        Args:
            policy_data: Dictionary containing motor policy/quotation data
        
        Returns:
            dict: {
                'success': bool,
                'certificate_number': str,
                'transaction_no': str,
                'ref_no': str,
                'certificate_pdf_url': str,
                'errors': list
            }
        """
        logger.info(f"Issuing certificate for {policy_data.get('registration_number')}")
        
        try:
            payload = self._prepare_dmvic_payload(policy_data)
            
            response = self._make_authenticated_request(
                endpoint='/api/v6/IntermediaryIntegration/IssuanceTypeACertificate',
                method='POST',
                data=payload
            )
            
            success = response.get('Success', False)
            errors = response.get('Error', [])
            
            if success:
                # Extract certificate details from response
                certificate_number = response.get('CertificateNumber', '')
                transaction_no = response.get('TransactionNo', '')
                ref_no = response.get('RefNo', '')
                pdf_url = response.get('CertificatePdfUrl', '')
                
                return {
                    'success': True,
                    'certificate_number': certificate_number,
                    'transaction_no': transaction_no,
                    'ref_no': ref_no,
                    'certificate_pdf_url': pdf_url,
                    'errors': [],
                }
            else:
                # Check for ER006 (no inventory)
                has_er006 = any(err.get('ErrorCode') == 'ER006' for err in errors)
                if has_er006:
                    logger.warning("Certificate issuance failed: ER006 - No inventory allocated")
                
                return {
                    'success': False,
                    'certificate_number': None,
                    'transaction_no': None,
                    'ref_no': None,
                    'certificate_pdf_url': None,
                    'errors': errors,
                }
                
        except Exception as e:
            logger.error(f"Certificate issuance failed: {str(e)}")
            return {
                'success': False,
                'certificate_number': None,
                'transaction_no': None,
                'ref_no': None,
                'certificate_pdf_url': None,
                'errors': [{'ErrorCode': 'EXCEPTION', 'ErrorMessage': str(e)}],
            }


# Singleton instance
_dmvic_service_instance = None


def get_dmvic_service():
    """Get or create singleton DMVIC service instance."""
    global _dmvic_service_instance
    if _dmvic_service_instance is None:
        _dmvic_service_instance = DMVICService()
    return _dmvic_service_instance

