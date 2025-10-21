import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  
  if (req.method === 'GET') {
    try {
      // Fetch all predictions. 
      const rawPredictions = await kv.lrange('predictions', 0, -1);
      console.log(`[${new Date().toISOString()}] Successfully fetched ${rawPredictions.length} raw items.`);
      
      // KV returns objects directly, so we just return the list.
      return res.status(200).json(rawPredictions);

    } catch (error) {
      console.error(`[${new Date().toISOString()}] CRITICAL: Failed to connect to KV database:`, error);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to fetch predictions from server storage." 
      });
    }
  }

  // --- ADDED: DELETE Method to Clear All ---
  if (req.method === 'DELETE') {
    try {
      await kv.del('predictions'); // Command to clear the prediction list
      console.log(`[${new Date().toISOString()}] Successfully cleared all predictions.`);
      return res.status(200).json({ message: 'All results cleared' });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] CRITICAL: Failed to delete data from KV database:`, error);
      return res.status(500).json({ message: 'Failed to clear predictions from server storage.' });
    }
  }
  // --- END ADDED ---
  
  // Return 405 for any other method
  return res.status(405).json({ message: 'Method Not Allowed' });
}