const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const routes = require('./routes');
const schedulerService = require('./services/schedulerService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - allow all origins
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const start = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB connected successfully');

    console.log('Initializing default job sources...');
    await schedulerService.initializeDefaultSources();
    console.log('Default job sources initialized');

    console.log('Starting scheduler...');
    schedulerService.start();
    console.log('Scheduler started');

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log(`✅ API root: http://localhost:${PORT}/api`);
      console.log(`✅ Import history: http://localhost:${PORT}/api/import-history`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

start();

process.on('SIGINT', () => {
  console.log('SIGINT received, exiting');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, exiting');
  process.exit(0);
});


