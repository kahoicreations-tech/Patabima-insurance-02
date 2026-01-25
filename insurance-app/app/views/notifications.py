from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


class NotificationsViewSet(viewsets.ViewSet):
    """Public app notifications feed.

    Frontend expects:
    - GET /api/v1/public_app/notifications/list

    This feed is currently driven by DMVIC certificate issuance records.
    """

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["GET"], url_path="list")
    def fetch(self, request):
        """Return certificate-driven notifications for the authenticated user."""
        try:
            from app.models import DMVICCertificate
            from app.services.pdf_generator import generate_presigned_url

            qs = (
                DMVICCertificate.objects.filter(motor_policy__user=request.user)
                .select_related("motor_policy")
                .order_by("-date_created")
            )

            items = []
            for cert in qs[:50]:
                policy = cert.motor_policy
                policy_number = getattr(policy, "policy_number", None)
                cert_no = cert.certificate_number
                status_code = cert.status

                if status_code == "ISSUED":
                    title = "Certificate Received"
                    vehicle_reg = policy.vehicle_details.get('registrationNumber', cert_no) if policy.vehicle_details else cert_no
                    body = f"Policy Certificate for vehicle {vehicle_reg} has been issued. Kindly check your email."
                elif status_code == "FAILED":
                    title = "Certificate Received"
                    # Include DMVIC error message in body
                    error_msg = cert.error_message or "Unknown error occurred"
                    vehicle_reg = policy.vehicle_details.get('registrationNumber', '') if policy.vehicle_details else ''
                    body = f"Certificate issuance failed for vehicle {vehicle_reg}. Reason: {error_msg}"
                elif status_code == "CANCELLED":
                    title = "Certificate Cancelled"
                    reason = cert.cancellation_reason or "Certificate was cancelled"
                    body = f"{reason} for policy {policy_number or ''}." .strip()
                else:
                    title = "Certificate Processing"
                    body = f"We are processing your certificate for policy {policy_number or ''}.".strip()

                # Get vehicle registration for filename
                vehicle_reg = policy.vehicle_details.get('registrationNumber', cert_no) if policy.vehicle_details else cert_no
                
                items.append(
                    {
                        "id": str(cert.id),
                        "type": "DMVIC_CERTIFICATE",
                        "title": title,
                        "body": body,
                        "status": status_code,
                        "policy_number": policy_number,
                        "certificate_number": cert_no,
                        "vehicle_registration": vehicle_reg,
                        "error_message": cert.error_message if status_code == "FAILED" else None,
                        "pdf_url": generate_presigned_url(cert.dmvic_pdf_url) if cert.dmvic_pdf_url else None,
                        "qr_code_url": cert.qr_code_url,
                        "created_at": cert.date_created.isoformat() if cert.date_created else None,
                        "issued_at": cert.issued_at.isoformat() if cert.issued_at else None,
                        "is_read": False,  # TODO: Implement read tracking
                    }
                )

            # Count unread notifications (all are unread for now until we implement tracking)
            unread_count = len([item for item in items if not item.get('is_read', True)])
            
            return Response(
                {
                    "success": True,
                    "count": len(items),
                    "unread_count": unread_count,
                    "notifications": items,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            import logging

            logger = logging.getLogger(__name__)
            logger.error("Notifications fetch failed: %s", e)
            return Response(
                {
                    "success": False,
                    "error": "Failed to load notifications",
                    "notifications": [],
                },
                status=status.HTTP_200_OK,
            )
