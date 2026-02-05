const { Queue } = require('bullmq');
const redisClient = require('../config/redis');

const jobQueue = new Queue('job-import-queue', {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 86400 },
  },
});

module.exports = jobQueue;


