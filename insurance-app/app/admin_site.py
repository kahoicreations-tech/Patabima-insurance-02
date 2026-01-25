"""Deprecated custom admin site stub.

This project previously used a separate AdminSite mounted at /pba-admin/.
We now consolidate everything under the default Django admin at /admin/.

Keeping this module as a no-op stub avoids import errors if any stale
references remain, but it intentionally exposes no custom site.
"""

# Explicitly set to None so any feature flags or conditionals will evaluate false.
patabima_admin_site = None