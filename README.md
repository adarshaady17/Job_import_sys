# Job Import System

A scalable job import system that pulls data from external APIs, queues jobs using Redis, imports them into MongoDB using worker processes, and provides an admin dashboard to view import history.

## 🚀 Quick Deploy to Vercel

**Frontend**: Deploy to Vercel (see [DEPLOYMENT.md](./DEPLOYMENT.md))  
**Backend**: Deploy to Render/Railway (see [DEPLOYMENT.md](./DEPLOYMENT.md))

## 📋 Features

- ✅ Fetch jobs from multiple external APIs (XML/JSON support)
- ✅ Queue-based background processing with Redis + BullMQ
- ✅ Efficient MongoDB upsert logic to handle updates
- ✅ Import history tracking with detailed statistics
- ✅ Admin dashboard with filtering and pagination
- ✅ Cron-based scheduling (runs every hour)
- ✅ Configurable concurrency and batch processing
- ✅ Retry logic with exponential backoff
- ✅ Scalable architecture for handling 1M+ records

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Redis** for queue management
- **BullMQ** for job queue processing
- **node-cron** for scheduling

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **React**

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- Redis (local or cloud)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd Job_import_sys
```

2. **Backend Setup**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB and Redis credentials
```

3. **Frontend Setup**
```bash
cd client
npm install
cp .env.example .env.local
# Edit .env.local with your backend API URL
```

4. **Start Services**
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Worker
cd server
npm run worker

# Terminal 3: Frontend
cd client
npm run dev
```

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Quick Summary:**
- **Frontend**: Deploy `client/` folder to Vercel
- **Backend**: Deploy `server/` folder to Render/Railway
- **Worker**: Deploy `server/` as background worker to Render/Railway
- **Database**: Use MongoDB Atlas (free tier)
- **Queue**: Use Redis Cloud or Upstash (free tier)

## 📚 Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [docs/architecture.md](./docs/architecture.md) - System architecture (if exists)

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/job_import_system
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
MAX_CONCURRENCY=5
BATCH_SIZE=100
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📝 License

ISC
