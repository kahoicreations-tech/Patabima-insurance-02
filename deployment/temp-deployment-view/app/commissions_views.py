from rest_framework.response import Response
from rest_framework import status, viewsets, mixins
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from . import serializers, models


class CommissionsViewset(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Agent commissions endpoints.

    - GET /commissions -> standard list (with optional filters)
    - GET /commissions/summary -> summary metrics for the agent
    """

    permission_classes = [IsAuthenticated]
    serializer_class = serializers.AgentCommissionSerializer

    def get_queryset(self):
        """Base queryset scoped to the authenticated agent with optional filters.

        Supported query params:
        - status: PENDING|APPROVED|PAID|DISPUTED
        - since: YYYY-MM-DD (filters date_created >= since)
        - limit: int (5..100) soft cap applied to top results
        """
        user = self.request.user
        qs = models.AgentCommission.objects.filter(agent=user).order_by('-date_created')

        status_param = self.request.query_params.get('status')
        if status_param in {'PENDING', 'APPROVED', 'PAID', 'DISPUTED'}:
            qs = qs.filter(payment_status=status_param)

        since = self.request.query_params.get('since')  # YYYY-MM-DD
        if since:
            try:
                from datetime import datetime
                dt = datetime.strptime(since, '%Y-%m-%d').date()
                qs = qs.filter(date_created__date__gte=dt)
            except Exception:
                # Ignore invalid date formats and return unfiltered queryset for 'since'
                pass

        # Apply soft limit to keep responses light if pagination isn't configured
        try:
            limit = int(self.request.query_params.get('limit') or 50)
            limit = max(5, min(limit, 100))
        except Exception:
            limit = 50
        return qs[:limit]

    @action(detail=False, methods=['GET'])
    def summary(self, request):
        """Return commission summary for current authenticated agent.

        Optional query params:
        - period=YYYY-MM to specify month for monthly bonus lookup
        """
        user = request.user
        from django.db.models import Sum
        period = request.query_params.get('period')

        total = models.AgentCommission.objects.filter(agent=user).aggregate(s=Sum('commission_amount'))['s'] or 0
        pending = models.AgentCommission.objects.filter(agent=user, payment_status='PENDING').aggregate(s=Sum('commission_amount'))['s'] or 0
        paid = models.AgentCommission.objects.filter(agent=user, payment_status='PAID').aggregate(s=Sum('commission_amount'))['s'] or 0
        unpaid_count = models.AgentCommission.objects.filter(agent=user).exclude(payment_status='PAID').count()
        paid_count = models.AgentCommission.objects.filter(agent=user, payment_status='PAID').count()

        now = timezone.now()
        this_period = period if period else f"{now.year}-{now.month:02d}"
        month_total = models.MonthlyAgentBonus.objects.filter(agent=user, period=this_period).values_list('bonus_amount', flat=True).first() or 0

        data = {
            'total_commission': total,
            'pending_commission': pending,
            'paid_commission': paid,
            'unpaid_count': unpaid_count,
            'paid_count': paid_count,
            'month_total': month_total,
            'month_period': this_period,
        }
        return Response(serializers.CommissionSummarySerializer(data).data, status=status.HTTP_200_OK)

    # Standard list action provided by ListModelMixin
    @action(detail=False, methods=['GET'], url_path='list')
    def list_action(self, request, *args, **kwargs):
        """Explicit list endpoint to support /commissions/list as used by clients/tests.

        Wraps the standard list response into an object with an 'items' key.
        """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({'items': serializer.data}, status=status.HTTP_200_OK)
