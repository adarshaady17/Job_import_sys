const mongoose = require('mongoose');

const importLogSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true, index: true }, // URL of feed
    source: { type: String, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    totalFetched: { type: Number, default: 0 },
    totalImported: { type: Number, default: 0 },
    newJobs: { type: Number, default: 0 },
    updatedJobs: { type: Number, default: 0 },
    failedJobs: { type: Number, default: 0 },
    failedReasons: [
      {
        jobId: String,
        reason: String,
        error: String,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    processingTime: { type: Number }, // ms
  },
  { timestamps: true }
);

module.exports = mongoose.model('ImportLog', importLogSchema);


