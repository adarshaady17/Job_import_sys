const { Worker } = require('bullmq');
const redisClient = require('../config/redis');
const connectDB = require('../config/database');
const jobProcessorService = require('../services/jobProcessorService');
const ImportLog = require('../models/ImportLog');
require('dotenv').config();

connectDB();

const concurrency = Number(process.env.MAX_CONCURRENCY) || 5;

const worker = new Worker(
  'job-import-queue',
  async (job) => {
    const { jobs, source, logId } = job.data;
    const summary = await jobProcessorService.processBatch(jobs, source);
    if (logId) {
      await jobProcessorService.updateImportLog(logId, summary);
    }
    return summary;
  },
  { connection: redisClient, concurrency }
);

worker.on('completed', (job) => {
  console.log(`Worker completed job ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`Worker failed job ${job?.id}`, err);
  if (job?.data?.logId) {
    ImportLog.findByIdAndUpdate(job.data.logId, {
      status: 'failed',
    }).catch(() => {});
  }
});

console.log('Job processor worker started with concurrency', concurrency);

process.on('SIGINT', async () => {
  await worker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});


