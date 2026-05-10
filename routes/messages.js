const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Match = require('../models/Match');

// POST /api/messages — send a message
router.post('/', async (req, res) => {
  try {
    const { match_id, sender, content } = req.body;
    if (!match_id || !sender || !content?.trim()) {
      return res.status(400).json({ error: 'match_id, sender, and content are required.' });
    }

    const match = await Match.findById(match_id);
    if (!match) return res.status(404).json({ error: 'Match not found.' });

    // Only accepted matches can exchange messages
    if (match.status !== 'accepted') {
      return res.status(403).json({ error: 'Accept the match before messaging.' });
    }

    // Sender must be one of the two businesses
    const aId = match.business_a.toString();
    const bId = match.business_b.toString();
    if (sender !== aId && sender !== bId) {
      return res.status(403).json({ error: 'You are not part of this match.' });
    }

    const message = await Message.create({ match_id, sender, content: content.trim() });
    const populated = await message.populate('sender', 'name');

    const io = req.app.get('io');
    if (io) {
      io.to(`match_${match_id}`).emit('new_message', {
        match_id: match_id.toString(),
        message: populated,
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/:matchId — thread for a match
router.get('/:matchId', async (req, res) => {
  try {
    const messages = await Message.find({ match_id: req.params.matchId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
