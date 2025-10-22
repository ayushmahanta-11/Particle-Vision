import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Helper to read the raw request body stream
function readBody(req: VercelRequest) {
  return new Promise<string>((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => { resolve(body); });
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Manually read and parse the JSON body
    const rawBody = await readBody(req);
    const { blobPath, imageUrl, fileSize, predictedClass, confidence } = JSON.parse(rawBody);

    if (!blobPath || !imageUrl || !predictedClass || confidence === undefined) {
       console.error("Missing prediction data in body:", { blobPath, imageUrl, predictedClass, confidence });
       return res.status(400).json({ message: 'Missing required prediction data.' });
    }

    const predictionData = {
      _id: `pred_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      fileName: blobPath.split('/').pop() || blobPath, // Extract filename
      fileSize: fileSize,
      imageUrl: imageUrl,
      predictedClass: predictedClass,
      confidence: confidence,
      createdAt: Date.now(),
    };

    // Save prediction data to Vercel KV
    await kv.lpush('predictions', predictionData);
    console.log(`[${new Date().toISOString()}] Prediction saved successfully for ${predictionData.fileName}`);

    return res.status(200).json({ message: 'Prediction saved successfully.' });

  } catch (error) {
    console.error('CRITICAL ERROR saving prediction:', error);
    return res.status(500).json({ message: 'Failed to save prediction due to server error.' });
  }
}