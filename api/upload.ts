import { put } from '@vercel/blob';
import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as ort from 'onnxruntime-node'; // ONNX Runtime for Node.js
import sharp from 'sharp'; // Image processing library
import path from 'path';

// --- IMPORTANT: UPDATE WITH YOUR CLASS NAMES ---
// This list MUST match the order printed by Cell 4 in your Colab notebook.
const CLASS_NAMES = ['airplane', 'automobile', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck'];
const IMG_HEIGHT = 32; // CIFAR-10 image height
const IMG_WIDTH = 32;  // CIFAR-10 image width
const IMG_CHANNELS = 3; // CIFAR-10 is color

// --- Global variable to hold the loaded ONNX session ---
// We load it once globally to avoid reloading on every request (improves performance).
let session: ort.InferenceSession | null = null;
const modelPath = path.join(process.cwd(), 'api', 'model.onnx');

// --- Function to load the ONNX session ---
async function loadSession() {
  if (!session) {
    try {
      console.log('Loading ONNX model session...');
      session = await ort.InferenceSession.create(modelPath);
      console.log('ONNX model session loaded successfully.');
    } catch (e) {
      console.error(`Failed to load ONNX session: ${e}`);
      throw e; // Throw error if session fails to load
    }
  }
  return session;
}

/**
 * Classifies an image buffer using the loaded ONNX model.
 */
async function classifyImage(imageBuffer: Buffer): Promise<{ class: string; confidence: number; }> {
  try {
    const currentSession = await loadSession();
    if (!currentSession) {
      throw new Error("ONNX session is not loaded.");
    }

    // 1. Preprocess the image with Sharp:
    //    - Resize to 32x32.
    //    - Ensure 3 color channels (RGB).
    //    - Get raw pixel data.
    const rawImageData = await sharp(imageBuffer)
      .resize(IMG_WIDTH, IMG_HEIGHT)
      .ensureAlpha(0) // Remove alpha channel if present
      .removeAlpha()
      .raw() // Get raw pixel buffer (RGB format)
      .toBuffer({ resolveWithObject: true }); // Get buffer and info

    // 2. Create the Tensor:
    //    - Normalize pixel values from [0, 255] to [0, 1].
    //    - Create a Float32Array in the correct shape [batch, height, width, channels].
    const float32Data = new Float32Array(IMG_WIDTH * IMG_HEIGHT * IMG_CHANNELS);
    for (let i = 0; i < rawImageData.data.length; i++) {
      float32Data[i] = rawImageData.data[i] / 255.0; // Normalize
    }

    // Note: ONNX Runtime expects NCHW format by default for images usually, but TensorFlow Keras
    // often uses NHWC. tf2onnx *might* have handled this, but if you get errors/bad results,
    // you might need to transpose the dimensions here (e.g., to [1, 3, 32, 32]).
    // For now, we assume NHWC [batch, height, width, channels] based on Keras default.
    const tensor = new ort.Tensor('float32', float32Data, [1, IMG_HEIGHT, IMG_WIDTH, IMG_CHANNELS]);

    // 3. Run Inference:
    const inputFeed = { [currentSession.inputNames[0]]: tensor };
    const results = await currentSession.run(inputFeed);
    const outputTensor = results[currentSession.outputNames[0]];
    const probabilities = outputTensor.data as Float32Array;

    // 4. Process Output:
    //    - Find the index (and value) of the highest probability.
    let maxProb = 0;
    let maxIndex = 0;
    probabilities.forEach((prob, i) => {
      if (prob > maxProb) {
        maxProb = prob;
        maxIndex = i;
      }
    });

    // Return the class name and confidence
    return {
      class: CLASS_NAMES[maxIndex],
      confidence: maxProb,
    };
  } catch (error) {
    console.error("Error during classification:", error);
    // Return a default or throw a specific error
    return { class: 'Error', confidence: 0 };
  }
}

// Configuration to disable Vercel's default body parsing
export const config = { api: { bodyParser: false } };

// --- API Handler ---
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
    //    We add a random suffix to prevent overwriting files with the same name.
    const blob = await put(fileName, imageBuffer, {
      access: 'public',
      addRandomSuffix: true
    });

    // 2. Classify the image using the ONNX model
    const prediction = await classifyImage(imageBuffer);

    // 3. Prepare data for KV store
    const predictionData = {
      _id: `pred_${Date.now()}_${Math.random().toString(16).slice(2)}`, // More unique ID
      fileName: blob.pathname, // Store the final path in blob storage
      fileSize: imageBuffer.length,
      imageUrl: blob.url,
      predictedClass: prediction.class,
      confidence: prediction.confidence,
      createdAt: Date.now(),
    };

    // 4. Save prediction data to Vercel KV list
    await kv.lpush('predictions', predictionData);

    // 5. Send the successful prediction back to the frontend
    return res.status(200).json(predictionData);

  } catch (error) {
    console.error('Error in upload handler:', error);
    return res.status(500).json({ message: 'Failed to process image upload.' });
  }
}