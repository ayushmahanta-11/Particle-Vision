import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function Header() {
  const predictions = useQuery(api.predictions.list) || [];
  const clearAll = useMutation(api.predictions.clearAll);
  const downloadResults = useMutation(api.predictions.downloadResults);

  const handleDownloadCSV = async () => {
    try {
      const csvData = await downloadResults();
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `particle-predictions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Results downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download results");
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear all results?")) {
      try {
        await clearAll();
        toast.success("All results cleared");
      } catch (error) {
        toast.error("Failed to clear results");
      }
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">PV</span>
          </div>
          <span className="font-semibold text-gray-800">Particle Vision</span>
        </div>
        
        {predictions.length > 0 && (
          <div className="flex items-center space-x-2">
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
      </div>
    </header>
  );
}
