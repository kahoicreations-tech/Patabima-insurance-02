# DMVIC Security Implementation

## Overview

The DMVIC vehicle search endpoint has been secured with a custom permission class that balances accessibility for the quotation flow with protection against abuse.

## Security Approach: `IsAuthenticatedOrQuotationFlow`

### ✅ **Recommended Solution Implemented**

Instead of using `AllowAny` (which would be a security risk), we implemented a **custom permission class** that provides:

1. **Full access for authenticated users** (no rate limiting)
2. **Rate-limited access for anonymous users** (quotation flow support)

## Implementation Details

### Permission Class: `IsAuthenticatedOrQuotationFlow`

**Location**: `insurance-app/app/permissions.py`

```python
class IsAuthenticatedOrQuotationFlow(permissions.BasePermission):
    """
    Custom permission for DMVIC vehicle searches.

    Allows:
    1. Authenticated users: Full access (no rate limiting)
    2. Anonymous users: Limited rate-limited access for quotation flow

    Anonymous requests are rate-limited to prevent abuse:
    - 20 requests per hour per IP address
    - Suitable for agents/customers creating quotes
    """

    RATE_LIMIT_REQUESTS = 20  # Max 20 requests
    RATE_LIMIT_PERIOD = 3600  # Per hour
```

### Applied to DMVIC Endpoint

**Location**: `insurance-app/app/views/dmvic_views.py`

```python
@api_view(['POST'])
@permission_classes([IsAuthenticatedOrQuotationFlow])
def search_vehicle(request):
    """
    Search vehicle in DMVIC/NTSA database

    Security:
        - Authenticated users: Unlimited access
        - Anonymous users: Rate-limited (20 requests/hour per IP)
    """
```

## Security Benefits

### ✅ **Prevents Abuse**

- Rate limiting prevents DMVIC API abuse from anonymous users
- 20 requests/hour per IP is sufficient for legitimate quotation flow
- IP-based tracking considers `X-Forwarded-For` for reverse proxy setups

### ✅ **Supports Business Flow**

- Allows agents to check vehicles during quotation creation
- Supports potential future public quotation tools
- No authentication friction during the quote creation process

### ✅ **Scales with Authentication**

- Authenticated users get unlimited access
- Encourages users to register/login for better experience
- No rate limiting for logged-in agents (improved UX)

## Alternative Approaches Considered

### ❌ **Option 1: AllowAny** (NOT RECOMMENDED)

```python
@permission_classes([AllowAny])
```

**Problems:**

- No protection against abuse
- External parties could hammer DMVIC API
- Potential cost implications (if DMVIC charges per request)
- Security vulnerability

### ⚠️ **Option 2: IsAuthenticated** (TOO RESTRICTIVE)

```python
@permission_classes([IsAuthenticated])
```

**Problems:**

- Blocks quotation flow for non-logged-in users
- Forces authentication before vehicle search
- Poor UX for quotation process

### ✅ **Option 3: Custom Permission** (IMPLEMENTED)

```python
@permission_classes([IsAuthenticatedOrQuotationFlow])
```

**Benefits:**

- Balanced approach
- Security with usability
- Rate limiting prevents abuse
- Supports quotation flow

## Rate Limit Configuration

Current settings are optimized for quotation flow:

```python
RATE_LIMIT_REQUESTS = 20  # requests
RATE_LIMIT_PERIOD = 3600  # seconds (1 hour)
```

### Adjusting Rate Limits

If you need to change the rate limits, edit `insurance-app/app/permissions.py`:

```python
class IsAuthenticatedOrQuotationFlow(permissions.BasePermission):
    # Increase for higher volume
    RATE_LIMIT_REQUESTS = 50  # Example: 50 requests
    RATE_LIMIT_PERIOD = 3600  # Per hour

    # Or change period
    RATE_LIMIT_REQUESTS = 20
    RATE_LIMIT_PERIOD = 1800  # 30 minutes
```

## Monitoring Rate Limits

The implementation uses Django's cache system. To monitor rate limits:

```python
from django.core.cache import cache

# Check current count for an IP
ip_address = "192.168.1.1"
cache_key = f'dmvic_rate_limit:{ip_address}'
current_count = cache.get(cache_key, 0)
print(f"IP {ip_address} has made {current_count} requests")
```

## Testing

### Anonymous User Test

```bash
# Should work (first 20 requests)
curl -X POST http://localhost:8000/api/insurance/dmvic/search-vehicle/ \
  -H "Content-Type: application/json" \
  -d '{"registration_number": "KAA123A"}'

# Should fail after 20 requests from same IP
# Returns 403 Forbidden
```

### Authenticated User Test

```bash
# Should always work (no rate limit)
curl -X POST http://localhost:8000/api/insurance/dmvic/search-vehicle/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"registration_number": "KAA123A"}'
```

## Production Considerations

### 1. Cache Backend

Ensure you're using a production-ready cache backend (Redis/Memcached):

```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

### 2. Reverse Proxy Setup

If behind nginx/load balancer, ensure `X-Forwarded-For` is set:

```nginx
# nginx.conf
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

### 3. Rate Limit Alerts

Consider adding monitoring for rate limit violations:

```python
# In permissions.py
if request_count >= self.RATE_LIMIT_REQUESTS:
    logger.warning(f"Rate limit exceeded for IP: {ip_address}")
    # Could trigger alert/notification
    return False
```

## Summary

✅ **Security**: Rate limiting prevents API abuse  
✅ **Usability**: Supports quotation flow without authentication  
✅ **Scalability**: Authenticated users get unlimited access  
✅ **Best Practice**: Custom permission over AllowAny

This implementation follows Django REST Framework best practices and provides a secure, scalable solution for DMVIC integration.
