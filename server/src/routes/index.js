const express = require('express');
const importHistoryRoutes = require('./importHistory');
const jobSourcesRoutes = require('./jobSources');
const jobsRoutes = require('./jobs');
const schedulerService = require('../services/schedulerService');

const router = express.Router();

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


