const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const routes = require('./routes');
const schedulerService = require('./services/schedulerService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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
    await connectDB();
    await schedulerService.initializeDefaultSources();
    schedulerService.start();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
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


