import { promises as fs } from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

// Path to the JSON file used for local persistence
const dataFilePath = path.join(process.cwd(), 'data', 'matches.json');

// Helper to read matches from the JSON file
async function readMatchesFromFile() {
  try {
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    // If the file does not exist or is invalid, start with an empty array
    return [];
  }
}

// Helper to write matches to the JSON file
async function writeMatchesToFile(matches) {
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
  await fs.writeFile(dataFilePath, JSON.stringify(matches, null, 2), 'utf-8');
}

// In-memory fallback storage for development when KV credentials are missing
let inMemoryMatches = [];

/**
 * API route for storing and retrieving match data.
 * Uses Vercel KV when credentials are present; otherwise falls back to a JSON file
 * stored in the repository (data/matches.json). This ensures persistence across
 * requests in a development environment where KV is not configured.
 */
export default async function handler(req, res) {
  const hasKvCredentials =
    process.env.VERCEL_KV_REST_API_URL && process.env.VERCEL_KV_REST_API_TOKEN;

  // Helper to get the current matches array based on the storage method
  const getCurrentMatches = async () => {
    if (hasKvCredentials) {
      try {
        const stored = await kv.get('matches');
        if (!stored) return [];
        if (typeof stored === 'string') {
          try {
            return JSON.parse(stored);
          } catch (e) {
            console.error('Error parsing KV matches JSON:', e);
            return [];
          }
        }
        return stored;
      } catch (error) {
        console.error('Error reading matches from KV:', error);
        return [];
      }
  } else {
    // Use file storage when KV is not configured
    return await readMatchesFromFile();
  }
  };

  // Helper to persist matches based on the storage method
  const persistMatches = async (matches) => {
    if (hasKvCredentials) {
      try {
        await kv.set('matches', JSON.stringify(matches));
      } catch (error) {
        console.error('Error writing matches to KV:', error);
      }
  } else {
    await writeMatchesToFile(matches);
  }
  };

  if (req.method === 'GET') {
    const matches = await getCurrentMatches();
    // Indicate which storage mode is being used
    res.setHeader('X-Storage-Mode', hasKvCredentials ? 'kv' : 'fallback');
    res.status(200).json(matches);
  } else if (req.method === 'POST') {
    const newMatch = req.body;
    const matches = await getCurrentMatches();
    matches.push(newMatch);
    await persistMatches(matches);
    res.setHeader('X-Storage-Mode', hasKvCredentials ? 'kv' : 'fallback');
    res.status(200).json(matches);
  } else if (req.method === 'DELETE') {
    const date = req.query?.date || req.body?.date;
    if (!date) {
      res.setHeader('X-Storage-Mode', hasKvCredentials ? 'kv' : 'fallback');
      res.status(400).json({ error: 'Missing date identifier for deletion' });
      return;
    }
    const matches = await getCurrentMatches();
    const filtered = matches.filter((m) => m.date !== date);
    await persistMatches(filtered);
    res.setHeader('X-Storage-Mode', hasKvCredentials ? 'kv' : 'fallback');
    res.status(200).json(filtered);
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
