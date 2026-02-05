const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, index: true },
    source: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    company: { type: String },
    location: { type: String },
    category: { type: String },
    jobType: { type: String },
    salary: { type: String },
    url: { type: String },
    publishedDate: { type: Date },
    rawData: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

jobSchema.index({ externalId: 1, source: 1 }, { unique: true });

module.exports = mongoose.model('Job', jobSchema);


