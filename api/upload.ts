import { put } from '@vercel/blob';
import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import path from 'path'; // Keep path for consistency, though not strictly needed here

// Configuration to disable Vercel's default body parsing
export const config = { api: { bodyParser: false } };

// --- Simplified API Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    // Collect the image data stream into a buffer
    const imageBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });

    const fileName = req.headers['x-vercel-filename'] as string || 'uploaded_image';

    // 1. Upload the original image buffer to Vercel Blob
    const blob = await put(fileName, imageBuffer, {
      access: 'public',
      addRandomSuffix: true
    });

    // --- Removed Classification Step ---

    // 2. Prepare basic data for KV store (without prediction)
    const predictionData = {
      _id: `pred_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      fileName: blob.pathname,
      fileSize: imageBuffer.length,
      imageUrl: blob.url,
      predictedClass: 'N/A', // Placeholder
      confidence: 0,        // Placeholder
      createdAt: Date.now(),
    };

    // 3. Save basic data to Vercel KV list
    await kv.lpush('predictions', predictionData);

    // 4. Send the successful upload info back
    return res.status(200).json(predictionData);

  } catch (error) {
    console.error('Error in simplified upload handler:', error);
    return res.status(500).json({ message: 'Failed to process image upload.' });
  }
}