# Worker Setup and Configuration Guide

## Overview

The worker process is **critical** for the Job Import System to function. Without the worker running, jobs will be queued but never processed, resulting in all statistics showing zero.

## What is the Worker?

The worker is a separate Node.js process that:
- Consumes jobs from the Redis queue (BullMQ)
- Processes job batches
- Imports jobs into MongoDB
- Updates ImportLog entries with results

**Location**: `server/src/workers/jobProcessor.js`

## Starting the Worker

### Development

```bash
cd server
npm run worker
```

You should see:
```
Job processor worker started with concurrency 5
```

### Production

The worker must run as a separate process/instance from the main server.

**Option 1: Separate Process Manager (PM2)**

```bash
# Install PM2
npm install -g pm2

# Start worker
cd server
pm2 start src/workers/jobProcessor.js --name job-worker

# Or use npm script
pm2 start npm --name job-worker -- run worker

# Check status
pm2 status

# View logs
pm2 logs job-worker

# Auto-restart on reboot
pm2 startup
pm2 save
```

**Option 2: Systemd Service (Linux)**

Create `/etc/systemd/system/job-worker.service`:

```ini
[Unit]
Description=Job Import Worker
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/Job_import_sys/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/workers/jobProcessor.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable job-worker
sudo systemctl start job-worker
sudo systemctl status job-worker
```

**Option 3: Render/Railway Background Worker**

1. Create a new service/worker instance
2. Set start command: `npm run worker`
3. Use same environment variables as main server
4. Deploy separately from main server

## Configuration

### Environment Variables

The worker uses the same `.env` file as the server:

```env
# Redis Connection (REQUIRED)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MongoDB Connection (REQUIRED)
MONGODB_URI=mongodb://localhost:27017/job_import_system

# Worker Configuration
MAX_CONCURRENCY=5        # Number of jobs processed in parallel
BATCH_SIZE=100           # Jobs per batch (set by scheduler)
```

### Concurrency

`MAX_CONCURRENCY` controls how many jobs the worker processes simultaneously:

- **Low (1-3)**: Slower but more stable, less resource usage
- **Medium (5-10)**: Balanced performance
- **High (10+)**: Faster but more resource intensive, may cause issues

**Recommendation**: Start with 5, adjust based on system resources and performance.

## Verifying Worker is Running

### Check Process

```bash
# Linux/Mac
ps aux | grep "jobProcessor\|worker"

# Windows
tasklist | findstr node
```

### Check Logs

Worker logs important events:
- Job completion: `Worker completed job <id>`
- Job failures: `Worker failed job <id>`
- Errors: Any error messages

### Check Queue Status

```bash
# Using Redis CLI
redis-cli
> LLEN bull:job-import-queue:wait      # Should decrease
> LLEN bull:job-import-queue:active    # Should match concurrency
> LLEN bull:job-import-queue:completed # Should increase
```

### Check ImportLog Updates

After worker processes jobs:
- Status should change from "processing" to "completed"
- Counts should be updated (totalImported, newJobs, updatedJobs, failedJobs)

## Worker Lifecycle

```
1. Worker starts
   ↓
2. Connects to Redis
   ↓
3. Connects to MongoDB
   ↓
4. Listens to queue: "job-import-queue"
   ↓
5. When job arrives:
   - Process job batch
   - Update ImportLog
   - Mark job as completed
   ↓
6. Continue listening for more jobs
```

## Common Issues

### Issue: Worker Exits Immediately

**Causes**:
- Redis connection failed
- MongoDB connection failed
- Missing environment variables
- Syntax errors in code

**Solution**:
1. Check error messages in console
2. Verify Redis is running: `redis-cli ping`
3. Verify MongoDB is accessible
4. Check `.env` file exists and has correct values

### Issue: Worker Not Processing Jobs

**Causes**:
- Queue name mismatch
- Redis connection issues
- Jobs not being queued properly

