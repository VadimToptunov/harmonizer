"""
Caching layer for harmony solutions.
"""
import hashlib
import json
from typing import Optional, Dict, List
import redis
import os
from functools import lru_cache

# Redis connection pool for better performance
redis_pool = None
redis_client = None

def get_redis_pool():
    """Get or create Redis connection pool."""
    global redis_pool
    if redis_pool is None:
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        redis_pool = redis.ConnectionPool.from_url(
            redis_url,
            decode_responses=True,
            max_connections=50,
            retry_on_timeout=True
        )
    return redis_pool

def get_redis_client():
    """Get or create Redis client with connection pooling."""
    global redis_client
    if redis_client is None:
        pool = get_redis_pool()
        redis_client = redis.Redis(connection_pool=pool)
    return redis_client


# In-memory cache for cache keys (since they're already hashed strings)
_cache_key_cache = {}

def cache_key(operation: str, **kwargs) -> str:
    """Generate cache key from operation and parameters.
    
    Note: We can't use @lru_cache with **kwargs because dicts are not hashable.
    Instead, we use a simple in-memory cache keyed by the JSON string representation.
    """
    key_data = {
        'operation': operation,
        **kwargs
    }
    key_string = json.dumps(key_data, sort_keys=True)
    
    # Simple in-memory cache for the final hash
    if key_string not in _cache_key_cache:
        _cache_key_cache[key_string] = f"harmony:{hashlib.md5(key_string.encode()).hexdigest()}"
    
    return _cache_key_cache[key_string]


def get_cached_solution(operation: str, **kwargs) -> Optional[Dict]:
    """Get cached solution if exists."""
    try:
        client = get_redis_client()
        key = cache_key(operation, **kwargs)
        cached = client.get(key)
        if cached:
            return json.loads(cached)
    except Exception as e:
        # If Redis fails, continue without cache
        print(f"Cache error: {e}")
    return None


def cache_solution(operation: str, solution: Dict, ttl: int = 3600, **kwargs):
    """Cache solution with TTL."""
    try:
        client = get_redis_client()
        key = cache_key(operation, **kwargs)
        client.setex(key, ttl, json.dumps(solution))
    except Exception as e:
        # If Redis fails, continue without cache
        print(f"Cache error: {e}")

