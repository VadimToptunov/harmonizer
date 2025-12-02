# Quick Start - GitHub Deployment

## 🚀 Deploy in 5 Minutes

### Step 1: Fork Repository
Fork this repository to your GitHub account.

### Step 2: Deploy Backend (Choose One)

#### Option A: Railway (Easiest - Free Tier Available)
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your forked repository
4. Add environment variables:
   ```
   ENVIRONMENT=production
   FRONTEND_URL=https://yourusername.github.io/harmonizer
   ```
5. Railway auto-detects Python and deploys
6. Copy the deployment URL (e.g., `https://harmonizer-production.up.railway.app`)

#### Option B: Render (Free Tier Available)
1. Go to [render.com](https://render.com)
2. New Web Service → Connect GitHub
3. Select repository
4. Build: `pip install -r requirements.txt && pip install -r backend/requirements.txt`
5. Start: `gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
6. Add environment variables (same as Railway)
7. Copy deployment URL

### Step 3: Configure Frontend

1. Go to your repository Settings → Secrets and variables → Actions
2. Add secret: `REACT_APP_API_URL` = your backend URL from Step 2

### Step 4: Enable GitHub Pages

1. Go to Settings → Pages
2. Source: GitHub Actions
3. Save

### Step 5: Deploy

1. Push to `main` branch (or merge a PR)
2. GitHub Actions automatically:
   - Builds frontend
   - Deploys to GitHub Pages
3. Your app is live at: `https://yourusername.github.io/harmonizer`

## 🎯 What You Get

- ✅ Production-ready backend with caching
- ✅ Rate limiting (100 req/min)
- ✅ Health checks
- ✅ Automatic deployments
- ✅ HTTPS by default
- ✅ CDN for static assets

## 📊 Monitoring

- Backend health: `https://your-backend-url/health`
- Frontend: Automatically deployed on push

## 🔧 Customization

Edit `frontend/src/App.js` and `backend/main.py` to customize.

## 🐛 Troubleshooting

**Frontend not loading:**
- Check GitHub Pages is enabled
- Verify Actions workflow completed successfully

**Backend errors:**
- Check Railway/Render logs
- Verify environment variables are set
- Test `/health` endpoint

**CORS errors:**
- Update `FRONTEND_URL` in backend environment
- Check browser console for specific error

## 💰 Cost

- **GitHub Pages**: Free
- **Railway**: Free tier (500 hours/month)
- **Render**: Free tier available
- **Total**: $0/month for small to medium traffic

## 📈 Scaling

For high traffic:
1. Upgrade Railway/Render plan
2. Add Redis for distributed caching
3. Use Cloudflare for CDN and DDoS protection
4. Enable auto-scaling in your hosting provider

