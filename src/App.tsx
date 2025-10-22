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
        
        // Map 'createdAt' to '_creationTime' for the table component
        const mappedData = data.map((p: any) => ({
          ...p, 
          _creationTime: p.createdAt 
        }));

        // Sort by the new _creationTime field
        mappedData.sort((a: any, b: any) => b._creationTime - a._creationTime);
        setPredictions(mappedData);
      } else {
         console.error("Failed to fetch predictions:", res.statusText);
         setPredictions([]); // Clear predictions on error
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setPredictions([]); // Clear predictions on error
    }
  };

  useEffect(() => {
    fetchPredictions();
    // Listen for our custom event to refetch data
    window.addEventListener('predictions-updated', fetchPredictions);
    // Clean up the event listener
    return () => {
      window.removeEventListener('predictions-updated', fetchPredictions);
    };
  }, []);

  return (
    // --- THIS IS THE FIX for the background ---
    // We apply a simple light background and dark background here.
    <div className="min-h-screen flex flex-col bg-white dark:bg-dark-background">
      <Header hasPredictions={predictions.length > 0} />
      {/* --- ADDED FADE-IN ANIMATION --- */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Particle Vision
            </h1>
            {/* --- UPDATED TEXT HERE --- */}
            <p className="text-lg md:text-xl text-gray-600 dark:text-dark-subtle-text max-w-3xl mx-auto">
              Upload a particle jet image. This app will use a client-side AI model 
              to classify it as 'QCD Background' or 'W Boson Signal'.
            </p>
          </div>

          {/* Upload Section */}
          <ImageUpload />

          {/* Results Section */}
          {predictions.length > 0 && (
            <div className="space-y-4">
              {/* --- ADDED DARK MODE TEXT COLOR --- */}
              <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">
                Classification Results
              </h2>
              <ResultsTable predictions={predictions} />
            </div>
          )}

          {predictions.length === 0 && (
            <div className="text-center py-12">
              {/* --- ADDED DARK MODE TEXT COLOR --- */}
              <div className="text-gray-400 text-lg dark:text-dark-subtle-text">
                Upload jet images to see classification results
              </div>
            </div>
          )}
        </div>
      </main>
      {/* Use the dark theme for toasts */}
      <Toaster theme="dark" />
    </div>
  );
}