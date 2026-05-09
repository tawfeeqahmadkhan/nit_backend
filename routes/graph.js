const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Match = require('../models/Match');

const CATEGORY_COLORS = {
  'Manufacturing': '#3B82F6',
  'Logistics': '#F97316',
  'Agriculture': '#22C55E',
  'Technology': '#8B5CF6',
  'Retail': '#EC4899',
  'Food': '#EAB308',
  'Healthcare': '#14B8A6',
  'Finance': '#64748B',
  'default': '#94A3B8'
};

function getCategoryColor(category = '') {
  const key = Object.keys(CATEGORY_COLORS).find(k =>
    category.toLowerCase().includes(k.toLowerCase())
  );
  return CATEGORY_COLORS[key || 'default'];
}

// GET /api/graph — nodes and edges for 3D visualization
router.get('/', async (req, res) => {
  try {
    const businesses = await Business.find()
      .select('name address ai_tags location services')
      .lean();

    const matches = await Match.find({ status: { $ne: 'rejected' } })
      .select('business_a business_b score match_type status reason')
      .lean();

    const nodes = businesses.map(b => ({
      id: b._id.toString(),
      name: b.name,
      address: b.address,
      category: b.ai_tags?.category || 'Unknown',
      color: getCategoryColor(b.ai_tags?.category),
      services: b.ai_tags?.solution_keywords || [],
      coordinates: b.location?.coordinates || [0, 0]
    }));

    const edges = matches.map(m => ({
      id: m._id.toString(),
      source: m.business_a.toString(),
      target: m.business_b.toString(),
      score: m.score,
      type: m.match_type,
      status: m.status,
      reason: m.reason
    }));

    res.json({ nodes, edges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
