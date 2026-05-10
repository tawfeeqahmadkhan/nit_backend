const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Match = require('../models/Match');
const { tagBusiness } = require('../services/groqService');
const { geocodeAddress } = require('../services/geocoder');
const { findAndSaveMatches } = require('../services/matchingEngine');

// POST /api/businesses — register a new business
router.post('/', async (req, res) => {
  try {
    const { name, owner_email, address, services, challenges } = req.body;

    if (!name || !owner_email || !address || !services?.length || !challenges?.length) {
      return res.status(400).json({ error: 'name, owner_email, address, services, and challenges are required.' });
    }

    // Step 1: Geocode address
    const { coordinates } = await geocodeAddress(address);

    // Step 2: AI tagging via Groq
    let ai_tags = { category: '', solution_keywords: [], problem_keywords: [] };
    try {
      ai_tags = await tagBusiness({ name, services, challenges });
    } catch (err) {
      console.error('Groq tagging failed, saving without tags:', err.message);
    }

    // Step 3: Save to DB
    const business = await Business.create({
      name,
      owner_email,
      address,
      location: { type: 'Point', coordinates },
      services,
      challenges,
      ai_tags
    });

    // Step 4: Run matching in background (non-blocking response)
    const io = req.app.get('io');
    findAndSaveMatches(business, io).catch(err =>
      console.error('Matching error for', business._id, err.message)
    );

    res.status(201).json({
      message: 'Business registered. AI is finding matches...',
      business
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/businesses — list all businesses
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 50 } = req.query;
    const filter = {};
    if (category) filter['ai_tags.category'] = new RegExp(category, 'i');
    if (search) filter.$or = [
      { name: new RegExp(search, 'i') },
      { 'ai_tags.solution_keywords': new RegExp(search, 'i') }
    ];

    const businesses = await Business.find(filter)
      .select('-__v')
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json(businesses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/businesses/:id — single business with populated matches
router.get('/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate('matched_businesses', 'name address ai_tags services');

    if (!business) return res.status(404).json({ error: 'Business not found.' });

    res.json(business);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/businesses/:id/matches — full match details for a business
router.get('/:id/matches', async (req, res) => {
  try {
    const id = req.params.id;
    const matches = await Match.find({
      $or: [{ business_a: id }, { business_b: id }]
    })
      .populate('business_a', 'name address ai_tags services challenges')
      .populate('business_b', 'name address ai_tags services challenges')
      .sort({ score: -1 });

    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/businesses/:id/rematch — manually trigger re-matching
router.post('/:id/rematch', async (req, res) => {
  try {
    let business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ error: 'Business not found.' });

    // Re-run AI tagging if it previously failed
    const hasNoTags =
      !business.ai_tags?.problem_keywords?.length &&
      !business.ai_tags?.solution_keywords?.length;

    if (hasNoTags) {
      try {
        const ai_tags = await tagBusiness({
          name: business.name,
          services: business.services,
          challenges: business.challenges,
        });
        await Business.updateOne({ _id: business._id }, { $set: { ai_tags } });
        business = await Business.findById(business._id);
        console.log(`[rematch] Re-tagged ${business._id}`);
      } catch (err) {
        console.error('[rematch] Re-tagging failed:', err.message);
      }
    }

    const io = req.app.get('io');
    findAndSaveMatches(business, io, true).catch(console.error);

    res.json({ message: 'Re-matching started.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
