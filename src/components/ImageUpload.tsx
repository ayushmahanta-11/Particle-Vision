import React, { useState, useCallback, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import * as ort from 'onnxruntime-web'; // Import ONNX Runtime Web

// --- IMPORTANT: UPDATE WITH YOUR CLASS NAMES ---
const CLASS_NAMES = ['airplane', 'automobile', 'bird', 'cat', 'deer', 'dog', 'frog', 'horse', 'ship', 'truck'];
const IMG_HEIGHT = 32;
const IMG_WIDTH = 32;

// Helper function to preprocess image using Canvas
const preprocessImage = (imageFile: File): Promise<ort.Tensor> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = IMG_WIDTH;
        canvas.height = IMG_HEIGHT;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Could not get canvas context');

        ctx.drawImage(img, 0, 0, IMG_WIDTH, IMG_HEIGHT);
        const imageData = ctx.getImageData(0, 0, IMG_WIDTH, IMG_HEIGHT);

        // Convert RGBA to RGB Float32Array and normalize [0, 1]
        // Assuming NHWC format [batch, height, width, channels]
        const float32Data = new Float32Array(IMG_WIDTH * IMG_HEIGHT * 3);
        for (let i = 0, j = 0; i < imageData.data.length; i += 4, j += 3) {
          float32Data[j] = imageData.data[i] / 255.0;     // R
          float32Data[j + 1] = imageData.data[i + 1] / 255.0; // G
          float32Data[j + 2] = imageData.data[i + 2] / 255.0; // B
          // Skip Alpha channel imageData.data[i + 3]
        }
        
        // Create the tensor
        const tensor = new ort.Tensor('float32', float32Data, [1, IMG_HEIGHT, IMG_WIDTH, 3]);
        resolve(tensor);
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
};


export function ImageUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const sessionRef = useRef<ort.InferenceSession | null>(null);

  // Load the ONNX model when the component mounts
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true);
        toast.info("Loading classification model...");
        // Ensure model.onnx is in the public folder!
        const modelUrl = '/model.onnx';
        const newSession = await ort.InferenceSession.create(modelUrl);
        sessionRef.current = newSession;
        toast.success("Model loaded successfully!");
      } catch (e) {
        console.error("Failed to load ONNX model:", e);
        toast.error("Error loading classification model.");
      } finally {
        setIsModelLoading(false);
      }
    };
    loadModel();
  }, []);


  const handleDrag = useCallback((e: React.DragEvent) => { /* ... */ }, []); // <-- ADDED
  const handleDrop = useCallback((e: React.DragEvent) => { /* ... */ }, []); // <-- ADDED
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... no change ... */ };
  const removeFile = (index: number) => { /* ... no change ... */ };

  const classifyAndSave = async () => {
    if (selectedFiles.length === 0 || !sessionRef.current || isModelLoading) return;

    setUploading(true);
    const toastId = toast.loading(`Processing ${selectedFiles.length} image(s)...`);

    try {
      const processingPromises = selectedFiles.map(async (file) => {
        // 1. Preprocess the image for the model
        const tensor = await preprocessImage(file);

        // 2. Run inference in the browser
        const feeds: ort.InferenceSession.FeedsType = { [sessionRef.current!.inputNames[0]]: tensor };
        const results = await sessionRef.current!.run(feeds);
        const outputTensor = results[sessionRef.current!.outputNames[0]];
        const probabilities = outputTensor.data as Float32Array;

        // 3. Get prediction
        let maxProb = 0;
        let maxIndex = 0;
        probabilities.forEach((prob, i) => { if (prob > maxProb) { maxProb = prob; maxIndex = i; } });
        const predictedClass = CLASS_NAMES[maxIndex];
        const confidence = maxProb;

        // 4. Upload the original image to Vercel Blob via API
        const uploadResponse = await fetch(`/api/upload`, {
          method: 'POST',
          headers: { 'x-vercel-filename': file.name },
          body: file,
        });
        if (!uploadResponse.ok) throw new Error(`Failed to upload ${file.name}`);
        const blobData = await uploadResponse.json();

        // 5. Save the prediction result + blob info to Vercel KV via API
        const saveResponse = await fetch(`/api/savePrediction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             blobPath: blobData.blobPath,
             imageUrl: blobData.imageUrl,
             fileSize: blobData.fileSize,
             predictedClass: predictedClass,
             confidence: confidence
          }),
        });
        if (!saveResponse.ok) throw new Error(`Failed to save prediction for ${file.name}`);
      }); // End map

      await Promise.all(processingPromises);

      toast.success(`Successfully processed ${selectedFiles.length} image(s).`, { id: toastId });
      setSelectedFiles([]);
      window.dispatchEvent(new Event('predictions-updated')); // Notify App.tsx to refetch

    } catch (error) {
      console.error("Processing error:", error);
      toast.error("An error occurred during processing.", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  // --- JSX ---
  // The JSX structure remains mostly the same, but update the button:
  return (
    <div className="space-y-6">
      {/* ... Drag/Drop Zone ... */}
      {/* ... Selected Files List ... */}

      {selectedFiles.length > 0 && (
         <button
            onClick={classifyAndSave} // Renamed function
            disabled={uploading || isModelLoading} // Disable if model is loading
            className="..." // Add existing classes
          >
            {isModelLoading ? "Model Loading..." : (uploading ? "Processing..." : `Classify ${selectedFiles.length} Image(s)`)}
          </button>
      )}
    </div>
  );
}