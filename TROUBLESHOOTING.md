# Troubleshooting Guide

## Common Issues and Solutions

### 1. Server Returns 404 for `/api`

**Problem**: Accessing `http://localhost:5000/api` returns `{"success":false,"message":"Route not found"}`

**Solution**: 
- ✅ Fixed! Added root route handler at `/api` that shows available endpoints
- Now `/api` will return a list of available endpoints
- Use specific endpoints like `/api/import-history` for actual data

**Test**:
```bash
# Should return list of endpoints
curl http://localhost:5000/api

# Should return import history
curl http://localhost:5000/api/import-history
```

---

### 2. Frontend Cannot Connect to Backend

**Problem**: Frontend shows "Failed to load resource: 404" or CORS errors

**Solutions**:

1. **Check Backend is Running**:
   ```bash
   cd server
   npm run dev
   ```
   Should see: `✅ Server running on port 5000`

2. **Check Backend Health**:
   ```bash
   curl http://localhost:5000/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

3. **Check Environment Variable**:
   - In `client/.env.local`, ensure:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```
   - Restart Next.js dev server after changing `.env.local`

4. **Check CORS**:
   - Backend CORS is now set to allow all origins
   - If still having issues, check browser console for specific error

---

### 3. MongoDB Connection Errors

**Problem**: Server fails to start with MongoDB connection error

**Solutions**:

1. **Local MongoDB**:
   ```bash
   # Check if MongoDB is running
   mongosh
   # Or check service status
   ```

2. **MongoDB Atlas**:
   - Verify connection string in `.env`
   - Check IP whitelist includes your IP (or `0.0.0.0/0` for testing)
   - Verify username/password are correct

3. **Test Connection**:
   ```bash
   cd server
   node -e "require('dotenv').config(); require('./src/config/database')()"
   ```

---

### 4. Redis Connection Errors

**Problem**: Redis connection errors in console (but server still runs)

**Solutions**:

1. **Local Redis**:
   ```bash
   # Check if Redis is running
   redis-cli ping
   # Should return: PONG
   ```

2. **Redis Cloud/Upstash**:
   - Verify credentials in `.env`
   - Check if using `REDIS_URL` or individual `REDIS_HOST/PORT/PASSWORD`

3. **Note**: Server will start even if Redis is not connected (for testing)
   - Queue operations will fail, but API endpoints will work
   - Worker process requires Redis to function

---

### 5. Routes Not Working

**Problem**: Specific API endpoints return 404

**Check**:
1. Verify route is registered in `server/src/routes/index.js`
2. Check route file exists and exports router correctly
3. Restart server after making changes

**Test Routes**:
```bash
# Root API
curl http://localhost:5000/api

# Import history
curl http://localhost:5000/api/import-history

# Stats
curl http://localhost:5000/api/import-history/stats/summary

# Job sources
curl http://localhost:5000/api/job-sources

# Jobs
curl http://localhost:5000/api/jobs
```

---

### 6. Frontend Build Errors

**Problem**: `npm run build` fails in client

**Solutions**:

1. **TypeScript Errors**:
   ```bash
   cd client
   npm run lint
   # Fix any TypeScript errors
   ```

2. **Missing Dependencies**:
   ```bash
   cd client
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Environment Variables**:
   - Ensure `NEXT_PUBLIC_API_URL` is set in Vercel dashboard (for production)
   - Or in `.env.local` (for local development)

---

### 7. Worker Not Processing Jobs

**Problem**: Jobs are queued but not processed

**Solutions**:

1. **Check Worker is Running**:
   ```bash
   cd server
   npm run worker
   ```
   Should see: `Job processor worker started with concurrency 5`

2. **Check Redis Connection**:
   - Worker requires Redis to be connected
   - Check Redis logs in worker console

3. **Check Queue**:
   - Verify jobs are being added to queue
   - Check backend logs for queue operations

---

## Quick Diagnostic Commands

### Test Server Routes
```bash
cd server
node test-server.js
```

### Check Server Logs
Look for:
- ✅ MongoDB Connected
- ✅ Redis Connected (or ⚠️ Redis connection error)
- ✅ Server running on port 5000

### Test API Endpoints
```bash
# Health check
curl http://localhost:5000/health

# API root
curl http://localhost:5000/api

# Import history
curl http://localhost:5000/api/import-history

# Stats
curl http://localhost:5000/api/import-history/stats/summary
```

### Check Frontend Console
Open browser DevTools (F12) and check:
- Network tab for failed requests
- Console tab for errors
- Look for API request logs (added interceptors)

---

## Still Having Issues?

1. **Check all services are running**:
   - Backend: `cd server && npm run dev`
   - Worker: `cd server && npm run worker` (separate terminal)
   - Frontend: `cd client && npm run dev` (separate terminal)

2. **Check environment variables**:
   - Backend `.env` file exists
   - Frontend `.env.local` file exists
   - All required variables are set

3. **Check logs**:
   - Backend console output
   - Frontend browser console
   - Network tab in browser DevTools

4. **Restart everything**:
   - Stop all processes (Ctrl+C)
   - Restart backend
   - Restart worker
   - Restart frontend