**Solution**:
1. Verify queue name: `"job-import-queue"`
2. Check Redis connection
3. Verify jobs are in queue: `redis-cli KEYS bull:job-import-queue:*`
4. Check worker logs for errors

### Issue: Worker Processing Slowly

**Causes**:
- Low concurrency setting
- Large batch sizes
- Database performance issues
- Network latency

**Solution**:
1. Increase `MAX_CONCURRENCY` (if resources allow)
2. Reduce `BATCH_SIZE` in scheduler
3. Optimize database queries
4. Check network connectivity

### Issue: Worker Crashes

**Causes**:
- Unhandled errors
- Memory issues
- Database connection lost
- Redis connection lost

**Solution**:
1. Use process manager (PM2, systemd) for auto-restart
2. Check error logs
3. Monitor memory usage
4. Add error handling and retries

## Monitoring

### Health Check

Create a simple health check endpoint or script:

```javascript
// health-check.js
const redis = require('./src/config/redis');
const mongoose = require('mongoose');

async function checkHealth() {
  try {
    // Check Redis
    await redis.ping();
    console.log('✓ Redis connected');
    
    // Check MongoDB
    await mongoose.connection.db.admin().ping();
    console.log('✓ MongoDB connected');
    
    // Check queue
    const Queue = require('bullmq').Queue;
    const queue = new Queue('job-import-queue', { connection: redis });
    const waiting = await queue.getWaitingCount();
    const active = await queue.getActiveCount();
    console.log(`✓ Queue: ${waiting} waiting, ${active} active`);
    
    console.log('All systems operational');
  } catch (err) {
    console.error('Health check failed:', err);
    process.exit(1);
  }
}

checkHealth();
```

Run periodically:
```bash
node health-check.js
```

### Logging

For production, consider structured logging:

```javascript
// Use winston, pino, or similar
const logger = require('./src/utils/logger');

worker.on('completed', (job) => {
  logger.info('Job completed', { jobId: job.id });
});

worker.on('failed', (job, err) => {
  logger.error('Job failed', { jobId: job?.id, error: err.message });
});
```

## Best Practices

1. **Always Run Worker**: Never run scheduler without worker
2. **Monitor Health**: Set up alerts for worker failures
3. **Use Process Manager**: PM2 or systemd for auto-restart
4. **Separate Instances**: Run worker separately from main server in production
5. **Resource Limits**: Set appropriate concurrency based on resources
6. **Error Handling**: Ensure worker handles errors gracefully
7. **Logging**: Log important events for debugging
8. **Graceful Shutdown**: Worker handles SIGINT/SIGTERM for clean shutdown

## Production Deployment

### Render

1. Create new **Background Worker** service
2. Connect to same repository
3. Root directory: `server`
4. Build command: `npm install`
5. Start command: `npm run worker`
6. Environment variables: Same as main server

### Railway

1. Create new service
2. Source: Same repository
3. Root directory: `server`
4. Start command: `npm run worker`
5. Environment variables: Same as main server

### Docker

```dockerfile
# Dockerfile.worker
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ .
CMD ["node", "src/workers/jobProcessor.js"]
```

```yaml
# docker-compose.yml
services:
  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    environment:
      - REDIS_HOST=redis
      - MONGODB_URI=mongodb://mongo:27017/job_import_system
    depends_on:
      - redis
      - mongo
    restart: unless-stopped
```

## Testing Worker

### Manual Test

1. Start worker: `npm run worker`
2. Trigger fetch from dashboard
3. Watch logs for job processing
4. Verify ImportLog updates

### Load Test

1. Queue multiple jobs
2. Monitor worker performance
3. Check resource usage
4. Verify all jobs complete

## Related Documentation

- `docs/zero-counts-issue.md` - Why counts show zero without worker
- `docs/system-architecture.md` - Overall system architecture
- `docs/troubleshooting-guide.md` - Common issues and solutions

