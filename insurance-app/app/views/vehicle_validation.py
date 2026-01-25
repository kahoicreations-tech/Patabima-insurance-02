"""Legacy module kept for import compatibility.

This module previously exposed simulated vehicle validation endpoints.
Those simulation endpoints have been removed.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_vehicle_registration(request):
    return Response({'detail': 'Vehicle validation endpoint has been removed.'}, status=410)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_vehicle_chassis(request):
    return Response({'detail': 'Chassis validation endpoint has been removed.'}, status=410)