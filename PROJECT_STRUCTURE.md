# Project Structure

```
Job_import_sys/
├── client/                          # Next.js Frontend (Deploy to Vercel)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout
│   │   │   ├── page.tsx             # Main dashboard page
│   │   │   └── globals.css          # Global styles
│   │   └── lib/
│   │       └── api.ts               # API client & types
│   ├── package.json                 # Frontend dependencies
│   ├── next.config.js               # Next.js configuration
│   ├── tsconfig.json                # TypeScript configuration
│   ├── vercel.json                  # Vercel deployment config
│   └── .vercelignore                # Files to ignore in Vercel
│
├── server/                          # Express Backend (Deploy to Render/Railway)
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # MongoDB connection
│   │   │   └── redis.js             # Redis connection
│   │   ├── models/
│   │   │   ├── Job.js               # Job model
│   │   │   ├── ImportLog.js         # Import log model
│   │   │   └── JobSource.js         # Job source model
│   │   ├── services/
│   │   │   ├── jobApiService.js     # API fetching service
│   │   │   ├── jobProcessorService.js  # Job processing logic
│   │   │   └── schedulerService.js  # Cron scheduler
│   │   ├── routes/
│   │   │   ├── importHistory.js    # Import history routes
│   │   │   ├── jobSources.js       # Job sources routes
│   │   │   ├── jobs.js              # Jobs routes
│   │   │   └── index.js             # Route aggregator
│   │   ├── queues/
│   │   │   └── jobQueue.js         # BullMQ queue setup
│   │   ├── workers/
│   │   │   └── jobProcessor.js     # Worker process (separate deployment)
│   │   ├── utils/
│   │   │   └── logger.js            # Logging utility
│   │   └── index.js                 # Express app entry point
│   ├── package.json                 # Backend dependencies
│   └── .vercelignore                # Files to ignore (if deploying)
│
├── docs/                            # Documentation
│   └── architecture.md              # System architecture (if exists)
│
├── .gitignore                       # Git ignore rules
├── README.md                        # Main README
├── DEPLOYMENT.md                    # Deployment guide
├── VERCEL_DEPLOY_CHECKLIST.md      # Deployment checklist
└── PROJECT_STRUCTURE.md            # This file
```

## Key Files for Deployment

### Frontend (Vercel)
- **Root**: `client/` directory
- **Build**: `npm run build` (auto-detected)
- **Config**: `client/next.config.js`
- **Env**: Set `NEXT_PUBLIC_API_URL` in Vercel dashboard

### Backend API (Render/Railway)
- **Root**: `server/` directory
- **Start**: `npm start` (runs `src/index.js`)
- **Env**: MongoDB URI, Redis config, etc.

### Worker (Render/Railway - Background Worker)
- **Root**: `server/` directory
- **Start**: `npm run worker` (runs `src/workers/jobProcessor.js`)
- **Env**: Same as backend API

## Environment Variables

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

### Backend & Worker (Render/Railway)
```
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
REDIS_HOST=... (or REDIS_URL=...)
REDIS_PORT=...
REDIS_PASSWORD=...
MAX_CONCURRENCY=5
BATCH_SIZE=100
```

