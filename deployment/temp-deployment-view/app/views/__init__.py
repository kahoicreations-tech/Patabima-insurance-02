"""Views package for app.

Expose submodules explicitly to avoid Django import resolution issues when
referencing app.views in URLConf or elsewhere.
"""

# Explicitly import motor-related view modules so dotted imports work
from . import motor_flow  # noqa: F401
from . import vehicle_validation  # noqa: F401
from . import document_upload  # noqa: F401
from . import payment_gateway  # noqa: F401
from . import policy_management  # noqa: F401
from . import claims  # noqa: F401
from . import integrations  # noqa: F401

# Export IntegrationsViewSet for direct import
from .integrations import IntegrationsViewSet  # noqa: F401
