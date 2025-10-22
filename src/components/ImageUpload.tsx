import React, { useState, useCallback, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import * as ort from 'onnxruntime-web'; // Import ONNX Runtime Web

// --- IMPORTANT: This should be your JET MODEL class names ---
const CLASS_NAMES = ['QCD Background', 'W Boson Signal'];
const IMG_HEIGHT = 25;
const IMG_WIDTH = 25;
const IMG_CHANNELS = 1; // Grayscale

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

        // --- UPDATED FOR GRAYSCALE (1 Channel) ---
        const float32Data = new Float32Array(IMG_WIDTH * IMG_HEIGHT * IMG_CHANNELS);
        for (let i = 0, j = 0; i < imageData.data.length; i += 4, j++) {
          // Use the Red channel (i) as the grayscale value
          float32Data[j] = imageData.data[i] / 255.0; 
        }
        
        // Create the tensor with 1 channel
        const tensor = new ort.Tensor('float32', float32Data, [1, IMG_HEIGHT, IMG_WIDTH, IMG_CHANNELS]);
        resolve(tensor);
        // --- END UPDATE ---
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
  const [modelError, setModelError] = useState(false);
  const sessionRef = useRef<ort.InferenceSession | null>(null);

  // Load the ONNX model when the component mounts
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true);
        setModelError(false);
        toast.info("Loading classification model...");
        const modelUrl = '/model.onnx';
        const newSession = await ort.InferenceSession.create(modelUrl);
        sessionRef.current = newSession;
        toast.success("Model loaded successfully!");
      } catch (e) {
        console.error("Failed to load ONNX model:", e);
        toast.error("Error loading classification model.");
        sessionRef.current = null;
        setModelError(true);
      } finally {
        setIsModelLoading(false);
      }
    };
    loadModel();
  }, []);

  // --- This is the logic for drag-and-drop ---
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []); // Empty array tells React to not recreate this function
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  }, []); // Empty array tells React to not recreate this function
  // --- End of drag-and-drop logic ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );
    setSelectedFiles((prev) => [...prev, ...files]);
  };
  
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const classifyAndSave = async () => {
    if (selectedFiles.length === 0 || !sessionRef.current || isModelLoading) return;

    setUploading(true);
    const toastId = toast.loading(`Processing ${selectedFiles.length} image(s)...`);

    try {
      const processingPromises = selectedFiles.map(async (file) => {
        // 1. Preprocess the image for the model
        const tensor = await preprocessImage(file);

        // 2. Run inference in the browser (Corrected feeds object)
        const feeds: ort.InferenceSession.FeedsType = { [sessionRef.current!.inputNames[0]]: tensor };
        const results = await sessionRef.current!.run(feeds);
        const outputTensor = results[sessionRef.current!.outputNames[0]];
        const probability = (outputTensor.data as Float32Array)[0]; // Get single output

        // 3. Get prediction (Updated for binary classification)
        const predictedClass = probability > 0.5 ? CLASS_NAMES[1] : CLASS_NAMES[0];
        const confidence = probability > 0.5 ? probability : 1 - probability;

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
      });

      await Promise.all(processingPromises);

      toast.success(`Successfully processed ${selectedFiles.length} image(s).`, { id: toastId });
      setSelectedFiles([]);
      window.dispatchEvent(new Event('predictions-updated'));

    } catch (error) {
      console.error("Processing error:", error);
      toast.error("An error occurred during processing.", { id: toastId });
    } finally {
      setUploading(false);
    }
  };
  
  // --- RENDER GUARD CLAUSES ---
  if (isModelLoading) {
    return (
      <div className="text-center p-8 text-gray-600">
        Loading Classification Model...
      </div>
    );
  }
  
  if (modelError) {
    return (
      <div className="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        CRITICAL ERROR: Failed to load AI model. Check console or try refreshing.
      </div>
    );
  }
  // --- END GUARD CLAUSES ---


  // --- This JSX will only render if the model loaded successfully ---
  return (
    <div className="space-y-6">
      {/* Drag and Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              Upload Jet Images
            </h3>
            <p className="text-gray-600 mt-2">
              Drag and drop your images here, or click to browse
            </p>
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">
            Selected Files ({selectedFiles.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200"
              >
                <ImageIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={classifyAndSave}
            disabled={uploading || isModelLoading}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {uploading ? "Processing..." : `Classify ${selectedFiles.length} Image(s)`}
          </button>
        </div>
      )}
    </div>
  );
}