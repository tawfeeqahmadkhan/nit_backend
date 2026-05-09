const axios = require('axios');
const { parseExternalResults } = require('./groqService');

async function searchExternalBusinesses(problemKeywords) {
  if (!process.env.SERPAPI_KEY) {
    console.warn('SERPAPI_KEY not set — skipping external search');
    return [];
  }

  const query = `${problemKeywords.slice(0, 4).join(' ')} business solution provider`;

  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        api_key: process.env.SERPAPI_KEY,
        engine: 'google',
        q: query,
        num: 5,
      },
      timeout: 10000,
    });

    const items = response.data.organic_results || [];
    const snippets = items.map(item => ({
      title: item.title,
      snippet: item.snippet,
      url: item.link,
    }));

    if (snippets.length === 0) return [];

    // Groq parses the raw results into structured business objects
    const parsed = await parseExternalResults(snippets, problemKeywords);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('SerpAPI search error:', err.message);
    return [];
  }
}

module.exports = { searchExternalBusinesses };
