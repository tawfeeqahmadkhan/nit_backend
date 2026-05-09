const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  business_a: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  business_b: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  match_type: { type: String, enum: ['internal', 'external'], default: 'internal' },
  score: { type: Number, min: 0, max: 1, required: true },
  reason: { type: String, default: '' },
  // Which business has which role
  problem_side: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },  // has the problem
  solution_side: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' }, // has the solution
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

// Prevent duplicate pairs
matchSchema.index({ business_a: 1, business_b: 1 }, { unique: true });

module.exports = mongoose.model('Match', matchSchema);
