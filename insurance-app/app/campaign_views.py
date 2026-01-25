"""
Campaign ViewSets for PataBima API.

Provides endpoints for:
- PublicCampaignViewSet: Read-only access to active campaigns for mobile app users
- AdminCampaignViewSet: Full CRUD for staff/admin campaign management
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import F, Count, Q

from .models import Campaign, CampaignInteraction
from .serializers import (
    CampaignSerializer, 
    CampaignInteractionSerializer,
    CampaignAdminSerializer,
    CampaignAdminWriteSerializer,
)
from .permissions import IsStaffOrAdmin


class PublicCampaignViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public endpoint for active campaigns.
    
    Available to all authenticated users (agents and customers).
    Returns campaigns filtered by user role and active status.
    
    Endpoints:
    - GET /campaigns/ - List active campaigns
    - GET /campaigns/<id>/ - Get single campaign
    - POST /campaigns/<id>/track/ - Track impression/click/conversion
    """
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Return active campaigns within date range, filtered by user role.
        
        Role-based filtering:
        - Agents see: ALL, AGENT, ACTIVE_AGENTS campaigns
        - Customers see: ALL, CUSTOMER campaigns
        - Others see: ALL campaigns only
        """
        now = timezone.now()
        user = self.request.user
        
        # Base query: active campaigns within date range
        queryset = Campaign.objects.filter(
            status='ACTIVE',
            start_date__lte=now,
            end_date__gte=now
        )
        # Note: Images are now optional - campaigns can display without banner_image or image_url
        
        # Role-based filtering
        user_role = getattr(user, 'role', 'CUSTOMER')
        
        # Check if user is agent (has staff_user_profile)
        is_agent = hasattr(user, 'staff_user_profile') and user.staff_user_profile is not None
        
        if is_agent or user_role == 'AGENT':
            queryset = queryset.filter(target_roles__in=['ALL', 'AGENT', 'ACTIVE_AGENTS'])
        elif user_role == 'CUSTOMER':
            queryset = queryset.filter(target_roles__in=['ALL', 'CUSTOMER'])
        else:
            queryset = queryset.filter(target_roles='ALL')
        
        # IMPORTANT: Do not slice here; DRF's get_object() may need to filter further.
        # Limit in list() instead via pagination or manual slicing in list().
        return queryset.order_by('-start_date')
    
    @action(detail=True, methods=['post'])
    def track(self, request, pk=None):
        """
        Track campaign interaction (impression/click/conversion/dismiss).
        
        POST /campaigns/<id>/track/
        Body: {"interaction_type": "IMPRESSION|CLICK|CONVERSION|DISMISS"}
        
        Creates interaction record and updates campaign totals atomically.
        """
        campaign = self.get_object()
        interaction_type = request.data.get('interaction_type', 'IMPRESSION')
        
        if interaction_type not in ['IMPRESSION', 'CLICK', 'CONVERSION', 'DISMISS']:
            return Response(
                {'error': 'Invalid interaction_type. Must be one of: IMPRESSION, CLICK, CONVERSION, DISMISS'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create interaction record
        CampaignInteraction.objects.create(
            campaign=campaign,
            user=request.user,
            interaction_type=interaction_type,
            ip_address=request.META.get('REMOTE_ADDR', ''),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        # Update campaign totals atomically (prevents race conditions)
        if interaction_type == 'IMPRESSION':
            Campaign.objects.filter(pk=pk).update(total_impressions=F('total_impressions') + 1)
        elif interaction_type == 'CLICK':
            Campaign.objects.filter(pk=pk).update(total_clicks=F('total_clicks') + 1)
        elif interaction_type == 'CONVERSION':
            Campaign.objects.filter(pk=pk).update(total_conversions=F('total_conversions') + 1)
        
        return Response({'status': 'tracked'}, status=status.HTTP_201_CREATED)


class AdminCampaignViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for campaigns - Staff/Admin only.
    
    Full campaign management with analytics.
    Only accessible by users with is_staff=True or is_admin=True.
    
    Endpoints:
    - GET /admin/campaigns/ - List all campaigns
    - POST /admin/campaigns/ - Create campaign
    - GET /admin/campaigns/<id>/ - Get campaign details
    - PUT/PATCH /admin/campaigns/<id>/ - Update campaign
    - DELETE /admin/campaigns/<id>/ - Delete campaign
    - POST /admin/campaigns/<id>/publish/ - Publish campaign
    - POST /admin/campaigns/<id>/pause/ - Pause campaign
    - GET /admin/campaigns/<id>/analytics/ - Get campaign analytics
    """
    serializer_class = CampaignAdminSerializer
    permission_classes = [IsStaffOrAdmin]  # Secure: only staff/admin
    queryset = Campaign.objects.all().order_by('-start_date')
    
    def get_serializer_class(self):
        # Use simplified write serializer for create/update to reduce inputs
        if self.action in ['create', 'update', 'partial_update']:
            return CampaignAdminWriteSerializer
        return CampaignAdminSerializer

    def perform_create(self, serializer):
        """Auto-assign created_by to current admin user."""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """
        Publish (activate) a campaign.
        
        POST /admin/campaigns/<id>/publish/
        """
        campaign = self.get_object()
        campaign.status = 'ACTIVE'
        campaign.save()
        return Response({'status': 'published', 'campaign_id': campaign.id})
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """
        Pause an active campaign.
        
        POST /admin/campaigns/<id>/pause/
        """
        campaign = self.get_object()
        campaign.status = 'PAUSED'
        campaign.save()
        return Response({'status': 'paused', 'campaign_id': campaign.id})
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """
        Get campaign analytics with interaction breakdown.
        
        GET /admin/campaigns/<id>/analytics/
        
        Returns:
        - Campaign details
        - Interaction counts by type
        """
        campaign = self.get_object()
        interactions = campaign.interactions.values('interaction_type').annotate(
            count=Count('id')
        )
        return Response({
            'campaign': CampaignAdminSerializer(campaign).data,
            'interactions': list(interactions),
            'performance': {
                'total_impressions': campaign.total_impressions,
                'total_clicks': campaign.total_clicks,
                'total_conversions': campaign.total_conversions,
                'ctr': (campaign.total_clicks / campaign.total_impressions * 100) if campaign.total_impressions else 0,
                'cvr': (campaign.total_conversions / campaign.total_clicks * 100) if campaign.total_clicks else 0,
            }
        })
