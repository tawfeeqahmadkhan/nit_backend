const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Business = require('../models/Business');
const { tagBusiness } = require('../services/groqService');
const { geocodeAddress } = require('../services/geocoder');
const { findAndSaveMatches } = require('../services/matchingEngine');

const JWT_SECRET = process.env.JWT_SECRET || 'solvenet_dev_secret';

function signToken(business) {
  return jwt.sign(
    { businessId: business._id, email: business.owner_email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function sanitize(bizDoc) {
  const obj = bizDoc.toObject ? bizDoc.toObject() : { ...bizDoc };
  delete obj.password_hash;
  return obj;
}

// POST /api/auth/register — create business + account
router.post('/register', async (req, res) => {
  try {
    const { name, owner_email, password, address, services, challenges } = req.body;

    if (!name || !owner_email || !password || !address || !services?.length || !challenges?.length) {
      return res.status(400).json({ error: 'All fields including password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await Business.findOne({ owner_email: owner_email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'A business with this email already exists. Please log in.' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { coordinates } = await geocodeAddress(address);

    let ai_tags = { category: '', solution_keywords: [], problem_keywords: [] };
    try {
      ai_tags = await tagBusiness({ name, services, challenges });
    } catch (err) {
      console.error('Groq tagging failed:', err.message);
    }

    const business = await Business.create({
      name,
      owner_email: owner_email.toLowerCase(),
      password_hash,
      address,
      location: { type: 'Point', coordinates },
      services,
      challenges,
      ai_tags,
    });

    const io = req.app.get('io');
    findAndSaveMatches(business, io).catch(err =>
      console.error('Matching error:', err.message)
    );

    res.status(201).json({
      message: 'Account created. AI is finding matches...',
      token: signToken(business),
      business: sanitize(business),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login — email + password → token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const business = await Business.findOne({ owner_email: email.toLowerCase() }).select('+password_hash');

    if (!business) {
      return res.status(401).json({ error: 'No account found with this email.' });
    }
    if (!business.password_hash) {
      return res.status(401).json({ error: 'This account has no password. Please re-register.' });
    }

    const valid = await bcrypt.compare(password, business.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    res.json({
      token: signToken(business),
      business: sanitize(business),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
