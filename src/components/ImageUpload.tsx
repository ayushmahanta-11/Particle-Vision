import React, { useState, useCallback } from "react";
import { Upload, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
// We no longer import onnxruntime-web

export function ImageUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Removed all useEffect and sessionRef for model loading

  const handleDrag = useCallback((e: React.DragEvent) => { /* ... */ }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { /* ... */ }, []);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
  const removeFile = (index: number) => { /* ... */ };

  // Renamed function back to 'uploadAndClassify'
  const uploadAndClassify = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const toastId = toast.loading(`Processing ${selectedFiles.length} image(s)...`);

    try {
      const processingPromises = selectedFiles.map(async (file) => {
        // Just upload the file to our single backend endpoint
        const uploadResponse = await fetch(`/api/upload`, {
          method: 'POST',
          headers: { 'x-vercel-filename': file.name },
          body: file,
        });
        if (!uploadResponse.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      });

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

  // --- JSX structure ---
  return (
    <div className="space-y-6">
      {/* Drag and Drop Zone (Restored from previous step) */}
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

      {/* Selected Files List (Restored from previous step) */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">
            Selected Files ({selectedFiles.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                <ImageIcon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button onClick={() => removeFile(index)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          
          {/* Button is now simple, no model loading state */}
          <button
            onClick={uploadAndClassify}
            disabled={uploading}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {uploading ? "Processing..." : `Classify ${selectedFiles.length} Image(s)`}
          </button>
        </div>
      )}
    </div>
  );
}