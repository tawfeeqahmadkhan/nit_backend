const axios = require('axios');
const { parseExternalResults } = require('./groqService');

async function searchExternalBusinesses(problemKeywords) {
  if (!process.env.GOOGLE_CSE_KEY || !process.env.GOOGLE_CSE_ID) {
    return [];
  }

  const query = `${problemKeywords.slice(0, 4).join(' ')} business solution provider`;

  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: process.env.GOOGLE_CSE_KEY,
        cx: process.env.GOOGLE_CSE_ID,
        q: query,
        num: 5
      },
      timeout: 8000
    });

    const items = response.data.items || [];
    const snippets = items.map(item => ({
      title: item.title,
      snippet: item.snippet,
      url: item.link
    }));

    if (snippets.length === 0) return [];

    const parsed = await parseExternalResults(snippets, problemKeywords);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('External search error:', err.message);
    return [];
  }
}

module.exports = { searchExternalBusinesses };
