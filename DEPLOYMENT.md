# Deployment Guide

This guide explains how to deploy the Job Import System to production.

## Architecture Overview

- **Frontend (Next.js)**: Deploy to Vercel
- **Backend API (Express)**: Deploy to Render, Railway, or similar
- **Worker Process**: Deploy to Render, Railway, or similar (separate service)
- **MongoDB**: Use MongoDB Atlas (free tier available)
- **Redis**: Use Redis Cloud or Upstash (free tier available)

## Prerequisites

1. **MongoDB Atlas Account** (Free): https://www.mongodb.com/cloud/atlas
2. **Redis Cloud Account** (Free): https://redis.com/try-free/ or https://upstash.com/
3. **Vercel Account** (Free): https://vercel.com/
4. **Render/Railway Account** (Free tier available): https://render.com/ or https://railway.app/

---

## Step 1: Set Up MongoDB Atlas

1. Create a free MongoDB Atlas account
2. Create a new cluster (free tier: M0)
3. Create a database user (save username and password)
4. Whitelist IP address: `0.0.0.0/0` (allow all IPs for now)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/job_import_system?retryWrites=true&w=majority`

---

## Step 2: Set Up Redis Cloud

### Option A: Redis Cloud
1. Sign up at https://redis.com/try-free/
2. Create a free database
3. Note: Host, Port, Password

### Option B: Upstash (Recommended - Easier)
1. Sign up at https://upstash.com/
2. Create a Redis database
3. Copy the REST URL or Redis URL

---

## Step 3: Deploy Backend API to Render

1. **Create a new Web Service on Render:**
   - Connect your GitHub repository
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`

2. **Set Environment Variables in Render:**
   ```
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=your_mongodb_atlas_connection_string
   REDIS_HOST=your_redis_host
   REDIS_PORT=your_redis_port
   REDIS_PASSWORD=your_redis_password
   MAX_CONCURRENCY=5
   BATCH_SIZE=100
   ```

3. **Deploy** - Render will automatically deploy your backend

4. **Note the Backend URL** - e.g., `https://your-backend.onrender.com`

---

## Step 4: Deploy Worker Process to Render

1. **Create a new Background Worker on Render:**
   - Same repository
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm run worker`
   - Environment: `Node`

2. **Set the same Environment Variables** as the backend API

3. **Deploy** - The worker will process jobs from the Redis queue

---

## Step 5: Deploy Frontend to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Import Project**:
   - Connect your GitHub repository
   - Root Directory: `client`
   - Framework Preset: **Next.js** (auto-detected)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

3. **Set Environment Variables**:
   - Go to Settings > Environment Variables
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com/api`
   - Make sure it's available for Production, Preview, and Development

4. **Deploy** - Vercel will automatically build and deploy

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to client directory
cd client

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variable
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-backend.onrender.com/api

# Deploy to production
vercel --prod
```

---

## Step 6: Verify Deployment

1. **Check Backend Health**: `https://your-backend.onrender.com/health`
2. **Check Frontend**: `https://your-app.vercel.app`
3. **Test API**: Visit `https://your-app.vercel.app` and check if data loads

---

## Environment Variables Summary

### Backend (Render)
```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
REDIS_HOST=...
REDIS_PORT=...
REDIS_PASSWORD=...
MAX_CONCURRENCY=5
BATCH_SIZE=100
```

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

---

## Troubleshooting

### Backend Issues

**Problem**: Backend not connecting to MongoDB
- **Solution**: Check MongoDB Atlas IP whitelist includes Render IPs (or use `0.0.0.0/0`)

**Problem**: Redis connection errors
- **Solution**: Verify Redis credentials in Render environment variables

**Problem**: Worker not processing jobs
- **Solution**: Ensure worker service is running and has same Redis credentials

### Frontend Issues

**Problem**: Frontend shows "Cannot connect to API"
- **Solution**: Check `NEXT_PUBLIC_API_URL` in Vercel environment variables

**Problem**: CORS errors
- **Solution**: Backend CORS is configured to allow all origins. If issues persist, update `server/src/index.js` CORS settings.

---

## Alternative Deployment Options

### Railway (Alternative to Render)
- Similar to Render, supports both web services and background workers
- Free tier available
- Easier Redis integration

### Heroku (Paid)
- Requires credit card for Redis addon
- More expensive but reliable

### DigitalOcean App Platform
- Good for production
- Requires paid plan

---

## Cost Estimate (Free Tier)

- **Vercel**: Free (frontend)
- **Render**: Free tier (backend + worker)
- **MongoDB Atlas**: Free tier (512MB storage)
- **Redis Cloud/Upstash**: Free tier (25MB-100MB)
- **Total**: $0/month for small-scale usage

---

## Monitoring

1. **Backend Logs**: Check Render dashboard logs
2. **Worker Logs**: Check Render worker service logs
3. **Frontend Logs**: Check Vercel dashboard logs
4. **MongoDB**: Check Atlas dashboard for connection metrics
5. **Redis**: Check Redis Cloud/Upstash dashboard

---

## Next Steps After Deployment

1. Set up custom domain (optional)
2. Enable HTTPS (automatic on Vercel and Render)
3. Set up monitoring/alerts
4. Configure backup for MongoDB
5. Set up CI/CD for automatic deployments

