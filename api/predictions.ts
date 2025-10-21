import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    console.log(`[${new Date().toISOString()}] Attempting to fetch predictions from KV...`);

    // Fetch all predictions. If KV is connected, this should return a list.
    const rawPredictions = await kv.lrange('predictions', 0, -1);

    // This log confirms success and will appear in Vercel logs if successful
    console.log(`[${new Date().toISOString()}] Successfully fetched ${rawPredictions.length} raw items.`);

    // The rawPredictions array might contain stringified JSON, so we parse everything
    const parsedPredictions = rawPredictions.map(item => {
      // KV returns objects directly if saved as objects in the latest version
      return item;
    });

    return res.status(200).json(parsedPredictions);

  } catch (error) {
    // This block catches the database connection error (the "Missing KV_REST..." error)
    // By logging the error here, we can see it in the Vercel logs.
    console.error(`[${new Date().toISOString()}] CRITICAL: Failed to connect to KV database:`, error);

    // CRASH PREVENTED: Instead of crashing the entire function, 
    // we return a 500 error but ensure the function completes.
    return res.status(500).json({ 
      success: false, 
      error: "Failed to fetch predictions from server storage." 
    });
  }
}