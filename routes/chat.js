const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are SolveBot, a helpful AI assistant for SolveNet — an AI-powered B2B business matchmaking platform.

About SolveNet:
- Businesses register by posting their name, location, services they offer, and challenges they face
- AI (Groq LLaMA 3) automatically tags and categorizes each business
- The platform matches businesses that can solve each other's problems
- Matches are scored by AI (semantic fit + geographic proximity)
- Business owners can accept or reject matches and chat directly with matched partners
- Each business gets a private dashboard showing their matches and connection map
- External web search kicks in if no internal match is found above the threshold

How to use SolveNet:
1. Register your business at /register — add your services and challenges
2. AI analyzes your profile and finds matching businesses automatically
3. Go to My Dashboard to see your matches
4. Accept matches to unlock direct messaging
5. Use the 3D Network graph to visualize the entire business ecosystem

You can help users with:
- How to register and use the platform
- Business strategy advice
- How to write better services/challenges descriptions for better AI matching
- Understanding their matches and what they mean
- General business questions — partnerships, supply chain, B2B collaboration
- Tips for finding the right business partners

Keep answers concise, helpful, and friendly. Use bullet points for lists. If asked something unrelated to business, gently redirect to business topics.`;

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.6,
      max_tokens: 600,
    });

    const reply = response.choices[0].message.content.trim();
    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err.message);
    res.status(500).json({ error: 'AI is temporarily unavailable. Try again shortly.' });
  }
});

module.exports = router;
