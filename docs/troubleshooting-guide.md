# Troubleshooting Guide - Job Import System


### Issue 1: All Statistics Showing Zero

**Symptoms**:
- Total Imported: 0
- New Jobs: 0
- Updated Jobs: 0
- Failed Jobs: 0
- All imports stuck in "processing" status

**Root Cause**: Worker process is not running or not processing jobs

**Solution**:
1. Check if worker is running:
   ```bash
   cd server
   npm run worker
   ```

2. Verify Redis connection:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

3. Check worker logs for errors

4. Verify environment variables are set correctly

**Prevention**: Always run worker when scheduler is active

---

### Issue 2: Worker Not Starting

**Symptoms**:
- Worker process exits immediately
- Error messages about Redis connection
- Error messages about MongoDB connection

**Solution**:

1. **Check Redis Connection**:
   ```bash
   # Test Redis
   redis-cli -h localhost -p 6379 ping
   ```

   If connection fails:
   - Ensure Redis is running: `redis-server`
   - Check `REDIS_HOST` and `REDIS_PORT` in `.env`
   - If using Redis Cloud, verify `REDIS_PASSWORD`

2. **Check MongoDB Connection**:
   ```bash
   # Test MongoDB connection string
   mongosh "mongodb://localhost:27017/job_import_system"
   ```

   If connection fails:
   - Ensure MongoDB is running
   - Check `MONGODB_URI` in `.env`
   - Verify network access if using MongoDB Atlas

3. **Check Environment Variables**:
   ```bash
   cd server
   cat .env
   # Verify all required variables are set
   ```

---

### Issue 3: Jobs Stuck in Queue

**Symptoms**:
- Jobs queued but not processing
- Queue length increasing
- Worker running but not consuming jobs

**Solution**:

1. **Check Queue Status**:
   ```bash
   redis-cli
   > KEYS bull:job-import-queue:*
   > LLEN bull:job-import-queue:wait
   ```

2. **Restart Worker**:
   ```bash
   # Stop worker (Ctrl+C)
   # Start worker again
   npm run worker
   ```

3. **Check Worker Logs**:
   - Look for error messages
   - Verify worker is consuming jobs
   - Check for rate limiting or connection issues

4. **Clear Stuck Jobs** (if needed):
   ```bash
   # Use BullMQ dashboard or Redis CLI
   # Only if jobs are truly stuck
   ```

---

### Issue 4: ImportLog Status Never Updates

**Symptoms**:
- ImportLog entries remain in "processing" status
- Worker is running
- Jobs appear to be processed

**Solution**:

1. **Check Worker Logs**:
   ```bash
   # Look for "Worker completed job" messages
   # Check for errors in updateImportLog
   ```

2. **Verify logId is Passed**:
   - Check scheduler service passes `logId` to queue
   - Verify worker receives `logId` in job data

3. **Check Database Write Permissions**:
   - Ensure MongoDB user has write permissions
   - Check for database connection issues

4. **Manual Update Test**:
   ```javascript
   // In MongoDB shell or script
   db.importlogs.updateOne(
     { _id: ObjectId("...") },
     { $set: { status: "completed", totalImported: 10 } }
   )
   ```

---

### Issue 5: Jobs Failing to Import

**Symptoms**:
- `failedJobs` count > 0
- `failedReasons` array populated
- Jobs not appearing in database

**Solution**:

1. **Check Failed Reasons**:
   - View `failedReasons` in ImportLog entry
   - Common errors:
     - Missing `externalId`
     - Missing `title`
     - Invalid data format
     - Database constraint violations

2. **Verify Job Data Format**:
   ```javascript
   // Expected format
   {
     externalId: String (required),
     title: String (required),
     description: String,
     company: String,
     // ... other fields
   }
   ```

3. **Check API Response Format**:
   - Verify job API service parses data correctly
   - Check for API response changes
   - Validate XML/JSON structure

4. **Review Job Processor Service**:
   - Check validation logic
   - Verify upsert query
   - Ensure error handling is correct

---

### Issue 6: Statistics Not Updating

**Symptoms**:
- Individual ImportLog entries have correct counts
- Summary statistics show 0
- Dashboard not reflecting actual data

**Solution**:

1. **Check Statistics Endpoint**:
   ```bash
   curl http://localhost:5000/api/import-history/stats/summary
   ```

2. **Verify Aggregation Query**:
   - Check `routes/importHistory.js` aggregation
   - Ensure field names match ImportLog schema
   - Verify MongoDB aggregation is working

3. **Check Frontend API Call**:
   - Verify API URL is correct
   - Check network tab for API responses
   - Ensure data is being fetched

4. **Clear Browser Cache**:
   - Hard refresh (Ctrl+Shift+R)
   - Clear cache and reload

