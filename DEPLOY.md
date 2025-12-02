# Deployment Guide

## GitHub Pages Deployment (Frontend)

### Option 1: Automatic via GitHub Actions

The repository includes GitHub Actions workflow that automatically deploys frontend to GitHub Pages on push to `main` branch.

1. Enable GitHub Pages in repository settings:
   - Go to Settings → Pages
   - Source: GitHub Actions

2. Push to `main` branch - deployment happens automatically

### Option 2: Manual Deployment

```bash
cd frontend
npm install
npm run build
# Copy build/ folder contents to gh-pages branch
```

## Backend Deployment Options

### Option 1: Railway (Recommended for GitHub)

1. Fork this repository
2. Go to [Railway](https://railway.app)
3. New Project → Deploy from GitHub repo
4. Select your forked repository
5. Add environment variables:
   - `ENVIRONMENT=production`
   - `FRONTEND_URL=https://yourusername.github.io/harmonizer`
   - `REDIS_URL=redis://...` (Railway provides Redis)

### Option 2: Render

1. Create new Web Service on Render
2. Connect GitHub repository
3. Build command: `pip install -r requirements.txt && pip install -r backend/requirements.txt`
4. Start command: `gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
5. Add Redis addon

### Option 3: Docker on VPS

```bash
# Clone repository
git clone https://github.com/yourusername/harmonizer.git
cd harmonizer

# Build and run with docker-compose
docker-compose -f docker-compose.prod.yml up -d

# Update frontend URL in docker-compose.prod.yml
# Update nginx configuration if needed
```

## Environment Variables

### Backend

- `ENVIRONMENT`: `production` or `development`
- `FRONTEND_URL`: Your frontend URL (e.g., `https://yourusername.github.io/harmonizer`)
- `REDIS_URL`: Redis connection string (optional, for caching)
- `SECRET_KEY`: Secret key for JWT (if implementing auth)

### Frontend

- `REACT_APP_API_URL`: Backend API URL (e.g., `https://your-backend.railway.app`)

## Performance Optimization

### Caching Strategy

- Redis caching for harmonization results (1 hour TTL)
- Static assets cached for 1 year
- API responses cached where appropriate

### Rate Limiting

- 100 requests per minute per IP
- Configurable via `RateLimitMiddleware`

### Load Balancing

- Gunicorn with 4 workers
- Nginx as reverse proxy
- Redis for session/cache sharing

## Monitoring

### Health Checks

- `/health` endpoint for load balancer health checks
- Checks Redis connectivity
- Returns service status

### Logging

- Application logs to stdout (captured by container)
- Slow request logging (>1s)
- Error tracking

## Scaling

### Horizontal Scaling

1. Deploy multiple backend instances
2. Use load balancer (nginx/cloudflare)
3. Shared Redis for cache
4. Stateless backend design

### Vertical Scaling

- Increase Gunicorn workers: `-w 8`
- Increase Redis memory
- Use connection pooling

## Security

### Production Checklist

- [ ] Set `ENVIRONMENT=production`
- [ ] Configure CORS with specific frontend URL
- [ ] Enable rate limiting
- [ ] Use HTTPS (via nginx/cloudflare)
- [ ] Set secure cookie flags
- [ ] Disable debug endpoints in production
- [ ] Use secrets management for sensitive data

## Troubleshooting

### Frontend not connecting to backend

1. Check `REACT_APP_API_URL` environment variable
2. Verify CORS settings in backend
3. Check browser console for errors

### High latency

1. Check Redis connection
2. Monitor backend logs for slow queries
3. Verify caching is working
4. Check network latency

### Rate limit errors

1. Increase rate limit in `middleware.py`
2. Implement user authentication for higher limits
3. Use Redis for distributed rate limiting

