# Docker Quick Start

## ✅ Application is Running!

Your harmony exercise solver is now running in Docker:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f redis
```

### Restart a service
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Check status
```bash
docker-compose ps
```

## Services

1. **Backend** (Python FastAPI)
   - Port: 8000
   - Auto-reloads on code changes (volume mounted)

2. **Frontend** (React)
   - Port: 3000
   - Hot reload enabled

3. **Redis** (Caching)
   - Port: 6379
   - Used for solution caching

## Troubleshooting

### Port already in use
If ports 3000 or 8000 are busy, edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Change frontend port
  - "8001:8000"  # Change backend port
```

### Frontend not loading
Wait 30-60 seconds for React dev server to compile, then check:
```bash
docker-compose logs frontend
```

### Backend errors
Check logs:
```bash
docker-compose logs backend
```

### Clear everything and start fresh
```bash
docker-compose down -v
docker-compose up -d --build
```

## Next Steps

1. Open http://localhost:3000 in your browser
2. Try harmonizing a bass line
3. Check http://localhost:8000/docs for API documentation

