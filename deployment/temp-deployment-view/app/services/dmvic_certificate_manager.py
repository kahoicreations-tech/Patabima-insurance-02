"""
DMVIC Certificate Manager Service
Handles certificate lifecycle: issuance, retries, and cancellation.

Critical Business Rule:
- DMVIC certificate issuance is MANDATORY for policy activation
- Certificate issuance BLOCKS policy activation (synchronous with retries)
- If DMVIC is down after retries, policy stays PENDING_PAYMENT

Author: PataBima Development Team
Date: November 3, 2025
"""

import logging
import time
from typing import Optional, Dict, Any
from django.utils import timezone
from datetime import timedelta
from app.models import MotorPolicy, DMVICCertificate
from app.services.dmvic_service import get_dmvic_service, DMVICAPIError
from app.services.dmvic_field_mapper import DMVICFieldMapper

logger = logging.getLogger(__name__)


class DMVICCertificateManager:
    """
    Manages DMVIC certificate lifecycle with BLOCKING issuance pattern.
    
    Key Features:
    - Synchronous certificate issuance (blocks until success or all retries fail)
    - 3 automatic retries with short delays for transient failures
    - Comprehensive error logging and admin alerts
    - Support for certificate cancellation
    """
    
    # Retry configuration (seconds)
    RETRY_DELAYS = [5, 15, 30]  # 5s, 15s, 30s between retries
    MAX_RETRIES = 3
    
    @classmethod
    def determine_certificate_type(cls, policy: MotorPolicy) -> str:
        """
        Determine DMVIC certificate type from policy coverage.
        
        Args:
            policy: MotorPolicy instance
        
        Returns:
            'A': Third-Party
            'B': Comprehensive
            'C': Third-Party + PLL
            'D': Comprehensive + PLL
        """
        product = policy.product_details
        coverage_type = product.get('coverageType', '').upper()
        addons = policy.addons
        
        # Check for PLL (Passenger Legal Liability) addon
        has_pll = any(
            addon.get('code') == 'PLL' or 'PASSENGER' in addon.get('name', '').upper()
            for addon in addons
        )
        
        # Determine base type from coverage
        if 'COMPREHENSIVE' in coverage_type or 'COMP' in coverage_type:
            return 'D' if has_pll else 'B'
        else:
            return 'C' if has_pll else 'A'
    
    @classmethod
    def issue_certificate(
        cls, 
        policy: MotorPolicy, 
        force_retry: bool = False
    ) -> DMVICCertificate:
        """
        Issue DMVIC certificate for a motor policy (BLOCKING with retries).
        
        This method is SYNCHRONOUS and will block until:
        1. Certificate is successfully issued, OR
        2. All retry attempts are exhausted
        
        Critical: This is called during payment_callback() and MUST complete
        before policy can be activated.
        
        Args:
            policy: MotorPolicy instance (must have payment confirmed)
            force_retry: If True, retry even if previous attempt failed
        
        Returns:
            DMVICCertificate instance with status='ISSUED'
        
        Raises:
            DMVICAPIError: If certificate issuance fails after all retries
            ValueError: If policy is not eligible for certificate issuance
        """
        logger.info(f"🔐 Issuing DMVIC certificate for policy {policy.policy_number}")
        
        # Validate policy eligibility
        if not cls._validate_policy_eligibility(policy):
            raise ValueError(
                f"Policy {policy.policy_number} not eligible for DMVIC certificate. "
                f"Status: {policy.status}, Payment: {policy.payment_details.get('status')}"
            )
        
        # Check if certificate already exists
        existing_cert = DMVICCertificate.objects.filter(
            motor_policy=policy,
            status='ISSUED'
        ).first()
        
        if existing_cert and not force_retry:
            logger.info(f"✅ Certificate already exists: {existing_cert.certificate_number}")
            return existing_cert
        
        # Determine certificate type
        cert_type = cls.determine_certificate_type(policy)
        logger.info(f"📋 Certificate type: Type {cert_type}")
        
        # Map policy data to DMVIC payload using the field mapper
        from app.services.dmvic_field_mapper import get_dmvic_field_mapper
        mapper = get_dmvic_field_mapper()
        
        try:
            payload = mapper.map_policy_to_dmvic(policy, cert_type)
            logger.info(f"✅ Policy mapped to DMVIC Type {cert_type} payload")
        except Exception as e:
            logger.error(f"❌ Field mapping failed: {str(e)}")
            raise ValueError(f"Failed to map policy data to DMVIC format: {str(e)}")
        
        # Create or retrieve DMVICCertificate record
        dmvic_cert, created = DMVICCertificate.objects.get_or_create(
            motor_policy=policy,
            certificate_type=cert_type,
            defaults={
                'status': 'PENDING',
                'request_payload': payload
            }
        )
        
        if not created:
            # Update existing record for retry
            dmvic_cert.status = 'PENDING'
            dmvic_cert.request_payload = payload
            dmvic_cert.save()
        
        # Attempt certificate issuance with retries
        dmvic_service = get_dmvic_service()
        last_error = None
        
        for attempt in range(cls.MAX_RETRIES):
            try:
                logger.info(f"🔄 Attempt {attempt + 1}/{cls.MAX_RETRIES} - Calling DMVIC API...")
                
                # Call appropriate DMVIC certificate issuance method
                response = cls._call_dmvic_api(dmvic_service, cert_type, payload)
                
                # SUCCESS - Update certificate record
                dmvic_cert.status = 'ISSUED'
                dmvic_cert.certificate_number = response.get('certificate_number')
                dmvic_cert.dmvic_pdf_url = response.get('pdf_url')
                dmvic_cert.qr_code_url = response.get('qr_code_url')
                dmvic_cert.response_data = response
                dmvic_cert.issued_at = timezone.now()
                dmvic_cert.retry_count = attempt  # Record how many attempts it took
                dmvic_cert.error_message = ''  # Clear any previous errors
                dmvic_cert.save()
                
                # Update policy certificate URL
                policy.certificate_url = response.get('pdf_url')
                policy.save(update_fields=['certificate_url'])
                
                logger.info(
                    f"✅ Certificate issued successfully: {dmvic_cert.certificate_number} "
                    f"(attempt {attempt + 1}/{cls.MAX_RETRIES})"
                )
                
                return dmvic_cert
                
            except DMVICAPIError as e:
                last_error = e
                logger.warning(
                    f"⚠️ DMVIC API error on attempt {attempt + 1}/{cls.MAX_RETRIES}: {str(e)}"
                )
                
                # Update retry tracking
                dmvic_cert.retry_count = attempt + 1
                dmvic_cert.last_retry_at = timezone.now()
                dmvic_cert.error_message = str(e)
                dmvic_cert.response_data = {'error': str(e), 'attempt': attempt + 1}
                
                # If not last attempt, wait before retry
                if attempt < cls.MAX_RETRIES - 1:
                    retry_delay = cls.RETRY_DELAYS[attempt]
                    logger.info(f"⏳ Waiting {retry_delay} seconds before retry...")
                    dmvic_cert.status = 'PENDING'
                    dmvic_cert.save()
                    time.sleep(retry_delay)
                else:
                    # Last attempt failed - mark as FAILED
                    dmvic_cert.status = 'FAILED'
                    dmvic_cert.save()
                    logger.error(
                        f"❌ All {cls.MAX_RETRIES} retry attempts exhausted for "
                        f"policy {policy.policy_number}"
                    )
        
        # All retries failed - send admin alert and raise exception
        cls._send_admin_alert(policy, dmvic_cert, last_error)
        
        raise DMVICAPIError(
            f"DMVIC certificate issuance failed after {cls.MAX_RETRIES} attempts. "
            f"Last error: {str(last_error)}"
        )
    
    @classmethod
    def _call_dmvic_api(
        cls, 
        dmvic_service, 
        cert_type: str, 
        payload: dict
    ) -> Dict[str, Any]:
        """
        Call appropriate DMVIC API method based on certificate type.
        
        Args:
            dmvic_service: DMVICService instance
            cert_type: 'A', 'B', 'C', or 'D'
            payload: DMVIC-compliant certificate payload
        
        Returns:
            dict: DMVIC API response
        
        Raises:
            DMVICAPIError: If DMVIC API call fails
        """
        if cert_type == 'A':
            return dmvic_service.issue_type_a_certificate(payload)
        elif cert_type == 'B':
            return dmvic_service.issue_type_b_certificate(payload)
        elif cert_type == 'C':
            # Type C = Third-Party + PLL (uses Type A endpoint)
            return dmvic_service.issue_type_c_certificate(payload)
        elif cert_type == 'D':
            # Type D = Comprehensive + PLL (uses Type B endpoint)
            return dmvic_service.issue_type_d_certificate(payload)
        else:
            raise ValueError(f"Invalid certificate type: {cert_type}")
    
    @classmethod
    def _validate_policy_eligibility(cls, policy: MotorPolicy) -> bool:
        """
        Validate that policy is eligible for DMVIC certificate issuance.
        
        Requirements:
        - Payment must be confirmed (payment_details.status = 'CONFIRMED')
        - Policy must have cover dates set
        - Policy must have required vehicle and client details
        
        Args:
            policy: MotorPolicy instance
        
        Returns:
            bool: True if eligible, False otherwise
        """
        # Check payment confirmation
        payment_details = policy.payment_details or {}
        if payment_details.get('status') != 'CONFIRMED':
            logger.error(f"Payment not confirmed for policy {policy.policy_number}")
            return False
        
        # Check cover dates
        if not policy.cover_start_date or not policy.cover_end_date:
            logger.error(f"Cover dates missing for policy {policy.policy_number}")
            return False
        
        # Check required vehicle details
        vehicle = policy.vehicle_details or {}
        required_vehicle_fields = ['registration', 'make', 'model', 'year']
        missing_vehicle_fields = [
            field for field in required_vehicle_fields 
            if not vehicle.get(field)
        ]
        if missing_vehicle_fields:
            logger.error(
                f"Missing vehicle details for policy {policy.policy_number}: "
                f"{', '.join(missing_vehicle_fields)}"
            )
            return False
        
        # Check required client details
        client = policy.client_details or {}
        required_client_fields = ['fullName', 'phone']
        missing_client_fields = [
            field for field in required_client_fields 
            if not client.get(field)
        ]
        if missing_client_fields:
            logger.error(
                f"Missing client details for policy {policy.policy_number}: "
                f"{', '.join(missing_client_fields)}"
            )
            return False
        
        return True
    
    @classmethod
    def cancel_certificate(
        cls, 
        dmvic_cert: DMVICCertificate, 
        reason: str
    ) -> bool:
        """
        Cancel a DMVIC certificate.
        
        Args:
            dmvic_cert: DMVICCertificate instance
            reason: Cancellation reason (required by DMVIC)
        
        Returns:
            bool: True if successful
        
        Raises:
            ValueError: If certificate cannot be cancelled
            DMVICAPIError: If DMVIC API call fails
        """
        if dmvic_cert.status != 'ISSUED':
            raise ValueError(
                f"Can only cancel issued certificates. "
                f"Current status: {dmvic_cert.status}"
            )
        
        if not dmvic_cert.certificate_number:
            raise ValueError("Certificate number missing - cannot cancel")
        
        dmvic_service = get_dmvic_service()
        
        try:
            logger.info(
                f"🚫 Cancelling certificate {dmvic_cert.certificate_number} "
                f"for policy {dmvic_cert.motor_policy.policy_number}"
            )
            
            response = dmvic_service.cancel_certificate(
                dmvic_cert.certificate_number,
                reason
            )
            
            # Update certificate record
            dmvic_cert.status = 'CANCELLED'
            dmvic_cert.cancelled_at = timezone.now()
            dmvic_cert.cancellation_reason = reason
            dmvic_cert.response_data = {
                'cancellation_response': response,
                'cancelled_at': timezone.now().isoformat()
            }
            dmvic_cert.save()
            
            # Clear certificate URL from policy
            policy = dmvic_cert.motor_policy
            policy.certificate_url = None
            policy.save(update_fields=['certificate_url'])
            
            logger.info(f"✅ Certificate cancelled: {dmvic_cert.certificate_number}")
            return True
            
        except DMVICAPIError as e:
            logger.error(f"❌ Failed to cancel certificate: {str(e)}")
            raise
    
    @classmethod
    def _send_admin_alert(
        cls, 
        policy: MotorPolicy, 
        dmvic_cert: DMVICCertificate, 
        error: Exception
    ):
        """
        Send alert to administrators when certificate issuance fails.
        
        Args:
            policy: MotorPolicy instance
            dmvic_cert: DMVICCertificate instance
            error: Exception that caused the failure
        """
        # TODO: Implement email alert to admins
        logger.critical(
            f"🚨 ADMIN ALERT: DMVIC certificate issuance failed\n"
            f"Policy Number: {policy.policy_number}\n"
            f"Policy ID: {policy.id}\n"
            f"Certificate Type: Type {dmvic_cert.certificate_type}\n"
            f"Retry Count: {dmvic_cert.retry_count}\n"
            f"Error: {str(error)}\n"
            f"Action Required: Manual retry from Django admin"
        )
        
        # TODO: Send email to admin team
        # from app.services.email_service import send_admin_alert_email
        # send_admin_alert_email(
        #     subject=f"DMVIC Certificate Issuance Failed - {policy.policy_number}",
        #     policy=policy,
        #     error=error
        # )
    
    @classmethod
    def retry_failed_certificate(cls, dmvic_cert: DMVICCertificate) -> DMVICCertificate:
        """
        Manually retry a failed certificate issuance (admin function).
        
        Args:
            dmvic_cert: DMVICCertificate instance with status='FAILED'
        
        Returns:
            DMVICCertificate: Updated certificate instance
        
        Raises:
            ValueError: If certificate is not in FAILED status
            DMVICAPIError: If retry fails
        """
        if dmvic_cert.status != 'FAILED':
            raise ValueError(
                f"Can only retry failed certificates. "
                f"Current status: {dmvic_cert.status}"
            )
        
        logger.info(
            f"🔄 Manual retry requested for certificate "
            f"(policy: {dmvic_cert.motor_policy.policy_number})"
        )
        
        # Reset retry count for fresh attempts
        dmvic_cert.retry_count = 0
        dmvic_cert.save()
        
        # Issue certificate with force_retry=True
        return cls.issue_certificate(
            policy=dmvic_cert.motor_policy,
            force_retry=True
        )


# Convenience function for direct import
def issue_dmvic_certificate(policy: MotorPolicy) -> DMVICCertificate:
    """
    Issue DMVIC certificate for a policy (convenience function).
    
    Args:
        policy: MotorPolicy instance
    
    Returns:
        DMVICCertificate instance
    """
    return DMVICCertificateManager.issue_certificate(policy)
