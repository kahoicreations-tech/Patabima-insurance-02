"""
Custom permission classes for PataBima API endpoints.

These permissions provide role-based access control for different user types:
- Admin users (is_admin=True)
- Staff users (is_staff=True)
- Agents (users with StaffUserProfile)
- Customers (regular users)
"""

from rest_framework import permissions
from django.core.cache import cache


class IsStaffOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow staff or admin users.
    Used for admin-only campaign management endpoints and other staff features.
    
    Returns True if:
    - User is authenticated AND
    - User is staff (is_staff=True) OR admin (is_admin=True)
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.is_admin)
        )


class IsAgent(permissions.BasePermission):
    """
    Custom permission to only allow agent users.
    Agents are users with an associated StaffUserProfile.
    
    Returns True if:
    - User is authenticated AND
    - User has a staff_user_profile (agent profile exists)
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'staff_user_profile') and
            request.user.staff_user_profile is not None
        )


class IsAgentOrAdmin(permissions.BasePermission):
    """
    Allow agents and admin users.
    Combines agent profile check with admin/staff status.
    
    Returns True if:
    - User is authenticated AND
    - (User is admin OR User is staff OR User has agent profile)
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_admin or 
             request.user.is_staff or
             (hasattr(request.user, 'staff_user_profile') and 
              request.user.staff_user_profile is not None))
        )


class IsAuthenticatedOrQuotationFlow(permissions.BasePermission):
    """
    Custom permission for DMVIC vehicle searches.
    
    Allows:
    1. Authenticated users: Full access (no rate limiting)
    2. Anonymous users: Limited rate-limited access for quotation flow
    
    Anonymous requests are rate-limited to prevent abuse:
    - 20 requests per hour per IP address
    - Suitable for agents/customers creating quotes
    
    Security considerations:
    - Rate limiting prevents DMVIC API abuse
    - IP-based tracking (considers X-Forwarded-For for proxies)
    - Cache-based implementation for performance
    """
    
    # Rate limiting for anonymous users
    RATE_LIMIT_REQUESTS = 20  # Max 20 requests
    RATE_LIMIT_PERIOD = 3600  # Per hour (3600 seconds)
    
    def has_permission(self, request, view):
        # Always allow authenticated users (no rate limit)
        if request.user and request.user.is_authenticated:
            return True
        
        # For anonymous users, apply rate limiting on POST requests
        if request.method == 'POST':
            # Get client IP address
            ip_address = self._get_client_ip(request)
            
            # Create cache key for rate limiting
            cache_key = f'dmvic_rate_limit:{ip_address}'
            
            # Check current request count
            request_count = cache.get(cache_key, 0)
            
            if request_count >= self.RATE_LIMIT_REQUESTS:
                # Rate limit exceeded - deny request
                return False
            
            # Increment request count with TTL
            cache.set(cache_key, request_count + 1, self.RATE_LIMIT_PERIOD)
            
            # Allow the request
            return True
        
        # Deny other HTTP methods for anonymous users
        return False
    
    def _get_client_ip(self, request):
        """
        Extract client IP address from request.
        Considers X-Forwarded-For header for reverse proxy/load balancer setups.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            # X-Forwarded-For can contain multiple IPs, take the first (original client)
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
