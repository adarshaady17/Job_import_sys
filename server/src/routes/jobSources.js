const express = require('express');
const JobSource = require('../models/JobSource');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const sources = await JobSource.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: sources });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching sources', error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { url, name, isActive } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL is required' });
    const source = await JobSource.create({
      url,
      name: name || url,
      isActive: isActive !== undefined ? isActive : true,
    });
    res.status(201).json({ success: true, data: source });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Source already exists' });
    }
    res.status(500).json({ success: false, message: 'Error creating source', error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const source = await JobSource.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(isActive !== undefined && { isActive }) },
      { new: true }
    );
    if (!source) return res.status(404).json({ success: false, message: 'Source not found' });
    res.json({ success: true, data: source });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating source', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const source = await JobSource.findByIdAndDelete(req.params.id);
    if (!source) return res.status(404).json({ success: false, message: 'Source not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting source', error: err.message });
  }
});

module.exports = router;


