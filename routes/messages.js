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
    if (match.status === 'rejected') return res.status(403).json({ error: 'Cannot message on a rejected match.' });

    const message = await Message.create({ match_id, sender, content: content.trim() });

    const io = req.app.get('io');
    if (io) {
      io.to(`match_${match_id}`).emit('new_message', {
        match_id,
        message: await message.populate('sender', 'name')
      });
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/:matchId — get all messages for a match thread
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
