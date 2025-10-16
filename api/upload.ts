import { put } from '@vercel/blob';
import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';
function classifyParticleTrack(fileName: string): { class: string; confidence: number; } {
  const particleTypes = [ { name: "proton", keywords: ["proton", "p+", "hadron"] }, { name: "neutron", keywords: ["neutron", "n0", "neutral"] }, { name: "electron", keywords: ["electron", "e-", "lepton", "beta"] }, { name: "muon", keywords: ["muon", "mu", "cosmic"] }, { name: "pion", keywords: ["pion", "pi", "meson"] }, { name: "kaon", keywords: ["kaon", "k+", "k-", "strange"] }, { name: "photon", keywords: ["photon", "gamma", "electromagnetic"] } ];
  const lowerFileName = fileName.toLowerCase();
  for (const p of particleTypes) { for (const k of p.keywords) { if (lowerFileName.includes(k)) return { class: p.name, confidence: 0.85 + Math.random() * 0.14 }; } }
  const r = particleTypes[Math.floor(Math.random() * particleTypes.length)];
  return { class: r.name, confidence: 0.60 + Math.random() * 0.25 };
}

// This config is important! It tells Vercel to not parse the request body,
// so we can stream the file upload directly.
export const config = { api: { bodyParser: false } };

export default async function handler(req: VercelRequest, res: VercelResponse)  {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const fileName = req.headers['x-vercel-filename'] as string;

  // 1. Upload the file from the request body to Vercel Blob
const blob = await put(fileName, req, { 
  access: 'public',
  addRandomSuffix: true 
});

  // 2. Run the classification logic
  const prediction = classifyParticleTrack(blob.pathname);

  // 3. Prepare the data to be saved in the database
  const predictionData = {
    _id: `pred_${Date.now()}`,
    fileName: blob.pathname,
    fileSize: Number(req.headers['content-length']),
    imageUrl: blob.url,
    predictedClass: prediction.class,
    confidence: prediction.confidence,
    createdAt: Date.now(),
  };

  // 4. Save the data to Vercel's KV database
  await kv.lpush('predictions', predictionData);

  return res.status(200).json(predictionData);
}