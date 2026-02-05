const express = require('express');
const importHistoryRoutes = require('./importHistory');
const jobSourcesRoutes = require('./jobSources');
const jobsRoutes = require('./jobs');
const schedulerService = require('../services/schedulerService');

const router = express.Router();

// Root API endpoint - show available routes
router.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Job Import System API',
    version: '1.0.0',
    endpoints: {
      'GET /api/import-history': 'Get import history with pagination',
      'GET /api/import-history/stats/summary': 'Get import statistics',
      'GET /api/import-history/:id': 'Get single import log',
      'GET /api/job-sources': 'Get all job sources',
      'POST /api/job-sources': 'Create a new job source',
      'PUT /api/job-sources/:id': 'Update a job source',
      'DELETE /api/job-sources/:id': 'Delete a job source',
      'GET /api/jobs': 'Get jobs with pagination',
      'GET /api/jobs/stats': 'Get job statistics',
      'POST /api/trigger-fetch': 'Manually trigger job fetch',
    },
  });
});

router.use('/import-history', importHistoryRoutes);
router.use('/job-sources', jobSourcesRoutes);
router.use('/jobs', jobsRoutes);

router.post('/trigger-fetch', async (_req, res) => {
  try {
    await schedulerService.triggerManualFetch();
    res.json({ success: true, message: 'Fetch triggered' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error triggering fetch', error: err.message });
  }
});

module.exports = router;


