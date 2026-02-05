const express = require('express');
const Job = require('../models/Job');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.source) filter.source = req.query.source;
    if (req.query.category) filter.category = { $regex: req.query.category, $options: 'i' };
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { company: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const total = await Job.countDocuments(filter);
    const jobs = await Job.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean();

    res.json({
      success: true,
      data: jobs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching jobs', error: err.message });
  }
});

router.get('/stats', async (_req, res) => {
  try {
    const agg = await Job.aggregate([
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          sources: { $addToSet: '$source' },
          categories: { $addToSet: '$category' },
        },
      },
    ]);
    const s = agg[0] || { totalJobs: 0, sources: [], categories: [] };
    res.json({
      success: true,
      data: {
        totalJobs: s.totalJobs,
        uniqueSources: s.sources.length,
        categories: s.categories.filter(Boolean).length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching stats', error: err.message });
  }
});

module.exports = router;


