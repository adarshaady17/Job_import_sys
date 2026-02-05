# Vercel Deployment Checklist

Use this checklist to ensure everything is ready for deployment.

## ✅ Pre-Deployment Checklist

### Frontend (Vercel)
- [x] `client/package.json` has correct dependencies
- [x] `client/next.config.js` is configured
- [x] `client/vercel.json` is simplified (or removed - Vercel auto-detects Next.js)
- [x] `client/.vercelignore` excludes unnecessary files
- [x] Environment variable `NEXT_PUBLIC_API_URL` documented

### Backend (Render/Railway)
- [x] `server/package.json` has all dependencies
- [x] `server/src/index.js` has proper error handling
- [x] CORS is configured for production
- [x] Environment variables documented in `.env.example`
- [x] Health check endpoint `/health` exists

### Code Quality
- [x] No hardcoded localhost URLs in production code
- [x] All environment variables use `process.env`
- [x] Error handling is in place
- [x] Logging is configured

## 🚀 Deployment Steps

### 1. Set Up Databases

- [ ] **MongoDB Atlas**
  - [ ] Create account
  - [ ] Create cluster (free tier)
  - [ ] Create database user
  - [ ] Whitelist IPs (0.0.0.0/0 for now)
  - [ ] Copy connection string

- [ ] **Redis Cloud/Upstash**
  - [ ] Create account
  - [ ] Create database
  - [ ] Copy connection details (host, port, password) OR Redis URL

### 2. Deploy Backend to Render

- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Set root directory: `server`
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Add environment variables:
  - [ ] `MONGODB_URI`
  - [ ] `REDIS_HOST` (or `REDIS_URL`)
  - [ ] `REDIS_PORT`
  - [ ] `REDIS_PASSWORD`
  - [ ] `NODE_ENV=production`
  - [ ] `MAX_CONCURRENCY=5`
  - [ ] `BATCH_SIZE=100`
- [ ] Deploy and note the URL (e.g., `https://your-backend.onrender.com`)

### 3. Deploy Worker to Render

- [ ] Create new Background Worker
- [ ] Same repository, root directory: `server`
- [ ] Start command: `npm run worker`
- [ ] Same environment variables as backend
- [ ] Deploy

### 4. Deploy Frontend to Vercel

- [ ] Import project in Vercel dashboard
- [ ] Set root directory: `client`
- [ ] Framework: Next.js (auto-detected)
- [ ] Add environment variable:
  - [ ] `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com/api`
- [ ] Deploy

### 5. Verify Deployment

- [ ] Backend health check: `https://your-backend.onrender.com/health`
- [ ] Frontend loads: `https://your-app.vercel.app`
- [ ] API calls work from frontend
- [ ] Check browser console for errors
- [ ] Test import history page loads
- [ ] Test trigger fetch button

## 🐛 Common Issues & Fixes

### Issue: Frontend shows "Cannot connect to API"
- **Fix**: Check `NEXT_PUBLIC_API_URL` in Vercel environment variables
- **Fix**: Ensure backend URL is correct (no trailing slash)

### Issue: CORS errors
- **Fix**: Backend CORS allows all origins. If issues persist, check backend logs.

### Issue: MongoDB connection fails
- **Fix**: Check MongoDB Atlas IP whitelist includes Render IPs
- **Fix**: Verify connection string format

### Issue: Redis connection fails
- **Fix**: Verify Redis credentials in Render environment variables
- **Fix**: Check if using `REDIS_URL` vs individual `REDIS_HOST/PORT/PASSWORD`

### Issue: Worker not processing jobs
- **Fix**: Ensure worker service is running
- **Fix**: Check worker logs in Render dashboard
- **Fix**: Verify Redis connection in worker

## 📊 Post-Deployment Monitoring

- [ ] Check Render logs for backend
- [ ] Check Render logs for worker
- [ ] Check Vercel logs for frontend
- [ ] Monitor MongoDB Atlas dashboard
- [ ] Monitor Redis dashboard
- [ ] Test full import flow

## 🔄 Updates & Maintenance

- [ ] Set up automatic deployments (GitHub integration)
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring/alerts
- [ ] Regular backups of MongoDB

---

**Need Help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

