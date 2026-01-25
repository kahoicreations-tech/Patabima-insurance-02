"""Views package for app.

Expose submodules explicitly to avoid Django import resolution issues when
referencing app.views in URLConf or elsewhere.
"""

# Explicitly import motor-related view modules so dotted imports work
from . import motor_flow  # noqa: F401
from . import payment_gateway  # noqa: F401
from . import policy_management  # noqa: F401
from . import claims  # noqa: F401
from . import integrations  # noqa: F401
from . import payments  # noqa: F401
from . import notifications  # noqa: F401

# Export IntegrationsViewSet for direct import
from .integrations import IntegrationsViewSet  # noqa: F401

# Export PaymentsViewSet for direct import
from .payments import PaymentsViewSet  # noqa: F401

# Export NotificationsViewSet for direct import
from .notifications import NotificationsViewSet  # noqa: F401
