"""
Motor2 Metadata Views - Version Management for Static Data

Provides endpoints for frontend to check if static data needs updating.
Supports hybrid static + background sync pattern.

API Endpoint: /api/v1/motor2/metadata/version/
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.conf import settings
from app.models import MotorCategory, MotorSubcategory
from datetime import datetime


class Motor2MetadataView(APIView):
    """
    Returns metadata for Motor2 static data versioning
    
    Frontend uses this to check if updates are available via background sync.
    
    Response Format:
    {
        "version": "1.0.0",
        "last_updated": "2025-11-10T12:36:13.003732Z",
        "total_categories": 6,
        "total_subcategories": 48,
        "category_versions": {
            "PRIVATE": "1.0.0",
            "COMMERCIAL": "1.0.0",
            ...
        }
    }
    """
    
    permission_classes = [AllowAny]  # Public endpoint for background sync
    
    def get(self, request):
        """
        GET /api/v1/motor2/metadata/version/
        
        Returns current version and metadata for Motor2 static data.
        """
        try:
            # Get version from settings (increment when data changes)
            version = getattr(settings, 'MOTOR2_STATIC_VERSION', '1.0.0')
            
            # Get last updated timestamp from most recent category/subcategory change
            categories = MotorCategory.objects.filter(is_active=True).order_by('-date_updated')
            subcategories = MotorSubcategory.objects.filter(is_active=True).order_by('-date_updated')
            
            last_updated = None
            if categories.exists():
                last_updated = categories.first().date_updated
            
            if subcategories.exists():
                subcategory_updated = subcategories.first().date_updated
                if last_updated is None or subcategory_updated > last_updated:
                    last_updated = subcategory_updated
            
            # Get counts
            total_categories = categories.count()
            total_subcategories = subcategories.count()
            
            # Generate per-category versions (all use same version for now)
            category_versions = {}
            for cat in categories:
                category_versions[cat.code] = version
            
            return Response({
                'version': version,
                'last_updated': last_updated.isoformat() if last_updated else None,
                'total_categories': total_categories,
                'total_subcategories': total_subcategories,
                'category_versions': category_versions,
                'schema_version': '1.0',  # Track schema changes separately
                'exported_at': datetime.now().isoformat()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Log error but return graceful response
            # Frontend should handle this by using cached/static data
            return Response({
                'error': 'Failed to retrieve metadata',
                'message': str(e),
                'version': '1.0.0',  # Fallback version
                'total_categories': 0,
                'total_subcategories': 0
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
