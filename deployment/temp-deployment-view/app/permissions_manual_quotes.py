from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAgentUser(BasePermission):
    """Allow access only to authenticated agent (non-staff) users."""
    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and user.role == 'AGENT')


class IsStaffOrAdmin(BasePermission):
    """Allow access to staff or superuser for admin manual quote operations."""
    def has_permission(self, request, view):
        user = getattr(request, 'user', None)
        # Support custom User model without is_superuser; include is_admin flag as well
        return bool(
            user
            and user.is_authenticated
            and (
                getattr(user, 'is_staff', False)
                or getattr(user, 'is_superuser', False)
                or getattr(user, 'is_admin', False)
            )
        )
