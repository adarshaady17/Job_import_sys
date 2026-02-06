# Job Import System - Architecture Documentation

## Overview

The Job Import System is a queue-based job processing system that fetches jobs from external APIs, queues them for processing, and imports them into MongoDB using background workers.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Dashboard: View Import History, Statistics, Filters     │  │
│  └───────────────────────┬──────────────────────────────────┘  │
└──────────────────────────┼─────────────────────────────────────┘
                           │ HTTP/REST API
┌──────────────────────────▼─────────────────────────────────────┐
│                    Backend Server (Express)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Routes:                                              │  │
│  │  - /api/import-history (GET, POST)                       │  │
│  │  - /api/job-sources (CRUD)                               │  │
│  │  - /api/jobs (GET with filters)                          │  │
│  └───────────────────────┬──────────────────────────────────┘  │
│                          │                                      │
│  ┌───────────────────────▼──────────────────────────────────┐  │
│  │  Scheduler Service (node-cron)                           │  │
│  │  - Runs every hour                                       │  │
│  │  - Fetches jobs from APIs                                │  │
│  │  - Creates ImportLog entries                             │  │
│  │  - Queues jobs to Redis                                  │  │
│  └───────────────────────┬──────────────────────────────────┘  │
└──────────────────────────┼─────────────────────────────────────┘
                           │ Queue Jobs
┌──────────────────────────▼─────────────────────────────────────┐
│                    Redis Queue (BullMQ)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Queue: "job-import-queue"                              │  │
│  │  - Stores job batches                                    │  │
│  │  - Manages job state (waiting, active, completed)       │  │
│  └───────────────────────┬──────────────────────────────────┘  │
└──────────────────────────┼─────────────────────────────────────┘
                           │ Process Jobs
┌──────────────────────────▼─────────────────────────────────────┐
│                    Worker Process                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Job Processor Worker                                    │  │
│  │  - Consumes jobs from queue                              │  │
│  │  - Processes job batches                                 │  │
│  │  - Updates ImportLog with results                        │  │
│  └───────────────────────┬──────────────────────────────────┘  │
└──────────────────────────┼─────────────────────────────────────┘
                           │ Read/Write
┌──────────────────────────▼─────────────────────────────────────┐
│                    MongoDB Database                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Collections:                                            │  │
│  │  - jobs: Imported job records                            │  │
│  │  - importlogs: Import history and statistics            │  │
│  │  - jobsources: Job source configurations                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Frontend (Next.js)

**Location**: `client/`

**Responsibilities**:
- Display import history with pagination
- Show summary statistics (Total Imports, Fetched, Imported, New, Updated, Failed)
- Filter by source, status, date range
- Trigger manual fetch
- Real-time status updates

**Key Files**:
- `src/app/page.tsx` - Main dashboard component
- `src/lib/api.ts` - API client for backend communication

### 2. Backend Server (Express)

**Location**: `server/src/`

**Responsibilities**:
- REST API endpoints
- Request validation
- Database queries
- Error handling

**Key Routes**:
- `routes/importHistory.js` - Import history and statistics
- `routes/jobSources.js` - Job source management
- `routes/jobs.js` - Job listing with filters

### 3. Scheduler Service

**Location**: `server/src/services/schedulerService.js`

**Responsibilities**:
- Schedule periodic job fetches (every hour)
- Fetch jobs from external APIs
- Create ImportLog entries
- Queue jobs to Redis for processing
- Update job source last fetched timestamp

**Flow**:
1. Cron triggers `processAllSources()` every hour
2. For each active job source:
   - Create ImportLog with status "processing"
   - Fetch jobs from API using `jobApiService`
   - Update ImportLog with `totalFetched`
   - Split jobs into batches
   - Queue each batch to Redis
3. ImportLog status remains "processing" until worker completes

### 4. Job API Service

**Location**: `server/src/services/jobApiService.js`

**Responsibilities**:
- Fetch jobs from external APIs (XML/JSON feeds)
- Parse XML/JSON responses
- Normalize job data format
- Handle API errors

### 5. Redis Queue (BullMQ)

**Location**: `server/src/queues/jobQueue.js`

**Responsibilities**:
- Queue management
- Job persistence
- Retry logic
- Job state tracking

**Queue Name**: `job-import-queue`

**Job Data Structure**:
```javascript
{
  jobs: Array<JobData>,      // Batch of jobs to process
  source: String,            // Source URL/identifier
  logId: String             // ImportLog ID to update
}
```

### 6. Worker Process

**Location**: `server/src/workers/jobProcessor.js`

