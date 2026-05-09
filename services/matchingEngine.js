const Business = require('../models/Business');
const Match = require('../models/Match');
const { scoreMatch } = require('./groqService');
const { geoBoost } = require('./geocoder');
const { searchExternalBusinesses } = require('./externalSearch');

const MATCH_THRESHOLD = 0.60;

async function findAndSaveMatches(newBusiness, io) {
  const { _id, ai_tags, location } = newBusiness;
  const problemKeywords = ai_tags.problem_keywords || [];

  if (problemKeywords.length === 0) return;

  // Find candidates whose solution_keywords overlap with our problem_keywords
  let candidates = await Business.find({
    _id: { $ne: _id },
    'ai_tags.solution_keywords': { $in: problemKeywords }
  }).limit(20);

  // Also do reverse: find businesses whose problem_keywords we can solve
  const reverseCandiates = await Business.find({
    _id: { $ne: _id },
    'ai_tags.problem_keywords': { $in: ai_tags.solution_keywords || [] },
    _id: { $nin: candidates.map(c => c._id) }
  }).limit(10);

  candidates = [...candidates, ...reverseCandiates];

  const internalMatches = [];

  for (const candidate of candidates) {
    // Skip if a match record already exists between these two
    const existing = await Match.findOne({
      $or: [
        { business_a: _id, business_b: candidate._id },
        { business_a: candidate._id, business_b: _id }
      ]
    });
    if (existing) continue;

    // Determine which side has the problem and which has the solution
    let problemDesc, solutionDesc, problemSide, solutionSide;

    const newBizProblemOverlap = problemKeywords.filter(k =>
      candidate.ai_tags.solution_keywords.includes(k)
    ).length;

    if (newBizProblemOverlap > 0) {
      problemDesc = newBusiness.challenges.join('. ');
      solutionDesc = candidate.services.join(', ');
      problemSide = _id;
      solutionSide = candidate._id;
    } else {
      problemDesc = candidate.challenges.join('. ');
      solutionDesc = newBusiness.services.join(', ');
      problemSide = candidate._id;
      solutionSide = _id;
    }

    let scored;
    try {
      scored = await scoreMatch(problemDesc, solutionDesc);
    } catch {
      continue;
    }

    const boost = geoBoost(
      location?.coordinates || [0, 0],
      candidate.location?.coordinates || [0, 0]
    );
    const finalScore = Math.min(1, scored.score + boost);

    if (finalScore >= MATCH_THRESHOLD) {
      const [aId, bId] = [_id, candidate._id].sort((a, b) => a.toString().localeCompare(b.toString()));
      const match = await Match.create({
        business_a: aId,
        business_b: bId,
        match_type: 'internal',
        score: Math.round(finalScore * 100) / 100,
        reason: scored.reason,
        problem_side: problemSide,
        solution_side: solutionSide
      });

      // Update both businesses' matched_businesses arrays
      await Business.updateOne({ _id }, { $addToSet: { matched_businesses: candidate._id } });
      await Business.updateOne({ _id: candidate._id }, { $addToSet: { matched_businesses: _id } });

      internalMatches.push(match);

      // Emit real-time event to both businesses
      if (io) {
        io.emit('new_match', {
          match_id: match._id,
          business_a: _id,
          business_b: candidate._id,
          score: finalScore,
          reason: scored.reason
        });
      }
    }
  }

  // External fallback — only if no internal matches found
  if (internalMatches.length === 0 && problemKeywords.length > 0) {
    const externalResults = await searchExternalBusinesses(problemKeywords);
    if (externalResults.length > 0) {
      await Business.updateOne(
        { _id },
        { $set: { external_matches: externalResults } }
      );
    }
  }

  return internalMatches;
}

module.exports = { findAndSaveMatches };
