import { put } from '@vercel/blob';
import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as ort from 'onnxruntime-node'; // ONNX Runtime for Node.js
import sharp from 'sharp'; // Image processing library
import path from 'path';

// --- IMPORTANT: CONFIRM THESE MATCH YOUR TRAINING ---
const CLASS_NAMES = ['airplane', 'automobile', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck'];
const IMG_HEIGHT = 32; // CIFAR-10 image height
const IMG_WIDTH = 32;  // CIFAR-10 image width
const IMG_CHANNELS = 3; // CIFAR-10 is color

// Global variable to hold the loaded ONNX session
let session: ort.InferenceSession | null = null;
const modelPath = path.join(process.cwd(), 'api', 'model.onnx'); // Assumes model.onnx is in the /api folder

// --- Function to load the ONNX session ---
async function loadSession() {
  if (!session) {
    try {
      console.log(`[${new Date().toISOString()}] Loading ONNX model session from: ${modelPath}`);
      const startTime = Date.now();
      session = await ort.InferenceSession.create(modelPath);
      const endTime = Date.now();
      console.log(`[${new Date().toISOString()}] ONNX model session loaded successfully in ${endTime - startTime}ms.`);
    } catch (e) {
      console.error(`[${new Date().toISOString()}] Failed to load ONNX session:`, e);
      session = null; // Ensure session is null if loading failed
      throw e; // Re-throw error after logging
    }
  }
  return session;
}

/**
 * Classifies an image buffer using the loaded ONNX model.
 */
async function classifyImage(imageBuffer: Buffer): Promise<{ class: string; confidence: number; }> {
  const functionStartTime = Date.now();
  try {
    console.log(`[${new Date().toISOString()}] Starting classification...`);
    const currentSession = await loadSession(); // Ensure session is loaded
    if (!currentSession) {
      throw new Error("ONNX session is not available.");
    }

    console.log(`[${new Date().toISOString()}] Preprocessing image with Sharp...`);
    const sharpStartTime = Date.now();
    // 1. Preprocess the image with Sharp
    const rawImageData = await sharp(imageBuffer)
      .resize(IMG_WIDTH, IMG_HEIGHT)
      .ensureAlpha(0)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const sharpEndTime = Date.now();
    console.log(`[${new Date().toISOString()}] Sharp preprocessing done in ${sharpEndTime - sharpStartTime}ms.`);

    // 2. Create the Tensor
    const tensorStartTime = Date.now();
    const float32Data = new Float32Array(IMG_WIDTH * IMG_HEIGHT * IMG_CHANNELS);
    for (let i = 0; i < rawImageData.data.length; i++) {
      float32Data[i] = rawImageData.data[i] / 255.0; // Normalize
    }
    const tensor = new ort.Tensor('float32', float32Data, [1, IMG_HEIGHT, IMG_WIDTH, IMG_CHANNELS]);
    const tensorEndTime = Date.now();
    console.log(`[${new Date().toISOString()}] Tensor created in ${tensorEndTime - tensorStartTime}ms.`);

    // 3. Run Inference
    console.log(`[${new Date().toISOString()}] Running model inference...`);
    const inferenceStartTime = Date.now();
    const inputFeed = { [currentSession.inputNames[0]]: tensor };
    const results = await currentSession.run(inputFeed);
    const outputTensor = results[currentSession.outputNames[0]];
    const probabilities = outputTensor.data as Float32Array;
    const inferenceEndTime = Date.now();
    console.log(`[${new Date().toISOString()}] Inference complete in ${inferenceEndTime - inferenceStartTime}ms.`);

    // 4. Process Output
    let maxProb = 0;
    let maxIndex = 0;
    probabilities.forEach((prob, i) => {
      if (prob > maxProb) {
        maxProb = prob;
        maxIndex = i;
      }
    });

    const result = {
      class: CLASS_NAMES[maxIndex],
      confidence: maxProb,
    };
    console.log(`[${new Date().toISOString()}] Classification result: ${result.class} (${(result.confidence * 100).toFixed(2)}%)`);
    const functionEndTime = Date.now();
    console.log(`[${new Date().toISOString()}] Total classification function time: ${functionEndTime - functionStartTime}ms.`);
    return result;

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error during classification:`, error);
    const functionEndTime = Date.now();
    console.log(`[${new Date().toISOString()}] Classification function failed after ${functionEndTime - functionStartTime}ms.`);
    // Return a default error state or re-throw
    return { class: 'Classification Error', confidence: 0 };
  }
}

// Configuration to disable Vercel's default body parsing
export const config = { api: { bodyParser: false } };

// --- API Handler ---
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const handlerStartTime = Date.now();
  console.log(`[${new Date().toISOString()}] /api/upload handler started...`);

  if (req.method !== 'POST') {
    console.log(`[${new Date().toISOString()}] Method Not Allowed: ${req.method}`);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    console.log(`[${new Date().toISOString()}] Collecting image buffer...`);
    const bufferStartTime = Date.now();
    // Collect the image data stream into a buffer
    const imageBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
    const bufferEndTime = Date.now();
    console.log(`[${new Date().toISOString()}] Image buffer collected (${imageBuffer.length} bytes) in ${bufferEndTime - bufferStartTime}ms.`);

    const fileName = req.headers['x-vercel-filename'] as string || 'uploaded_image';
    console.log(`[${new Date().toISOString()}] Original filename: ${fileName}`);

    // 1. Upload the original image buffer to Vercel Blob
    console.log(`[${new Date().toISOString()}] Uploading to Vercel Blob...`);
    const blobStartTime = Date.now();
    const blob = await put(fileName, imageBuffer, {
      access: 'public',
      addRandomSuffix: true // Prevent overwrites
    });
    const blobEndTime = Date.now();
    console.log(`[${new Date().toISOString()}] Uploaded to Blob: ${blob.url} in ${blobEndTime - blobStartTime}ms.`);

    // 2. Classify the image using the ONNX model
    console.log(`[${new Date().toISOString()}] Calling classifyImage function...`);
    const prediction = await classifyImage(imageBuffer);
    console.log(`[${new Date().toISOString()}] Received classification result.`);

    // 3. Prepare data for KV store
    const predictionData = {
      _id: `pred_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      fileName: blob.pathname,
      fileSize: imageBuffer.length,
      imageUrl: blob.url,
      predictedClass: prediction.class,
      confidence: prediction.confidence,
      createdAt: Date.now(),
    };

    // 4. Save prediction data to Vercel KV list
    console.log(`[${new Date().toISOString()}] Saving prediction to KV store...`);
    const kvStartTime = Date.now();
    await kv.lpush('predictions', predictionData);
    const kvEndTime = Date.now();
    console.log(`[${new Date().toISOString()}] Saved to KV store in ${kvEndTime - kvStartTime}ms.`);

    // 5. Send the successful prediction back to the frontend
    const handlerEndTime = Date.now();
    console.log(`[${new Date().toISOString()}] /api/upload handler finished successfully in ${handlerEndTime - handlerStartTime}ms.`);
    return res.status(200).json(predictionData);

  } catch (error) {
    const handlerEndTime = Date.now();
    console.error(`[${new Date().toISOString()}] Error in upload handler:`, error);
    console.log(`[${new Date().toISOString()}] /api/upload handler failed after ${handlerEndTime - handlerStartTime}ms.`);
    return res.status(500).json({ message: 'Failed to process image upload.' });
  }
}