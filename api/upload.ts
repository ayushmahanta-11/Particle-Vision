import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { api: { bodyParser: false } }; // Keep this

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const fileName = req.headers['x-vercel-filename'] as string || 'uploaded_image';

  try {
    // Directly upload the request body (image stream) to Vercel Blob
    const blob = await put(fileName, req, {
      access: 'public',
      addRandomSuffix: true
    });

    // Return the URL and path of the uploaded blob
    // The browser will use this info when saving the prediction later
    return res.status(200).json({
       imageUrl: blob.url,
       blobPath: blob.pathname,
       fileSize: Number(req.headers['content-length'])
    });

  } catch (error) {
    console.error('Error uploading image to Blob:', error);
    return res.status(500).json({ message: 'Failed to upload image.' });
  }
}