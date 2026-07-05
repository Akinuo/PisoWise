// api/groq.js
//
// Server-side proxy for the Groq API. Deploy this app to Vercel (free tier)
// and set a *server-only* GROQ_API_KEY environment variable (no VITE_
// prefix — that's what keeps it out of the client bundle).
//
// Why this exists: Firebase Spark plan has no Cloud Functions, so there's
// nowhere on the Firebase side to hide the Groq key. Vercel's free serverless
// functions fill that gap without requiring a paid Firebase plan.
//
// The client (src/services/groq.js) calls this endpoint instead of Groq
// directly whenever VITE_GROQ_PROXY_URL is set. If it's not set, the client
// falls back to calling Groq directly with VITE_GROQ_API_KEY — so nothing
// breaks if you don't deploy this; it's an optional hardening step.

export default async function handler(req, res) {
  // CORS — restrict to your own deployed origin in production if you want
  // to lock this down further. Left open here so it also works from
  // localhost during development.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' });

  const { messages, max_tokens } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' });
  }

  // Basic sanity cap so a bug or abuse can't run up a huge bill in one call.
  const safeMaxTokens = Math.min(Number(max_tokens) || 1024, 2000);

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: safeMaxTokens,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    const data = await groqRes.json();
    if (!groqRes.ok) {
      return res.status(groqRes.status).json({ error: data.error?.message || 'Groq API error' });
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error('Groq proxy error:', err);
    return res.status(502).json({ error: 'Failed to reach Groq API.' });
  }
}
