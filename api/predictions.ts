import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';


export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle GET requests to fetch all data
  if (req.method === 'GET') {
    const predictions = await kv.lrange('predictions', 0, -1);
    return res.status(200).json(predictions);
  }

  // Handle DELETE requests to clear all data
  if (req.method === 'DELETE') {
    await kv.del('predictions');
    return res.status(200).json({ message: 'All predictions cleared' });
  }

  // If any other method is used, return an error
  return res.status(405).json({ message: 'Method Not Allowed' });
}