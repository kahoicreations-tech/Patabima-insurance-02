from rest_framework import viewsets, mixins, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone

from . import models, serializers
from .permissions_manual_quotes import IsAgentUser, IsStaffOrAdmin


class AgentManualQuoteViewSet(mixins.CreateModelMixin,
                              mixins.ListModelMixin,
                              mixins.RetrieveModelMixin,
                              viewsets.GenericViewSet):
    """Agent endpoints: create and list own manual quotes."""
    serializer_class = serializers.ManualQuoteSerializer
    permission_classes = [IsAgentUser]
    lookup_field = 'reference'

    def get_queryset(self):
        return models.ManualQuote.objects.filter(agent=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return serializers.ManualQuoteCreateSerializer
        return serializers.ManualQuoteSerializer

    def perform_create(self, serializer):
        serializer.save()  # create() sets agent + reference automatically


class AdminManualQuoteViewSet(mixins.ListModelMixin,
                              mixins.RetrieveModelMixin,
                              mixins.UpdateModelMixin,
                              viewsets.GenericViewSet):
    """Admin endpoints: list, retrieve, partial update (status/premium)."""
    serializer_class = serializers.ManualQuoteSerializer
    permission_classes = [IsStaffOrAdmin]
    lookup_field = 'reference'

    def get_queryset(self):
        qs = models.ManualQuote.objects.all()
        line_key = self.request.query_params.get('line_key')
        status_param = self.request.query_params.get('status')
        agent_code = self.request.query_params.get('agent_code')
        if line_key:
            qs = qs.filter(line_key__iexact=line_key)
        if status_param:
            qs = qs.filter(status=status_param)
        if agent_code:
            qs = qs.filter(agent__staff_user_profile__agent_code=agent_code)
        return qs

    def get_serializer_class(self):
        if self.action in ['partial_update', 'update']:
            return serializers.ManualQuoteAdminUpdateSerializer
        return serializers.ManualQuoteSerializer

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        # Simple guard: computed_premium requires status COMPLETED
        new_status = serializer.validated_data.get('status')
        if 'computed_premium' in serializer.validated_data and new_status != 'COMPLETED' and instance.status != 'COMPLETED':
            return Response({'detail': 'computed_premium can only be set when status is COMPLETED'}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializers.ManualQuoteSerializer(instance).data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsStaffOrAdmin])
    def convert_to_policy(self, request, reference=None):
        """
        Convert a COMPLETED manual quote to an active policy (GenericQuote).
        
        This endpoint allows admin to convert approved manual quotes into policies
        after pricing has been completed.
        
        Expected payload:
        {
            "payment_confirmed": true,  // Optional, defaults to false (creates PENDING_PAYMENT)
            "transaction_id": "TXN123",  // Optional, required if payment_confirmed=true
            "payment_method": "MPESA"   // Optional
        }
        
        Returns:
        {
            "success": true,
            "policy_number": "POL-2025-123456",
            "policy_id": "uuid",
            "status": "ACTIVE" or "PENDING_PAYMENT"
        }
        """
        import logging
        logger = logging.getLogger(__name__)
        
        quote = self.get_object()
        
        # Validation: Only COMPLETED quotes can be converted
        if quote.status != 'COMPLETED':
            return Response({
                'success': False,
                'error': 'Only COMPLETED quotes can be converted to policies',
                'current_status': quote.status
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validation: Quote must have computed premium
        if not quote.computed_premium:
            return Response({
                'success': False,
                'error': 'Quote must have computed premium before conversion'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if already converted
        try:
            existing_policy = models.GenericQuote.objects.get(quote_reference=quote.reference)
            return Response({
                'success': False,
                'error': 'Quote has already been converted to a policy',
                'policy_number': existing_policy.policy_number,
                'policy_id': str(existing_policy.id)
            }, status=status.HTTP_400_BAD_REQUEST)
        except models.GenericQuote.DoesNotExist:
            pass  # Good, no existing policy
        
        # Get payment confirmation from request
        payment_confirmed = request.data.get('payment_confirmed', False)
        transaction_id = request.data.get('transaction_id')
        payment_method = request.data.get('payment_method', 'PENDING')
        
        # If payment confirmed, transaction_id is required
        if payment_confirmed and not transaction_id:
            return Response({
                'success': False,
                'error': 'transaction_id is required when payment_confirmed is true'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create GenericQuote (Policy) from ManualQuote
            policy = models.GenericQuote.objects.create(
                policy_number=models.GenericQuote.generate_policy_number(),
                quote_reference=quote.reference,
                line_key=quote.line_key,
                user=quote.agent,
                client_details=quote.payload,
                premium_amount=quote.computed_premium,
                levies_breakdown=quote.levies_breakdown or {},
                status='PENDING_PAYMENT' if not payment_confirmed else 'ACTIVE',
                submitted_at=timezone.now(),
                notes=f"Converted from manual quote {quote.reference}"
            )
            
            # If payment confirmed, set payment details and activate
            if payment_confirmed:
                policy.payment_details = {
                    'transaction_id': transaction_id,
                    'method': payment_method,
                    'amount': float(quote.computed_premium),
                    'status': 'CONFIRMED',
                    'payment_date': timezone.now().isoformat()
                }
                
                # Set cover dates (1 year coverage by default)
                from datetime import timedelta
                policy.cover_start_date = timezone.now().date()
                policy.cover_end_date = policy.cover_start_date + timedelta(days=365)
                policy.approved_at = timezone.now()
                
                policy.save()
                
                logger.info(f"Created ACTIVE policy {policy.policy_number} from quote {quote.reference}")
            else:
                logger.info(f"Created PENDING_PAYMENT policy {policy.policy_number} from quote {quote.reference}")
            
            # Update quote status to indicate conversion
            quote.admin_notes = f"{quote.admin_notes}\n\nConverted to policy {policy.policy_number} on {timezone.now().strftime('%Y-%m-%d %H:%M')}"
            quote.save(update_fields=['admin_notes'])
            
            return Response({
                'success': True,
                'policy_number': policy.policy_number,
                'policy_id': str(policy.id),
                'status': policy.status,
                'message': f'Quote converted to {"active" if payment_confirmed else "pending payment"} policy'
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            logger.error(f"Error converting quote {quote.reference} to policy: {e}")
            import traceback
            traceback.print_exc()
            
            return Response({
                'success': False,
                'error': 'Failed to convert quote to policy',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