---

### Issue 7: Scheduler Not Running

**Symptoms**:
- No new imports being created
- Cron job not triggering
- Manual fetch works but scheduled doesn't

**Solution**:

1. **Check Scheduler Service**:
   ```javascript
   // Verify scheduler is started in index.js
   schedulerService.start();
   ```

2. **Check Cron Expression**:
   ```javascript
   // Default: '0 * * * *' (every hour)
   // Verify this is correct
   ```

3. **Check Server Logs**:
   ```bash
   # Look for "Cron: processing all sources" messages
   ```

4. **Manual Trigger Test**:
   ```bash
   # Use "Trigger Fetch" button in dashboard
   # Or API endpoint
   POST /api/import-history/trigger
   ```

---

### Issue 8: High Memory Usage

**Symptoms**:
- Worker process using too much memory
- Server crashes or becomes slow
- Processing large batches

**Solution**:

1. **Reduce Batch Size**:
   ```env
   BATCH_SIZE=50  # Instead of 100
   ```

2. **Reduce Concurrency**:
   ```env
   MAX_CONCURRENCY=3  # Instead of 5
   ```

3. **Process in Smaller Chunks**:
   - Modify scheduler to process fewer sources at once
   - Add delays between batches

4. **Monitor Memory**:
   ```bash
   # Use process monitor
   # Check for memory leaks
   ```

---

### Issue 9: Duplicate Jobs

**Symptoms**:
- Same job imported multiple times
- `newJobs` count higher than expected
- Jobs with same `externalId` appearing multiple times

**Solution**:

1. **Verify Upsert Logic**:
   ```javascript
   // Should use externalId + source as unique key
   Job.findOneAndUpdate(
     { externalId, source },
     { $set: doc },
     { upsert: true }
   )
   ```

2. **Check for Race Conditions**:
   - Multiple workers processing same job
   - Ensure only one worker instance per environment

3. **Verify externalId Uniqueness**:
   - Check if source provides unique IDs
   - Add logging to track duplicate attempts

---

### Issue 10: API Fetch Failures

**Symptoms**:
- ImportLog status: "failed"
- `totalFetched: 0`
- Error messages about API connection

**Solution**:

1. **Check API Endpoint**:
   ```bash
   curl https://jobicy.com/?feed=job_feed
   # Verify API is accessible
   ```

2. **Check Network/Firewall**:
   - Ensure server can access external APIs
   - Check for rate limiting
   - Verify SSL certificates

3. **Check API Response Format**:
   - Verify XML/JSON structure
   - Check for API changes
   - Update parser if needed

4. **Add Retry Logic**:
   - Implement exponential backoff
   - Retry failed API calls
   - Log retry attempts

---

## Diagnostic Commands

### Check System Status

```bash
# Check if all services are running
ps aux | grep node
ps aux | grep redis
ps aux | grep mongod

# Check Redis
redis-cli ping
redis-cli INFO

# Check MongoDB
mongosh "mongodb://localhost:27017/job_import_system" --eval "db.stats()"
```

### Check Queue Status

```bash
# Redis CLI
redis-cli
> KEYS bull:job-import-queue:*
> LLEN bull:job-import-queue:wait
> LLEN bull:job-import-queue:active
> LLEN bull:job-import-queue:completed
> LLEN bull:job-import-queue:failed
```

### Check Database

```javascript
// MongoDB shell
use job_import_system

// Count imports by status
db.importlogs.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])

// Find stuck processing jobs
db.importlogs.find({ 
  status: "processing",
  timestamp: { $lt: new Date(Date.now() - 3600000) } // Older than 1 hour
})

// Check job counts
db.jobs.countDocuments()
db.importlogs.countDocuments()
```

### Check Logs

```bash
# Backend logs
cd server
npm run dev  # Check console output

# Worker logs
cd server
npm run worker  # Check console output

# Check for errors
grep -i error server/logs/*.log  # If logging to files
```

---

## Health Check Endpoints

Add these endpoints for monitoring:

```javascript
// GET /api/health
{
  "status": "ok",
  "services": {
    "mongodb": "connected",
    "redis": "connected",
    "worker": "running"
  }
}
```

---

## Getting Help

If issues persist:

1. **Collect Information**:
   - Error messages from logs
   - System status (Redis, MongoDB, Worker)
   - Queue status
   - Recent ImportLog entries

2. **Check Documentation**:
   - `docs/zero-counts-issue.md`
   - `docs/system-architecture.md`
   - `README.md`

3. **Verify Configuration**:
   - Environment variables
   - Service versions
   - Network connectivity

4. **Test Components Individually**:
   - Test API fetch manually
   - Test database connection
   - Test Redis connection
   - Test worker processing

