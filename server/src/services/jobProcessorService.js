const Job = require('../models/Job');
const ImportLog = require('../models/ImportLog');

class JobProcessorService {
  async processJob(jobData, source) {
    try {
      if (!jobData.externalId) throw new Error('Missing externalId');
      if (!jobData.title) throw new Error('Missing title');

      const doc = {
        externalId: jobData.externalId,
        source,
        title: jobData.title,
        description: jobData.description || '',
        company: jobData.company || '',
        location: jobData.location || '',
        category: jobData.category || '',
        jobType: jobData.jobType || '',
        salary: jobData.salary || '',
        url: jobData.url || '',
        publishedDate: jobData.publishedDate || new Date(),
        rawData: jobData.rawData || jobData,
      };

      const result = await Job.findOneAndUpdate(
        { externalId: jobData.externalId, source },
        { $set: doc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const isNew = result.createdAt && result.createdAt.getTime() === result.updatedAt.getTime();

      return { success: true, isNew, jobId: result._id.toString() };
    } catch (err) {
      return { success: false, error: err.message, jobId: jobData.externalId || '' };
    }
  }

  async processBatch(jobs, source) {
    const summary = { new: 0, updated: 0, failed: 0, failedReasons: [] };
    for (const job of jobs) {
      const res = await this.processJob(job, source);
      if (res.success) {
        if (res.isNew) summary.new++;
        else summary.updated++;
      } else {
        summary.failed++;
        summary.failedReasons.push({
          jobId: res.jobId || 'unknown',
          reason: res.error || 'Unknown',
          error: res.error || 'Unknown',
        });
      }
    }
    return summary;
  }

  async updateImportLog(logId, summary) {
    try {
      await ImportLog.findByIdAndUpdate(logId, {
        totalImported: summary.new + summary.updated,
        newJobs: summary.new,
        updatedJobs: summary.updated,
        failedJobs: summary.failed,
        failedReasons: summary.failedReasons,
        status: 'completed',
      });
    } catch (err) {
      console.error('Failed updating import log', err);
    }
  }
}

module.exports = new JobProcessorService();


