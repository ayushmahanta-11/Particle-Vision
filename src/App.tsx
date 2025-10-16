import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { ImageUpload } from "./components/ImageUpload";
import { ResultsTable } from "./components/ResultsTable";
import { Header } from "./components/Header";

export default function App() {
  const [predictions, setPredictions] = useState<any[]>([]);

  // Function to fetch the latest predictions from our Vercel API
  const fetchPredictions = async () => {
    try {
      const res = await fetch('/api/predictions');
      if (res.ok) {
        const data = await res.json();
        // Data from Vercel KV needs to be sorted manually by timestamp
        data.sort((a: any, b: any) => b.createdAt - a.createdAt);
        setPredictions(data);
      }
    } catch (error) {
      console.error("Failed to fetch predictions:", error);
    }
  };

  useEffect(() => {
    fetchPredictions();
    // Listen for our custom event to refetch data after uploads or deletes
    window.addEventListener('predictions-updated', fetchPredictions);
    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('predictions-updated', fetchPredictions);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header hasPredictions={predictions.length > 0} />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Particle Vision
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced particle track image classification using deep learning.
              Upload your particle detector images and get instant predictions for protons, neutrons, electrons, and more.
            </p>
          </div>

          <ImageUpload />

          {predictions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Classification Results</h2>
              <ResultsTable predictions={predictions} />
            </div>
          )}

          {predictions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">
                Upload particle track images to see classification results
              </div>
            </div>
          )}
        </div>
      </main>
      <Toaster />
    </div>
  );
}