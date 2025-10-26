"""
Rate Limiting Middleware
Protects API from abuse and DDoS attacks
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import logging

logger = logging.getLogger(__name__)

# Initialize limiter
# Key function determines how to identify clients (by IP address)
# Default limits apply to all endpoints unless overridden
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute", "1000/hour"],
    headers_enabled=True,  # Add rate limit info to response headers
)

def setup_rate_limiting(app):
    """
    Configure rate limiting for the FastAPI application
    
    Args:
        app: FastAPI application instance
    """
    # Attach limiter to app state
    app.state.limiter = limiter
    
    # Add exception handler for rate limit exceeded
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    
    # Add SlowAPI middleware
    app.add_middleware(SlowAPIMiddleware)
    
    logger.info("Rate limiting configured: 100 requests/minute, 1000 requests/hour per IP")

# Custom rate limit decorators for different endpoint types
def auth_rate_limit():
    """Strict limit for authentication endpoints"""
    return "5/minute"

def create_rate_limit():
    """Moderate limit for resource creation"""
    return "20/minute"

def read_rate_limit():
    """Generous limit for read operations"""
    return "200/minute"

def delete_rate_limit():
    """Moderate limit for delete operations"""
    return "10/minute"
