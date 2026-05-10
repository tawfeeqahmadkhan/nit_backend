const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

// Strip markdown code fences Groq sometimes adds despite "no markdown" instruction
function extractJSON(text) {
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  return JSON.parse(stripped);
}

async function tagBusiness({ name, services, challenges }) {
  const prompt = `You are a B2B business analyst. Analyze this business and return a JSON object.

Business Name: ${name}
Services Offered: ${services.join(', ')}
Challenges / Problems: ${challenges.join('. ')}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "category": "<Industry > Sub-industry>",
  "solution_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "problem_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

solution_keywords: 5-8 keywords that describe what this business PROVIDES or OFFERS.
problem_keywords: 5-8 keywords that describe what this business NEEDS or struggles with.`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 400
  });

  const text = response.choices[0].message.content.trim();
  return extractJSON(text);
}

async function scoreMatch(problemDescription, solutionDescription) {
  const prompt = `You are a B2B matchmaking expert.

Business A has this problem:
"${problemDescription}"

Business B offers this solution:
"${solutionDescription}"

How well does Business B solve Business A's problem? Return ONLY a valid JSON object (no markdown):
{
  "score": <float between 0.0 and 1.0>,
  "reason": "<one concise sentence explaining why this is or isn't a good match>"
}`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 200
  });

  const text = response.choices[0].message.content.trim();
  return extractJSON(text);
}

async function parseExternalResults(snippets, problemKeywords) {
  const prompt = `You are extracting business information from search result snippets.

The user is looking for businesses that can solve: "${problemKeywords.join(', ')}"

Search result snippets:
${snippets.map((s, i) => `${i + 1}. Title: ${s.title}\n   Snippet: ${s.snippet}\n   URL: ${s.url}`).join('\n\n')}

From these results, extract up to 3 real businesses that are most relevant. Return ONLY a valid JSON array (no markdown):
[
  {
    "name": "<business or company name>",
    "summary": "<one sentence about what they offer that is relevant>",
    "url": "<url>"
  }
]

If none are clearly relevant businesses, return an empty array: []`;

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 600
  });

  const text = response.choices[0].message.content.trim();
  return extractJSON(text);
}

module.exports = { tagBusiness, scoreMatch, parseExternalResults };
