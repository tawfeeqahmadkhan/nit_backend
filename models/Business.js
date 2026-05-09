const mongoose = require('mongoose');

const externalMatchSchema = new mongoose.Schema({
  name: String,
  summary: String,
  url: String,
  source: { type: String, default: 'google_search' }
}, { _id: false });

const aiTagsSchema = new mongoose.Schema({
  category: { type: String, default: '' },
  solution_keywords: [String],
  problem_keywords: [String]
}, { _id: false });

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  owner_email: { type: String, required: true, lowercase: true, trim: true },
  address: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }  // [lng, lat]
  },
  services: { type: [String], required: true },
  challenges: { type: [String], required: true },
  ai_tags: { type: aiTagsSchema, default: () => ({}) },
  matched_businesses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Business' }],
  external_matches: [externalMatchSchema]
}, { timestamps: true });

businessSchema.index({ location: '2dsphere' });
businessSchema.index({ 'ai_tags.solution_keywords': 'text', 'ai_tags.problem_keywords': 'text', name: 'text' });

module.exports = mongoose.model('Business', businessSchema);
