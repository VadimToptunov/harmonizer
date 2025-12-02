"""
Middleware for rate limiting and monitoring.
"""
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import time
import redis
import os
from collections import defaultdict
from datetime import datetime, timedelta

# Simple in-memory rate limiter (for production, use Redis)
rate_limit_store = defaultdict(list)
rate_limit_window = 60  # seconds
rate_limit_max_requests = 100  # per window


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware."""
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        client_ip = request.client.host
        current_time = time.time()
        
        # Clean old entries
        rate_limit_store[client_ip] = [
            t for t in rate_limit_store[client_ip]
            if current_time - t < rate_limit_window
        ]
        
        # Check rate limit
        if len(rate_limit_store[client_ip]) >= rate_limit_max_requests:
            return Response(
                content='{"detail": "Rate limit exceeded"}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": str(rate_limit_window)}
            )
        
        # Add current request
        rate_limit_store[client_ip].append(current_time)
        
        # Process request
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Add timing header
        response.headers["X-Process-Time"] = str(process_time)
        
        return response


class MonitoringMiddleware(BaseHTTPMiddleware):
    """Monitoring middleware for request tracking."""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        
        # Log slow requests
        if process_time > 1.0:
            print(f"Slow request: {request.url.path} took {process_time:.2f}s")
        
        return response

