import { useState, useEffect } from "react";
import { Download, Trash2, Info, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { InfoModal } from "./InfoModal"; // Import the modal

export function Header({ hasPredictions }: { hasPredictions: boolean }) {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for saved theme preference on load and apply to <html>
  useEffect(() => {
    if (localStorage.theme === 'dark' || 
       (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    if (isDarkMode) {
      localStorage.theme = 'light';
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    } else {
      localStorage.theme = 'dark';
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    }
  };

  const handleDownloadCSV = async () => {
    toast.info("Download CSV functionality is not yet implemented.");
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear all results?")) {
      const toastId = toast.loading("Clearing results...");
      try {
        const res = await fetch('/api/predictions', { method: 'DELETE' });
        if (!res.ok) throw new Error("Failed to clear");
        
        toast.success("All results cleared", { id: toastId });
        window.dispatchEvent(new Event('predictions-updated'));
      } catch (error) {
        console.error("Failed to clear results:", error);
        toast.error("Failed to clear results", { id: toastId });
      }
    }
  };

  return (
    <>
      {/* Header with dark mode styles */}
      <header className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm border-b border-gray-200 dark:border-dark-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          
          {/* Left Side: Title */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PV</span>
            </div>
            <span className="font-semibold text-gray-800 dark:text-dark-text">Particle Vision</span>
          </div>
          
          {/* Center: Action Buttons (Hidden on mobile) */}
          {hasPredictions && (
            <div className="hidden md:flex items-center space-x-2 absolute left-1/2 -translate-x-1/2">
              <button
                onClick={handleDownloadCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download CSV</span>
              </button>
              <button
                onClick={handleClearAll}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>
          )}

          {/* Right Side: Info and Theme Toggle */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsInfoModalOpen(true)}
              className="text-gray-600 dark:text-dark-subtle-text hover:text-black dark:hover:text-dark-text"
              title="About this model"
            >
              <Info className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleTheme}
              className="text-gray-600 dark:text-dark-subtle-text hover:text-black dark:hover:text-dark-text"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>
      
      {/* Render the modal if it's open */}
      {isInfoModalOpen && <InfoModal onClose={() => setIsInfoModalOpen(false)} />}
    </>
  );
}