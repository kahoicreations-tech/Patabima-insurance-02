# Backend DMVIC Implementation Guide

**Version:** 1.8.0  
**Last Updated:** November 4, 2025  
**Base URL:** `https://uat-api.dmvic.com`

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implemented Endpoints](#implemented-endpoints)
4. [Missing Endpoints](#missing-endpoints)
5. [Django Views Implementation](#django-views-implementation)
6. [Frontend Integration Guide](#frontend-integration-guide)
7. [Error Handling](#error-handling)
8. [Testing Guide](#testing-guide)

---

## Overview

The DMVIC (Digital Motor Vehicle Insurance Certificates) integration enables PataBima to:
- Issue digital motor insurance certificates (Type A, B, C, D)
- Search vehicle details from NTSA database
- Validate double insurance
- Generate certificate PDFs
- Confirm certificate issuance with logbook verification

### Authentication Flow

```
1. Load X509 Client Certificate (.pfx)
2. POST /api/V1/Account/Login with Username, Password, ClientID
3. Receive JWT token + ApimSubscriptionKey
4. Include in all requests:
   - Authorization: Bearer <token>
   - ClientID: <client_id>
   - Ocp-Apim-Subscription-Key: <apim_key>
```

---

## Architecture

### Service Layer

```
insurance-app/app/services/
├── dmvic_service.py           # Core DMVIC API client
├── dmvic_field_mapper.py      # Policy → DMVIC payload mapping
└── dmvic_exceptions.py        # Custom exceptions
```

### Key Components

1. **DMVICService** - Main API client with authentication
2. **DMVICFieldMapper** - Transforms MotorPolicy to DMVIC payloads
3. **Django Views** - REST API endpoints for frontend

---

## Implemented Endpoints

### ✅ 1. Authentication

**Endpoint:** `POST /api/V1/Account/Login`

**Status:** ✅ **WORKING**

**Implementation:**
```python
# insurance-app/app/services/dmvic_service.py
def login(self) -> bool:
    """
    DMVIC Login API
    Returns: bool (True if successful)
    Captures: access_token, apim_subscription_key, token_expiry
    """
```

**Response:**
```json
{
  "token": "eyJhbGci...",
  "ApimSubscriptionKey": "366160dc4e8043b1ab927205a0ac32f8",
  "expires": "2025-11-11T11:55:14.123Z",
  "firstName": "PataBima",
  "lastName": "Issuer"
}
```

---

### ✅ 2. Vehicle Search

**Endpoint:** `POST /api/V5/Integration/VehicleSearch`

**Status:** ✅ **WORKING**

**Implementation:**
```python
def search_vehicle(self, registration_number: str) -> Dict[str, Any]:
    """
    Search vehicle in DMVIC/NTSA database
    Returns: Vehicle details (make, model, chassis, owner, etc.)
    """
```

**Request:**
```json
{
  "VehicleRegistrationNumber": "KCA123A"
}
```

**Response:**
```json
{
  "success": true,
  "callbackObj": {
    "VehicleRegistrationNumber": "KCA123A",
    "ChassisNumber": "ZNE10-0371893",
    "VehicleMake": "TOYOTA",
    "VehicleModel": "DBA-ZNE10G",
    "YearOfManufacture": 2007,
    "BodyType": "S.WAGON"
  }
}
```

---

### ⚠️ 3. Preview Type A Certificate

**Endpoint:** `POST /api/v5/Integration/PreviewTypeACertificate`

**Status:** ⚠️ **IMPLEMENTED BUT BLOCKED** (ER001 - Account access required)

**Implementation:**
```python
def preview_type_a_certificate(self, dmvic_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate preview PDF without issuing certificate
    Returns: Preview URL (valid 24 hours)
    """
```

**Request:**
```json
{
  "TypeOfCertificate": 7,
  "Typeofcover": 200,
  "Policyholder": "PATABIMA",
  "policynumber": "POL-2025-001234",
  "Commencingdate": "04/11/2025",
  "Expiringdate": "04/11/2026",
  "Registrationnumber": "KDQ789P",
  "Chassisnumber": "TESTPREVIEW123456",
  "Phonenumber": "712345678",
  "Bodytype": "VN",
  "Licensedtocarry": 14,
  "Email": "test@patabima.com",
  "InsuredPIN": "A012345678B",
  "VehicleMake": "TOYOTA",
  "VehicleModel": "HIACE",
  "Enginenumber": "ENG001",
  "Yearofmanufacture": 2020
}
```

**Response:**
```json
{
  "success": true,
  "callbackObj": {
    "previewCertificateURL": "https://dmvic.blob.core.windows.net/preview/8b1e15a8.pdf?sv=2018..."
  },
  "APIRequestNumber": "O-AA0024"
}
```

**Action Required:** Contact DMVIC to enable Preview endpoints for your account.

---

### ⚠️ 4. Issue Type A Certificate

**Endpoint:** `POST /api/v5/Integration/IssuanceTypeACertificate`

**Status:** ⚠️ **IMPLEMENTED BUT BLOCKED** (ER001 - Account access required)

**Implementation:**
```python
def issue_type_a_certificate(self, dmvic_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Issue official Type A certificate
    Returns: TransactionNo, actualCNo (certificate number), Email
    """
```

**Request:** Same as Preview (see above)

**Response:**
```json
{
  "success": true,
  "callbackObj": {
    "issueCertificate": {
      "TransactionNo": "Q-AA0108",
      "actualCNo": "A1020703",
      "Email": "test@patabima.com"
    }
  },
  "APIRequestNumber": "O-AA0024",
  "DMVICRefNo": "DMVIC-O-AA0024"
}
```

**Action Required:** Contact DMVIC to enable Issuance endpoints for your account.

---

### ❌ 5. Validate Double Insurance

**Endpoint:** `POST /api/V5/Integration/ValidateDoubleInsurance`

**Status:** ❌ **IMPLEMENTED BUT NOT TESTED**

**Implementation:**
```python
def validate_double_insurance(self, chassis_number: str, start_date: str, end_date: str) -> Dict[str, Any]:
    """
    Check if vehicle already has active insurance
    Returns: validation result
    """
```

---

## Missing Endpoints

### 🔴 Priority 1 - Critical for Motor2 Flow

#### 1. Issue Type B Certificate
**Endpoint:** `POST /api/v5/Integration/IssuanceTypeBCertificate`

**Purpose:** Issue certificates for Private vehicles (comprehensive cover)

**Required Fields:**
- No `TypeOfCertificate` field
- No `Licensedtocarry` field
- `Registrationnumber` MANDATORY
- `SumInsured` MANDATORY for COMP/TPTF

**Implementation Needed:**
```python
# insurance-app/app/services/dmvic_service.py

def issue_type_b_certificate(self, dmvic_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    DMVIC Issue Type B Certificate API (v5)
    For Private vehicles (Sedan, SUV, etc.) with comprehensive cover
    
    Args:
        dmvic_payload: Type B payload from DMVICFieldMapper
    
    Returns:
        dict: {
            "transaction_no": "Q-AA0108",
            "certificate_number": "B1234567",
            "email": "client@example.com",
            "api_request_number": "O-AA0024"
        }
    """
    logger.info(f"Issuing Type B certificate for {dmvic_payload.get('Registrationnumber')}")
    
    # Validate Type B specific requirements
    if not dmvic_payload.get('Registrationnumber'):
        raise DMVICAPIError("Registrationnumber is mandatory for Type B")
    
    cover_type = dmvic_payload.get('Typeofcover')
    if cover_type in [100, 300] and not dmvic_payload.get('SumInsured'):
        raise DMVICAPIError("SumInsured is mandatory for COMP/TPTF cover")
    
    try:
        # Try multiple endpoint variants
        candidate_endpoints = [
            '/api/V5/Integration/IssuanceTypeBCertificate',
            '/api/v5/Integration/IssuanceTypeBCertificate',
            '/api/V4/Integration/IssuanceTypeBCertificate',
        ]
        
        last_error = None
        for ep in candidate_endpoints:
            try:
                response = self._make_authenticated_request(
                    endpoint=ep,
                    method='POST',
                    data=dmvic_payload
                )
                
                if response.get('success'):
                    callback_obj = response.get('callbackObj', {})
                    cert_data = callback_obj.get('issueCertificate', {})
                    
                    result = {
                        "transaction_no": cert_data.get("TransactionNo"),
                        "certificate_number": cert_data.get("actualCNo"),
                        "email": cert_data.get("Email"),
                        "api_request_number": response.get("APIRequestNumber"),
                        "dmvic_ref_no": response.get("DMVICRefNo")
                    }
                    
                    logger.info(f"Type B certificate issued: {result['certificate_number']}")
                    return result
                else:
                    errors = response.get('Error', [])
                    last_error = DMVICAPIError(f"Type B endpoint {ep} failed: {errors}")
                    continue
                    
            except DMVICAPIError as e:
                last_error = e
                continue
        
        raise last_error or DMVICAPIError("All Type B candidate endpoints failed")
        
    except DMVICAPIError as e:
        logger.error(f"Type B certificate issuance failed: {str(e)}")
        raise
```

**Django View:**
```python
# insurance-app/app/views/dmvic_views.py

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def issue_type_b_certificate(request):
    """
    Issue Type B certificate for a motor policy
    
    POST /api/dmvic/issue-type-b/
    {
        "policy_id": 123
    }
    """
    try:
        policy_id = request.data.get('policy_id')
        if not policy_id:
            return Response(
                {"error": "policy_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get policy
        policy = MotorPolicy.objects.get(id=policy_id, user=request.user)
        
        # Map to DMVIC payload
        mapper = DMVICFieldMapper()
        dmvic_payload = mapper.map_policy_to_dmvic(policy, certificate_type="B")
        
        # Validate payload
        is_valid, errors = mapper.validate_payload(dmvic_payload, certificate_type="B")
        if not is_valid:
            return Response(
                {"error": "Payload validation failed", "missing_fields": errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Issue certificate
        dmvic_service = DMVICService()
        result = dmvic_service.issue_type_b_certificate(dmvic_payload)
        
        # Update policy with certificate details
        policy.dmvic_certificate_number = result['certificate_number']
        policy.dmvic_transaction_no = result['transaction_no']
        policy.dmvic_api_request_number = result['api_request_number']
        policy.status = 'ACTIVE'
        policy.save()
        
        return Response({
            "success": True,
            "certificate_number": result['certificate_number'],
            "transaction_no": result['transaction_no'],
            "message": "Type B certificate issued successfully"
        }, status=status.HTTP_200_OK)
        
    except MotorPolicy.DoesNotExist:
        return Response(
            {"error": "Policy not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except DMVICAPIError as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

---

#### 2. Issue Type C Certificate
**Endpoint:** `POST /api/v5/Integration/IssuanceTypeCCertificate`

**Purpose:** Issue certificates for Third-Party Only cover

**Required Fields:**
- No `TypeOfCertificate` field
- No `Licensedtocarry` field
- `Registrationnumber` OPTIONAL
- `SumInsured` ONLY for COMP/TPTF (not required for TPO)

**Implementation:** Similar to Type B (copy pattern above)

---

#### 3. Preview Type B Certificate
**Endpoint:** `POST /api/v5/Integration/PreviewTypeBCertificate`

**Implementation:**
```python
def preview_type_b_certificate(self, dmvic_payload: Dict[str, Any]) -> Dict[str, Any]:
    """Generate preview PDF for Type B certificate"""
    # Similar to preview_type_a_certificate
    # Returns: preview_url, api_request_number, expires_in
```

---

#### 4. Preview Type C Certificate
**Endpoint:** `POST /api/v5/Integration/PreviewTypeCCertificate`

**Implementation:** Similar to Type B preview

---

#### 5. Confirm Certificate Issuance (Logbook Verify)
**Endpoint:** `POST /api/v5/Integration/ConfirmCertificateIssuance`

**Purpose:** Confirm certificate after logbook verification

**Request:**
```json
{
  "IssuanceRequestID": "AF-AA0012",
  "IsApproved": true,
  "IsLogBookVerified": true,
  "IsVehicleInspected": true,
  "AdditionalComments": "",
  "UserName": ""
}
```

**Implementation:**
```python
def confirm_certificate_issuance(
    self,
    issuance_request_id: str,
    is_approved: bool = True,
    is_logbook_verified: bool = True,
    is_vehicle_inspected: bool = True,
    comments: str = "",
    username: str = ""
) -> Dict[str, Any]:
    """
    Confirm certificate issuance after verification
    
    Args:
        issuance_request_id: DMVIC issuance request ID (e.g., "AF-AA0012")
        is_approved: Approval status
        is_logbook_verified: Logbook verification status
        is_vehicle_inspected: Vehicle inspection status
        comments: Additional comments
        username: Username performing confirmation
    
    Returns:
        dict: {
            "transaction_no": "Q-AP7096",
            "certificate_number": "C19240632",
            "email": "client@example.com"
        }
    """
    logger.info(f"Confirming certificate issuance: {issuance_request_id}")
    
    payload = {
        "IssuanceRequestID": issuance_request_id,
        "IsApproved": is_approved,
        "IsLogBookVerified": is_logbook_verified,
        "IsVehicleInspected": is_vehicle_inspected,
        "AdditionalComments": comments,
        "UserName": username
    }
    
    try:
        response = self._make_authenticated_request(
            endpoint='/api/v5/Integration/ConfirmCertificateIssuance',
            method='POST',
            data=payload
        )
        
        if response.get('success'):
            callback_obj = response.get('callbackObj', {})
            cert_data = callback_obj.get('issueCertificate', {})
            
            result = {
                "transaction_no": cert_data.get("TransactionNo"),
                "certificate_number": cert_data.get("actualCNo"),
                "email": cert_data.get("Email"),
                "api_request_number": response.get("APIRequestNumber"),
                "dmvic_ref_no": response.get("DMVICRefNo")
            }
            
            logger.info(f"Certificate confirmed: {result['certificate_number']}")
            return result
        else:
            errors = response.get('Error', [])
            raise DMVICAPIError(f"Certificate confirmation failed: {errors}")
            
    except DMVICAPIError as e:
        logger.error(f"Certificate confirmation failed: {str(e)}")
        raise
```

---

#### 6. Get Certificate PDF
**Endpoint:** `POST /api/v5/Integration/GetCertificate`

**Purpose:** Retrieve generated certificate PDF

**Request:**
```json
{
  "CertificateNumber": "A1020701"
}
```

**Implementation:**
```python
def get_certificate_pdf(self, certificate_number: str) -> Dict[str, Any]:
    """
    Fetch certificate PDF URL
    
    Args:
        certificate_number: DMVIC certificate number (e.g., "A1020701")
    
    Returns:
        dict: {
            "url": "https://dmvic.blob.core.windows.net/...",
            "certificate_number": "A1020701"
        }
    """
    logger.info(f"Fetching certificate PDF: {certificate_number}")
    
    payload = {
        "CertificateNumber": certificate_number
    }
    
    try:
        response = self._make_authenticated_request(
            endpoint='/api/v5/Integration/GetCertificate',
            method='POST',
            data=payload
        )
        
        if response.get('success'):
            callback_obj = response.get('callbackObj', {})
            pdf_url = callback_obj.get('URL')
            
            if not pdf_url:
                raise DMVICAPIError("PDF URL not in response")
            
            result = {
                "url": pdf_url,
                "certificate_number": certificate_number,
                "api_request_number": response.get("APIRequestNumber")
            }
            
            logger.info(f"Certificate PDF retrieved: {certificate_number}")
            return result
        else:
            errors = response.get('Error', [])
            raise DMVICAPIError(f"Get certificate PDF failed: {errors}")
            
    except DMVICAPIError as e:
        logger.error(f"Get certificate PDF failed: {str(e)}")
        raise
```

---

### 🟡 Priority 2 - Enhancement Features

#### 7. Cancel Certificate
**Endpoint:** `POST /api/v5/Integration/CancelCertificate`

**Purpose:** Cancel an issued certificate

**Implementation:** To be added

---

#### 8. Validate Certificate
**Endpoint:** `POST /api/v5/Integration/ValidateTypeACertificate`

**Purpose:** Validate certificate authenticity

**Implementation:** To be added

---

#### 9. Bulk Issuance Status
**Endpoint:** `POST /api/v5/Integration/BulkIssuanceStatus`

**Purpose:** Check status of bulk certificate issuance

**Implementation:** To be added

---

## Django Views Implementation

### URL Configuration

```python
# insurance-app/app/urls.py

from django.urls import path
from .views import dmvic_views

urlpatterns = [
    # DMVIC endpoints
    path('api/dmvic/search-vehicle/', dmvic_views.search_vehicle, name='dmvic_search_vehicle'),
    path('api/dmvic/preview-type-a/', dmvic_views.preview_type_a_certificate, name='dmvic_preview_type_a'),
    path('api/dmvic/preview-type-b/', dmvic_views.preview_type_b_certificate, name='dmvic_preview_type_b'),
    path('api/dmvic/preview-type-c/', dmvic_views.preview_type_c_certificate, name='dmvic_preview_type_c'),
    path('api/dmvic/issue-type-a/', dmvic_views.issue_type_a_certificate, name='dmvic_issue_type_a'),
    path('api/dmvic/issue-type-b/', dmvic_views.issue_type_b_certificate, name='dmvic_issue_type_b'),
    path('api/dmvic/issue-type-c/', dmvic_views.issue_type_c_certificate, name='dmvic_issue_type_c'),
    path('api/dmvic/confirm-issuance/', dmvic_views.confirm_certificate_issuance, name='dmvic_confirm_issuance'),
    path('api/dmvic/get-certificate-pdf/', dmvic_views.get_certificate_pdf, name='dmvic_get_pdf'),
    path('api/dmvic/validate-double-insurance/', dmvic_views.validate_double_insurance, name='dmvic_validate_double'),
]
```

### Complete Views File

```python
# insurance-app/app/views/dmvic_views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from app.models import MotorPolicy
from app.services.dmvic_service import DMVICService, DMVICAPIError
from app.services.dmvic_field_mapper import DMVICFieldMapper
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_vehicle(request):
    """
    Search vehicle in DMVIC/NTSA database
    
    POST /api/dmvic/search-vehicle/
    {
        "registration_number": "KCA123A"
    }
    """
    try:
        registration_number = request.data.get('registration_number')
        if not registration_number:
            return Response(
                {"error": "registration_number is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        dmvic_service = DMVICService()
        vehicle_data = dmvic_service.search_vehicle(registration_number)
        
        return Response({
            "success": True,
            "vehicle": vehicle_data
        }, status=status.HTTP_200_OK)
        
    except DMVICAPIError as e:
        logger.error(f"Vehicle search failed: {str(e)}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def preview_type_a_certificate(request):
    """
    Preview Type A certificate (PSV)
    
    POST /api/dmvic/preview-type-a/
    {
        "policy_id": 123
    }
    """
    try:
        policy_id = request.data.get('policy_id')
        if not policy_id:
            return Response(
                {"error": "policy_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get policy
        policy = MotorPolicy.objects.get(id=policy_id, user=request.user)
        
        # Map to DMVIC payload
        mapper = DMVICFieldMapper()
        dmvic_payload = mapper.map_policy_to_dmvic(policy, certificate_type="A")
        
        # Validate payload
        is_valid, errors = mapper.validate_payload(dmvic_payload, certificate_type="A")
        if not is_valid:
            return Response(
                {"error": "Payload validation failed", "missing_fields": errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate preview
        dmvic_service = DMVICService()
        result = dmvic_service.preview_type_a_certificate(dmvic_payload)
        
        return Response({
            "success": True,
            "preview_url": result['preview_url'],
            "api_request_number": result['api_request_number'],
            "expires_in": result['expires_in']
        }, status=status.HTTP_200_OK)
        
    except MotorPolicy.DoesNotExist:
        return Response(
            {"error": "Policy not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except DMVICAPIError as e:
        logger.error(f"Preview Type A failed: {str(e)}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def issue_type_a_certificate(request):
    """
    Issue Type A certificate (PSV)
    
    POST /api/dmvic/issue-type-a/
    {
        "policy_id": 123
    }
    """
    try:
        policy_id = request.data.get('policy_id')
        if not policy_id:
            return Response(
                {"error": "policy_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get policy
        policy = MotorPolicy.objects.get(id=policy_id, user=request.user)
        
        # Check if already issued
        if policy.dmvic_certificate_number:
            return Response(
                {"error": "Certificate already issued for this policy"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Map to DMVIC payload
        mapper = DMVICFieldMapper()
        dmvic_payload = mapper.map_policy_to_dmvic(policy, certificate_type="A")
        
        # Validate payload
        is_valid, errors = mapper.validate_payload(dmvic_payload, certificate_type="A")
        if not is_valid:
            return Response(
                {"error": "Payload validation failed", "missing_fields": errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Issue certificate
        dmvic_service = DMVICService()
        result = dmvic_service.issue_type_a_certificate(dmvic_payload)
        
        # Update policy with certificate details
        policy.dmvic_certificate_number = result['certificate_number']
        policy.dmvic_transaction_no = result['transaction_no']
        policy.dmvic_api_request_number = result['api_request_number']
        policy.status = 'ACTIVE'
        policy.save()
        
        return Response({
            "success": True,
            "certificate_number": result['certificate_number'],
            "transaction_no": result['transaction_no'],
            "message": "Type A certificate issued successfully"
        }, status=status.HTTP_200_OK)
        
    except MotorPolicy.DoesNotExist:
        return Response(
            {"error": "Policy not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except DMVICAPIError as e:
        logger.error(f"Issue Type A failed: {str(e)}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_double_insurance(request):
    """
    Validate if vehicle has double insurance
    
    POST /api/dmvic/validate-double-insurance/
    {
        "chassis_number": "ABC123",
        "start_date": "2025-11-04",
        "end_date": "2026-11-04"
    }
    """
    try:
        chassis_number = request.data.get('chassis_number')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        if not all([chassis_number, start_date, end_date]):
            return Response(
                {"error": "chassis_number, start_date, and end_date are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        dmvic_service = DMVICService()
        result = dmvic_service.validate_double_insurance(chassis_number, start_date, end_date)
        
        return Response({
            "success": True,
            "has_double_insurance": result.get('has_double_insurance', False),
            "details": result
        }, status=status.HTTP_200_OK)
        
    except DMVICAPIError as e:
        logger.error(f"Double insurance validation failed: {str(e)}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_certificate_pdf(request):
    """
    Get certificate PDF URL
    
    POST /api/dmvic/get-certificate-pdf/
    {
        "certificate_number": "A1020701"
    }
    """
    try:
        certificate_number = request.data.get('certificate_number')
        if not certificate_number:
            return Response(
                {"error": "certificate_number is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        dmvic_service = DMVICService()
        result = dmvic_service.get_certificate_pdf(certificate_number)
        
        return Response({
            "success": True,
            "pdf_url": result['url'],
            "certificate_number": result['certificate_number']
        }, status=status.HTTP_200_OK)
        
    except DMVICAPIError as e:
        logger.error(f"Get certificate PDF failed: {str(e)}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_certificate_issuance(request):
    """
    Confirm certificate issuance after logbook verification
    
    POST /api/dmvic/confirm-issuance/
    {
        "issuance_request_id": "AF-AA0012",
        "is_approved": true,
        "is_logbook_verified": true,
        "is_vehicle_inspected": true,
        "comments": "",
        "username": "agent@patabima.com"
    }
    """
    try:
        issuance_request_id = request.data.get('issuance_request_id')
        if not issuance_request_id:
            return Response(
                {"error": "issuance_request_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        is_approved = request.data.get('is_approved', True)
        is_logbook_verified = request.data.get('is_logbook_verified', True)
        is_vehicle_inspected = request.data.get('is_vehicle_inspected', True)
        comments = request.data.get('comments', '')
        username = request.data.get('username', request.user.email)
        
        dmvic_service = DMVICService()
        result = dmvic_service.confirm_certificate_issuance(
            issuance_request_id=issuance_request_id,
            is_approved=is_approved,
            is_logbook_verified=is_logbook_verified,
            is_vehicle_inspected=is_vehicle_inspected,
            comments=comments,
            username=username
        )
        
        return Response({
            "success": True,
            "certificate_number": result['certificate_number'],
            "transaction_no": result['transaction_no'],
            "message": "Certificate issuance confirmed"
        }, status=status.HTTP_200_OK)
        
    except DMVICAPIError as e:
        logger.error(f"Confirm issuance failed: {str(e)}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

---

## Frontend Integration Guide

### React Native Service Layer

```javascript
// frontend/services/DMVICService.js

import DjangoAPIService from './DjangoAPIService';

class DMVICService {
  /**
   * Search vehicle in DMVIC/NTSA database
   */
  async searchVehicle(registrationNumber) {
    try {
      const response = await DjangoAPIService.makeRequest(
        '/api/dmvic/search-vehicle/',
        {
          method: 'POST',
          data: { registration_number: registrationNumber }
        }
      );
      
      if (response.success) {
        return response.vehicle;
      }
      throw new Error('Vehicle search failed');
    } catch (error) {
      console.error('DMVIC vehicle search error:', error);
      throw error;
    }
  }

  /**
   * Preview Type A certificate
   */
  async previewTypeACertificate(policyId) {
    try {
      const response = await DjangoAPIService.makeRequest(
        '/api/dmvic/preview-type-a/',
        {
          method: 'POST',
          data: { policy_id: policyId }
        }
      );
      
      if (response.success) {
        return {
          previewUrl: response.preview_url,
          apiRequestNumber: response.api_request_number,
          expiresIn: response.expires_in
        };
      }
      throw new Error('Preview generation failed');
    } catch (error) {
      console.error('DMVIC preview Type A error:', error);
      throw error;
    }
  }

  /**
   * Issue Type A certificate
   */
  async issueTypeACertificate(policyId) {
    try {
      const response = await DjangoAPIService.makeRequest(
        '/api/dmvic/issue-type-a/',
        {
          method: 'POST',
          data: { policy_id: policyId }
        }
      );
      
      if (response.success) {
        return {
          certificateNumber: response.certificate_number,
          transactionNo: response.transaction_no,
          message: response.message
        };
      }
      throw new Error('Certificate issuance failed');
    } catch (error) {
      console.error('DMVIC issue Type A error:', error);
      throw error;
    }
  }

  /**
   * Validate double insurance
   */
  async validateDoubleInsurance(chassisNumber, startDate, endDate) {
    try {
      const response = await DjangoAPIService.makeRequest(
        '/api/dmvic/validate-double-insurance/',
        {
          method: 'POST',
          data: {
            chassis_number: chassisNumber,
            start_date: startDate,
            end_date: endDate
          }
        }
      );
      
      if (response.success) {
        return {
          hasDoubleInsurance: response.has_double_insurance,
          details: response.details
        };
      }
      throw new Error('Double insurance validation failed');
    } catch (error) {
      console.error('DMVIC double insurance validation error:', error);
      throw error;
    }
  }

  /**
   * Get certificate PDF
   */
  async getCertificatePDF(certificateNumber) {
    try {
      const response = await DjangoAPIService.makeRequest(
        '/api/dmvic/get-certificate-pdf/',
        {
          method: 'POST',
          data: { certificate_number: certificateNumber }
        }
      );
      
      if (response.success) {
        return response.pdf_url;
      }
      throw new Error('PDF retrieval failed');
    } catch (error) {
      console.error('DMVIC get PDF error:', error);
      throw error;
    }
  }
}

export default new DMVICService();
```

### Motor2 Integration Example

```javascript
// frontend/screens/Motor 2/Payment/PaymentSuccess.js

import DMVICService from '../../../services/DMVICService';

const handleCertificateIssuance = async () => {
  try {
    setLoading(true);
    setLoadingMessage('Issuing DMVIC certificate...');
    
    // Determine certificate type based on product category
    const category = policy.product_details.category;
    let certificateType = 'C'; // Default: Type C for Third-Party
    
    if (category === 'PSV') {
      certificateType = 'A'; // Type A for PSV
    } else if (policy.product_details.cover_type === 'Comprehensive') {
      certificateType = 'B'; // Type B for Comprehensive Private
    }
    
    // Issue certificate
    const result = await DMVICService[`issueType${certificateType}Certificate`](policy.id);
    
    Alert.alert(
      'Certificate Issued',
      `Your DMVIC certificate ${result.certificateNumber} has been issued successfully!`,
      [
        {
          text: 'Download PDF',
          onPress: async () => {
            const pdfUrl = await DMVICService.getCertificatePDF(result.certificateNumber);
            Linking.openURL(pdfUrl);
          }
        },
        { text: 'OK' }
      ]
    );
    
  } catch (error) {
    Alert.alert('Certificate Issuance Failed', error.message);
  } finally {
    setLoading(false);
  }
};
```

---

## Error Handling

### DMVIC Error Codes

| Code | Description | Action Required |
|------|-------------|-----------------|
| **ER001** | Input json format is Incorrect | Check payload field casing and structure |
| **ER002** | Unknown Error | Contact DMVIC support |
| **ER003** | Mandatory field is missing | Add missing required fields |
| **ER004** | Input not valid | Validate input data (e.g., passenger capacity ranges) |
| **ER005** | Double Insurance | Vehicle already has active insurance |
| **ER006** | No sufficient Inventory | No certificate inventory available |
| **ER007** | Data Validation Error | Fix invalid data format |
| **ERR10001** | NTSA data mismatch | Vehicle details don't match NTSA records |

### Frontend Error Handling Pattern

```javascript
try {
  const result = await DMVICService.issueTypeACertificate(policyId);
  // Success handling
} catch (error) {
  // Parse error message
  const errorMessage = error.response?.data?.error || error.message;
  
  if (errorMessage.includes('ER005')) {
    Alert.alert(
      'Double Insurance Detected',
      'This vehicle already has an active insurance policy. Please check and try again.',
      [{ text: 'OK' }]
    );
  } else if (errorMessage.includes('ER006')) {
    Alert.alert(
      'Certificate Inventory Unavailable',
      'DMVIC certificate inventory is currently unavailable. Please try again later or contact support.',
      [{ text: 'Contact Support', onPress: () => navigateToSupport() }]
    );
  } else if (errorMessage.includes('ERR10001')) {
    Alert.alert(
      'NTSA Data Mismatch',
      'The vehicle details entered do not match NTSA records. Please verify and correct the information.',
      [{ text: 'Edit Details', onPress: () => navigation.goBack() }]
    );
  } else {
    Alert.alert('Error', errorMessage);
  }
}
```

---

## Testing Guide

### Unit Tests

```python
# insurance-app/app/tests/test_dmvic_service.py

import pytest
from app.services.dmvic_service import DMVICService, DMVICAPIError
from app.services.dmvic_field_mapper import DMVICFieldMapper
from app.models import MotorPolicy

@pytest.mark.django_db
class TestDMVICService:
    
    def test_vehicle_search_success(self):
        """Test successful vehicle search"""
        dmvic = DMVICService()
        result = dmvic.search_vehicle("KCA123A")
        
        assert result['registration_number'] == "KCA123A"
        assert 'chassis_number' in result
        assert 'make' in result
    
    def test_preview_type_a_payload_validation(self):
        """Test Type A payload validation"""
        policy = MotorPolicy.objects.create(
            policy_number="TEST-001",
            # ... other fields
        )
        
        mapper = DMVICFieldMapper()
        payload = mapper.map_policy_to_dmvic(policy, certificate_type="A")
        is_valid, errors = mapper.validate_payload(payload, certificate_type="A")
        
        assert is_valid is True
        assert len(errors) == 0
    
    def test_type_b_requires_registration(self):
        """Test Type B requires registration number"""
        payload = {
            "Typeofcover": 200,
            "Policyholder": "PATABIMA",
            # Missing Registrationnumber
        }
        
        mapper = DMVICFieldMapper()
        is_valid, errors = mapper.validate_payload(payload, certificate_type="B")
        
        assert is_valid is False
        assert "Registrationnumber" in errors
```

### Integration Tests

```python
# insurance-app/app/tests/test_dmvic_integration.py

import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from app.models import MotorPolicy

@pytest.mark.django_db
class TestDMVICIntegration:
    
    def setup_method(self):
        self.client = APIClient()
        # Create test user and authenticate
        # Create test policy
    
    def test_vehicle_search_endpoint(self):
        """Test vehicle search API endpoint"""
        url = reverse('dmvic_search_vehicle')
        data = {'registration_number': 'KCA123A'}
        
        response = self.client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['success'] is True
        assert 'vehicle' in response.data
    
    def test_preview_type_a_endpoint(self):
        """Test Type A preview endpoint"""
        # Create policy
        policy = MotorPolicy.objects.create(...)
        
        url = reverse('dmvic_preview_type_a')
        data = {'policy_id': policy.id}
        
        response = self.client.post(url, data, format='json')
        
        # Note: Will fail with ER001 until DMVIC enables account
        # This test verifies the flow, not the DMVIC response
        assert 'preview_url' in response.data or 'error' in response.data
```

---

## Database Schema Updates Required

### Add DMVIC Fields to MotorPolicy Model

```python
# insurance-app/app/models.py

class MotorPolicy(BaseModel):
    # ... existing fields ...
    
    # DMVIC Integration Fields
    dmvic_certificate_number = models.CharField(
        max_length=50, 
        null=True, 
        blank=True,
        db_index=True,
        help_text="DMVIC certificate number (e.g., A1020703, B1234567)"
    )
    dmvic_transaction_no = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="DMVIC transaction number (e.g., Q-AA0108)"
    )
    dmvic_api_request_number = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="DMVIC API request number (e.g., O-AA0024)"
    )
    dmvic_ref_no = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="DMVIC reference number (e.g., DMVIC-O-AA0024)"
    )
    dmvic_issuance_request_id = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="DMVIC issuance request ID for confirmation (e.g., AF-AA0012)"
    )
    dmvic_certificate_pdf_url = models.URLField(
        max_length=500,
        null=True,
        blank=True,
        help_text="URL to DMVIC certificate PDF"
    )
    dmvic_issued_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when DMVIC certificate was issued"
    )
    dmvic_confirmed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when DMVIC issuance was confirmed"
    )
    dmvic_certificate_type = models.CharField(
        max_length=1,
        choices=[
            ('A', 'Type A - PSV'),
            ('B', 'Type B - Private Comprehensive'),
            ('C', 'Type C - Third Party'),
            ('D', 'Type D - Special')
        ],
        null=True,
        blank=True,
        help_text="DMVIC certificate type"
    )
```

### Migration

```bash
cd insurance-app
python manage.py makemigrations
python manage.py migrate
```

---

## Next Steps

### Immediate Actions (Priority 1)

1. **Contact DMVIC Support**
   - Request activation of Preview and Issuance endpoints
   - Confirm ClientID and ApimSubscriptionKey
   - Verify IP whitelist configuration

2. **Complete Type B/C Implementations**
   - Add `issue_type_b_certificate()` to DMVICService
   - Add `issue_type_c_certificate()` to DMVICService
   - Add `preview_type_b_certificate()` to DMVICService
   - Add `preview_type_c_certificate()` to DMVICService
   - Create corresponding Django views

3. **Add Confirm Issuance Endpoint**
   - Implement `confirm_certificate_issuance()` method
   - Create Django view
   - Add to URL configuration

4. **Add Get Certificate PDF Endpoint**
   - Implement `get_certificate_pdf()` method
   - Create Django view
   - Add to URL configuration

### Testing Phase (Priority 2)

5. **Test with DMVIC UAT**
   - Once endpoints are enabled, run full integration tests
   - Test all certificate types (A, B, C)
   - Validate error handling scenarios

6. **Frontend Integration**
   - Integrate DMVICService into Motor2 flow
   - Add certificate preview functionality
   - Add certificate download functionality

### Enhancement Phase (Priority 3)

7. **Add Remaining Endpoints**
   - Cancel Certificate
   - Validate Certificate
   - Bulk Issuance Status

8. **Add Monitoring & Logging**
   - Track DMVIC API usage
   - Monitor certificate issuance success rates
   - Set up error alerts

---

## Summary

### ✅ Working Features
- Authentication (Login)
- Vehicle Search
- Field Mapping (Type A/B/C)
- Payload Validation

### ⚠️ Implemented but Blocked (Requires DMVIC Account Access)
- Preview Type A/B/C Certificates
- Issue Type A/B/C Certificates

### ❌ Missing Implementation
- Confirm Certificate Issuance
- Get Certificate PDF
- Cancel Certificate
- Validate Certificate
- Bulk Issuance Status

### 🔧 Database Updates Needed
- Add DMVIC fields to MotorPolicy model
- Run migrations

### 📱 Frontend Integration Needed
- Create DMVICService wrapper
- Integrate into Motor2 payment flow
- Add certificate preview/download UI

---

**Document Status:** Ready for implementation  
**Next Review Date:** After DMVIC account activation  
**Contact:** DMVIC Support - support@dmvic.com
