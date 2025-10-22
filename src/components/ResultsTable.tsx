import { Eye } from "lucide-react";
import { useState } from "react";

interface Prediction {
  _id: string;
  _creationTime: number; // This is being mapped from 'createdAt' in App.tsx
  fileName: string;
  fileSize: number;
  predictedClass: string;
  confidence: number;
  imageUrl?: string | null;
}

interface ResultsTableProps {
  predictions: Prediction[];
}

export function ResultsTable({ predictions }: ResultsTableProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'time' | 'confidence' | 'class'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedPredictions = [...predictions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'time':
        comparison = a._creationTime - b._creationTime;
        break;
      case 'confidence':
        comparison = a.confidence - b.confidence;
        break;
      case 'class':
        comparison = a.predictedClass.localeCompare(b.predictedClass);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: 'time' | 'confidence' | 'class') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getParticleColor = (particle: string) => {
    // Colors for the 2-class model
    const colors: Record<string, string> = {
      'qcd background': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'w boson signal': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    };
    return colors[particle.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-card border-b border-gray-200 dark:border-dark-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-dark-subtle-text uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-dark-subtle-text uppercase tracking-wider">
                  File Name
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-dark-subtle-text uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-border"
                  onClick={() => handleSort('class')}
                >
                  Predicted Particle {sortBy === 'class' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-dark-subtle-text uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-border"
                  onClick={() => handleSort('confidence')}
                >
                  Confidence {sortBy === 'confidence' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-dark-subtle-text uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-border"
                  onClick={() => handleSort('time')}
                >
                  Timestamp {sortBy === 'time' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-dark-subtle-text uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
              {sortedPredictions.map((prediction) => (
                <tr key={prediction._id} className="hover:bg-gray-50 dark:hover:bg-dark-border animate-fade-in">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-dark-background rounded-lg flex items-center justify-center">
                      {prediction.imageUrl ? (
                        <img 
                          src={prediction.imageUrl} 
                          alt={prediction.fileName}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Eye className="w-6 h-6 text-gray-400 dark:text-dark-subtle-text" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-dark-text truncate max-w-xs">
                      {prediction.fileName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-dark-subtle-text">
                      {(prediction.fileSize / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getParticleColor(prediction.predictedClass)}`}>
                      {prediction.predictedClass}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 dark:text-dark-text">
                        {(prediction.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="ml-2 w-16 bg-gray-200 dark:bg-dark-border rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${prediction.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-subtle-text">
                    {new Date(prediction._creationTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowJwap">
                    <button
                      onClick={() => setSelectedImage(prediction.imageUrl || null)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedPredictions.map((prediction) => (
          <div key={prediction._id} className="bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-border p-4 space-y-3 animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-dark-text truncate">
                  {prediction.fileName}
                </h3>
                <p className="text-xs text-gray-500 dark:text-dark-subtle-text">
                  {(prediction.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="w-16 h-16 bg-gray-100 dark:bg-dark-background rounded-lg flex items-center justify-center ml-3">
                {prediction.imageUrl ? (
                  <img 
                    src={prediction.imageUrl} 
                    alt={prediction.fileName}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Eye className="w-6 h-6 text-gray-400 dark:text-dark-subtle-text" />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getParticleColor(prediction.predictedClass)}`}>
                {prediction.predictedClass}
              </span>
              <div className="text-sm font-medium text-gray-900 dark:text-dark-text">
                {(prediction.confidence * 100).toFixed(1)}% confidence
              </div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-dark-subtle-text">
              {new Date(prediction._creationTime).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-full animate-scale-in">
            <img 
              src={selectedImage} 
              alt="Particle track"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}