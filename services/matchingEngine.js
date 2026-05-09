const Business = require('../models/Business');
const Match = require('../models/Match');
const { scoreMatch } = require('./groqService');
const { geoBoost } = require('./geocoder');
const { searchExternalBusinesses } = require('./externalSearch');

const MATCH_THRESHOLD = 0.60;

// force=true bypasses the "already has matches" guard (used by /rematch endpoint)
async function findAndSaveMatches(newBusiness, io, force = false) {
  const { _id, ai_tags, location } = newBusiness;
  const problemKeywords  = ai_tags?.problem_keywords  || [];
  const solutionKeywords = ai_tags?.solution_keywords || [];

  if (problemKeywords.length === 0 && solutionKeywords.length === 0) return [];

  // Skip if business already has matches and this isn't a forced re-run
  if (!force && newBusiness.matched_businesses?.length > 0) return [];

  // Find candidates whose solution_keywords overlap with our problem_keywords
  let candidates = await Business.find({
    _id: { $ne: _id },
    'ai_tags.solution_keywords': { $in: problemKeywords },
  }).limit(20);

  // Reverse: find businesses whose problems we can solve
  const reverseCandidates = await Business.find({
    _id: { $ne: _id, $nin: candidates.map(c => c._id) },
    'ai_tags.problem_keywords': { $in: solutionKeywords },
  }).limit(10);

  candidates = [...candidates, ...reverseCandidates];

  const internalMatches = [];

  for (const candidate of candidates) {
    // Skip pair if a match already exists
    const existing = await Match.findOne({
      $or: [
        { business_a: _id, business_b: candidate._id },
        { business_a: candidate._id, business_b: _id },
      ],
    });
    if (existing) continue;

    // Determine problem/solution sides
    let problemDesc, solutionDesc, problemSide, solutionSide;
    const overlap = problemKeywords.filter(k =>
      candidate.ai_tags.solution_keywords.includes(k)
    ).length;

    if (overlap > 0) {
      problemDesc  = newBusiness.challenges.join('. ');
      solutionDesc = candidate.services.join(', ');
      problemSide  = _id;
      solutionSide = candidate._id;
    } else {
      problemDesc  = candidate.challenges.join('. ');
      solutionDesc = newBusiness.services.join(', ');
      problemSide  = candidate._id;
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
      const [aId, bId] = [_id, candidate._id].sort((a, b) =>
        a.toString().localeCompare(b.toString())
      );
      const match = await Match.create({
        business_a:    aId,
        business_b:    bId,
        match_type:    'internal',
        score:         Math.round(finalScore * 100) / 100,
        reason:        scored.reason,
        problem_side:  problemSide,
        solution_side: solutionSide,
      });

      await Business.updateOne({ _id },               { $addToSet: { matched_businesses: candidate._id } });
      await Business.updateOne({ _id: candidate._id },{ $addToSet: { matched_businesses: _id } });

      internalMatches.push(match);

      // Emit only to the two businesses involved, not a global broadcast
      if (io) {
        const payload = {
          match_id:   match._id,
          business_a: _id,
          business_b: candidate._id,
          score:      finalScore,
          reason:     scored.reason,
        };
        io.to(`biz_${_id}`).emit('new_match', payload);
        io.to(`biz_${candidate._id}`).emit('new_match', payload);
      }
    }
  }

  // External fallback — only if no internal matches found
  if (internalMatches.length === 0 && problemKeywords.length > 0) {
    try {
      const externalResults = await searchExternalBusinesses(problemKeywords);
      if (externalResults.length > 0) {
        await Business.updateOne({ _id }, { $set: { external_matches: externalResults } });
      }
    } catch (err) {
      console.error('External search failed:', err.message);
    }
  }

  return internalMatches;
}

module.exports = { findAndSaveMatches };
