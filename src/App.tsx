import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { ImageUpload } from "./components/ImageUpload";
import { ResultsTable } from "./components/ResultsTable";
import { Header } from "./components/Header";

export default function App() {
  const [predictions, setPredictions] = useState<any[]>([]);

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
         setPredictions([]);
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setPredictions([]);
    }
  };

  useEffect(() => {
    fetchPredictions();
    window.addEventListener('predictions-updated', fetchPredictions);
    return () => {
      window.removeEventListener('predictions-updated', fetchPredictions);
    };
  }, []);

  return (
    // We apply the main background color via index.css on the <body> tag.
    // This div just provides layout.
    <div className="min-h-screen flex flex-col">
      <Header hasPredictions={predictions.length > 0} />
      
      {/* Main content with fade-in animation */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
        <div className="space-y-12">
          
          {/* Hero Section - UPDATED TEXT */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-dark-text">
              Jet Image Classifier
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-dark-subtle-text max-w-3xl mx-auto">
              This app uses a client-side AI model to classify particle jet images
              as 'QCD Background' or 'W Boson Signal'.
            </p>
          </div>

          {/* Upload Section */}
          <ImageUpload />

          {/* Results Section */}
          {predictions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-dark-text">
                Classification Results
              </h2>
              <ResultsTable predictions={predictions} />
            </div>
          )}

          {predictions.length === 0 && (
            <div className="text-center py-12">
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