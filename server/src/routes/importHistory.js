const express = require('express');
const ImportLog = require('../models/ImportLog');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.source) {
      filter.source = { $regex: req.query.source, $options: 'i' };
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const total = await ImportLog.countDocuments(filter);
    const logs = await ImportLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching history', error: err.message });
  }
});

router.get('/stats/summary', async (req, res) => {
  try {
    const agg = await ImportLog.aggregate([
      {
        $group: {
          _id: null,
          totalImports: { $sum: 1 },
          totalFetched: { $sum: '$totalFetched' },
          totalImported: { $sum: '$totalImported' },
          totalNew: { $sum: '$newJobs' },
          totalUpdated: { $sum: '$updatedJobs' },
          totalFailed: { $sum: '$failedJobs' },
        },
      },
    ]);
    const stats =
      agg[0] || { totalImports: 0, totalFetched: 0, totalImported: 0, totalNew: 0, totalUpdated: 0, totalFailed: 0 };
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching stats', error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const log = await ImportLog.findById(req.params.id).lean();
    if (!log) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching log', error: err.message });
  }
});

module.exports = router;


