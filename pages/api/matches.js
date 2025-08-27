import { kv } from '@vercel/kv';

// In-memory fallback storage for development when KV credentials are missing
let inMemoryMatches = [];

/**
 * API route for storing and retrieving match data using Vercel KV.
 * If KV environment variables are not set, it falls back to an in‑memory array.
 * The matches are stored under the key "matches" as a JSON string when KV is available.
 */
export default async function handler(req, res) {
  const hasKvCredentials =
    process.env.VERCEL_KV_REST_API_URL && process.env.VERCEL_KV_REST_API_TOKEN;

  if (req.method === 'GET') {
    if (hasKvCredentials) {
      try {
        const stored = await kv.get('matches');
        const matches = stored ? JSON.parse(stored) : [];
        res.status(200).json(matches);
      } catch (error) {
        console.error('Error reading matches from KV:', error);
        res.status(500).json({ error: 'Failed to read matches' });
      }
    } else {
      // Fallback to in‑memory data
      res.status(200).json(inMemoryMatches);
    }
  } else if (req.method === 'POST') {
    const newMatch = req.body;

    if (hasKvCredentials) {
      try {
        const stored = await kv.get('matches');
        const matches = stored ? JSON.parse(stored) : [];
        matches.push(newMatch);
        await kv.set('matches', JSON.stringify(matches));
        res.status(200).json(matches);
      } catch (error) {
        console.error('Error saving match to KV:', error);
        res.status(500).json({ error: 'Failed to save match' });
      }
    } else {
      // Fallback to in‑memory storage
      inMemoryMatches.push(newMatch);
      res.status(200).json(inMemoryMatches);
    }
  } else if (req.method === 'DELETE') {
    const date = req.query?.date || req.body?.date;
    if (!date) {
      res.status(400).json({ error: 'Missing date identifier for deletion' });
      return;
    }
    if (hasKvCredentials) {
      try {
        const stored = await kv.get('matches');
        const matches = stored ? JSON.parse(stored) : [];
        const filtered = matches.filter((m) => m.date !== date);
        await kv.set('matches', JSON.stringify(filtered));
        res.status(200).json(filtered);
      } catch (error) {
        console.error('Error deleting match from KV:', error);
        res.status(500).json({ error: 'Failed to delete match' });
      }
    } else {
      inMemoryMatches = inMemoryMatches.filter((m) => m.date !== date);
      res.status(200).json(inMemoryMatches);
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
