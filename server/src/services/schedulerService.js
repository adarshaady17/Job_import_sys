const cron = require('node-cron');
const JobSource = require('../models/JobSource');
const jobApiService = require('./jobApiService');
const jobQueue = require('../queues/jobQueue');
const ImportLog = require('../models/ImportLog');

class SchedulerService {
  constructor() {
    this.isRunning = false;
  }

  async initializeDefaultSources() {
    const urls = [
      'https://jobicy.com/?feed=job_feed',
      'https://jobicy.com/?feed=job_feed&job_categories=smm&job_types=full-time',
      'https://jobicy.com/?feed=job_feed&job_categories=seller&job_types=full-time&search_region=france',
      'https://jobicy.com/?feed=job_feed&job_categories=design-multimedia',
      'https://jobicy.com/?feed=job_feed&job_categories=data-science',
      'https://jobicy.com/?feed=job_feed&job_categories=copywriting',
      'https://jobicy.com/?feed=job_feed&job_categories=business',
      'https://jobicy.com/?feed=job_feed&job_categories=management',
      'https://www.higheredjobs.com/rss/articleFeed.cfm',
    ];

    for (const url of urls) {
      await JobSource.findOneAndUpdate(
        { url },
        { url, name: this.extractName(url), isActive: true },
        { upsert: true }
      );
    }
  }

  extractName(url) {
    try {
      const u = new URL(url);
      return u.hostname.replace('www.', '');
    } catch {
      return url.slice(0, 50);
    }
  }

  async processSource(source) {
    if (!source.isActive) return;

    const start = Date.now();
    let log = await ImportLog.create({
      fileName: source.url,
      source: source.name || source.url,
      timestamp: new Date(),
      status: 'processing',
    });

    try {
      const jobs = await jobApiService.fetchJobsFromApi(source.url);

      if (!jobs || !jobs.length) {
        await ImportLog.findByIdAndUpdate(log._id, {
          totalFetched: 0,
          status: 'completed',
        });
        return;
      }

      await ImportLog.findByIdAndUpdate(log._id, {
        totalFetched: jobs.length,
      });

      const batchSize = Number(process.env.BATCH_SIZE) || 100;
      for (let i = 0; i < jobs.length; i += batchSize) {
        const slice = jobs.slice(i, i + batchSize);
        await jobQueue.add('process-job-batch', {
          jobs: slice,
          source: source.url,
          logId: log._id.toString(),
        });
      }

      await JobSource.findByIdAndUpdate(source._id, {
        lastFetched: new Date(),
      });

      await ImportLog.findByIdAndUpdate(log._id, {
        processingTime: Date.now() - start,
      });
    } catch (err) {
      await ImportLog.findByIdAndUpdate(log._id, {
        status: 'failed',
        failedJobs: 0,
        failedReasons: [
          {
            jobId: 'source',
            reason: 'Source fetch failed',
            error: err.message,
          },
        ],
      });
    }
  }

  async processAllSources() {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      const sources = await JobSource.find({ isActive: true });
      const concurrency = 3;
      for (let i = 0; i < sources.length; i += concurrency) {
        const batch = sources.slice(i, i + concurrency);
        await Promise.all(batch.map((s) => this.processSource(s)));
      }
    } finally {
      this.isRunning = false;
    }
  }

  start() {
    cron.schedule('0 * * * *', () => {
      console.log('Cron: processing all sources');
      this.processAllSources();
    });
    this.processAllSources();
  }

  async triggerManualFetch() {
    await this.processAllSources();
  }
}

module.exports = new SchedulerService();


