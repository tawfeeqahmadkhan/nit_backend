const express = require('express');
const router = express.Router();
const Match = require('../models/Match');

// GET /api/matches — all matches (optionally filtered by status)
router.get('/', async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.match_type = type;

    const matches = await Match.find(filter)
      .populate('business_a', 'name address ai_tags')
      .populate('business_b', 'name address ai_tags')
      .sort({ score: -1, createdAt: -1 });

    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/:id — single match
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('business_a', 'name address ai_tags services challenges')
      .populate('business_b', 'name address ai_tags services challenges');

    if (!match) return res.status(404).json({ error: 'Match not found.' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/matches/:id/accept
router.post('/:id/accept', async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { status: 'accepted' },
      { new: true }
    );
    if (!match) return res.status(404).json({ error: 'Match not found.' });

    const io = req.app.get('io');
    if (io) {
      const payload = { match_id: match._id, business_a: match.business_a, business_b: match.business_b };
      io.to(`biz_${match.business_a}`).emit('match_accepted', payload);
      io.to(`biz_${match.business_b}`).emit('match_accepted', payload);
    }

    res.json({ message: 'Match accepted.', match });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/matches/:id/reject
router.post('/:id/reject', async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!match) return res.status(404).json({ error: 'Match not found.' });
    res.json({ message: 'Match rejected.', match });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
