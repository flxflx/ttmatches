import { kv } from '@vercel/kv';

/**
 * API route for storing and retrieving match data using Vercel KV.
 * The matches are stored under the key "matches" as a JSON string.
 */
export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const stored = await kv.get('matches');
      const matches = stored ? JSON.parse(stored) : [];
      res.status(200).json(matches);
    } catch (error) {
      console.error('Error reading matches from KV:', error);
      res.status(500).json({ error: 'Failed to read matches' });
    }
  } else if (req.method === 'POST') {
    try {
      const newMatch = req.body;
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
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