**Responsibilities**:
- Consume jobs from Redis queue
- Process job batches
- Update ImportLog with results
- Handle job failures

**Flow**:
1. Worker listens to `job-import-queue`
2. When job arrives:
   - Extract `jobs`, `source`, `logId` from job data
   - Call `jobProcessorService.processBatch()`
   - Update ImportLog with summary (new, updated, failed counts)
   - Set status to "completed" or "failed"

**Concurrency**: Configurable via `MAX_CONCURRENCY` env var (default: 5)

### 7. Job Processor Service

**Location**: `server/src/services/jobProcessorService.js`

**Responsibilities**:
- Process individual jobs
- Upsert jobs to MongoDB
- Determine if job is new or updated
- Track failures
- Update ImportLog

**Key Methods**:
- `processJob(jobData, source)` - Process single job
- `processBatch(jobs, source)` - Process batch of jobs
- `updateImportLog(logId, summary)` - Update ImportLog with results

**Job Upsert Logic**:
- Uses `externalId` + `source` as unique identifier
- If exists: Update (counts as "updated")
- If new: Insert (counts as "new")
- If error: Track as "failed"

### 8. Database Models

**Location**: `server/src/models/`

#### ImportLog Model
```javascript
{
  fileName: String,          // Source URL
  source: String,            // Source name
  timestamp: Date,           // When import started
  totalFetched: Number,      // Jobs fetched from API
  totalImported: Number,     // Successfully imported (new + updated)
  newJobs: Number,           // Newly created jobs
  updatedJobs: Number,       // Updated existing jobs
  failedJobs: Number,        // Failed imports
  failedReasons: Array,      // Details of failures
  status: String,            // pending | processing | completed | failed
  processingTime: Number     // Time taken in ms
}
```

#### Job Model
```javascript
{
  externalId: String,        // Unique ID from source
  source: String,            // Source identifier
  title: String,
  description: String,
  company: String,
  location: String,
  category: String,
  jobType: String,
  salary: String,
  url: String,
  publishedDate: Date,
  rawData: Object            // Original job data
}
```

#### JobSource Model
```javascript
{
  url: String,               // API endpoint URL
  name: String,              // Display name
  isActive: Boolean,         // Whether to fetch from this source
  lastFetched: Date         // Last successful fetch time
}
```

## Data Flow

### Import Flow

1. **Scheduler triggers** (cron or manual)
2. **Fetch jobs** from external API
3. **Create ImportLog** entry (status: "processing", totalFetched: N)
4. **Queue jobs** to Redis in batches
5. **Worker processes** jobs from queue
6. **Update ImportLog** with results (status: "completed", counts updated)

### Statistics Calculation

Statistics are calculated by aggregating ImportLog entries:

```javascript
{
  totalImports: Count of all ImportLog entries
  totalFetched: Sum of totalFetched from all logs
  totalImported: Sum of totalImported from all logs
  totalNew: Sum of newJobs from all logs
  totalUpdated: Sum of updatedJobs from all logs
  totalFailed: Sum of failedJobs from all logs
}
```

## Configuration

### Environment Variables

**Backend** (`.env`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/job_import_system
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
MAX_CONCURRENCY=5        # Worker concurrency
BATCH_SIZE=100           # Jobs per batch
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Deployment Architecture

### Development
- Frontend: `npm run dev` (Next.js dev server)
- Backend: `npm run dev` (Express server)
- Worker: `npm run worker` (separate process)

### Production
- Frontend: Vercel (static/SSR)
- Backend: Render/Railway (Express server)
- Worker: Render/Railway (background worker, separate instance)
- Database: MongoDB Atlas
- Queue: Redis Cloud / Upstash

## Critical Dependencies

1. **Worker must be running** for jobs to be processed
2. **Redis must be accessible** by both scheduler and worker
3. **MongoDB must be accessible** by backend and worker
4. **Scheduler and Worker** must use same Redis instance

## Error Handling

- **API fetch failures**: ImportLog status set to "failed"
- **Job processing failures**: Tracked in `failedJobs` and `failedReasons`
- **Worker failures**: Jobs retried by BullMQ (with exponential backoff)
- **Database errors**: Logged, ImportLog may remain in "processing" status

## Performance Considerations

- **Batch processing**: Jobs processed in batches (default: 100)
- **Concurrency**: Multiple jobs processed in parallel (default: 5)
- **Indexing**: ImportLog indexed on `timestamp` and `fileName`
- **Pagination**: Import history paginated (default: 20 per page)

