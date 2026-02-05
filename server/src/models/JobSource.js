const mongoose = require('mongoose');

const jobSourceSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, unique: true },
    name: { type: String },
    isActive: { type: Boolean, default: true },
    lastFetched: { type: Date },
    fetchInterval: { type: Number, default: 3600000 }, // 1 hour ms
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobSource', jobSourceSchema);


