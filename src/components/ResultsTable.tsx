import { Eye, Download } from "lucide-react";
import { useState } from "react";

interface Prediction {
  _id: string;
  _creationTime: number;
  fileName: string;
  fileSize: number;
  storageId: string;
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
    const colors: Record<string, string> = {
      'proton': 'bg-red-100 text-red-800',
      'neutron': 'bg-blue-100 text-blue-800',
      'electron': 'bg-green-100 text-green-800',
      'muon': 'bg-purple-100 text-purple-800',
      'pion': 'bg-yellow-100 text-yellow-800',
      'kaon': 'bg-indigo-100 text-indigo-800',
      'photon': 'bg-gray-100 text-gray-800',
    };
    return colors[particle.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('class')}
                >
                  Predicted Particle {sortBy === 'class' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('confidence')}
                >
                  Confidence {sortBy === 'confidence' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('time')}
                >
                  Timestamp {sortBy === 'time' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedPredictions.map((prediction) => (
                <tr key={prediction._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      {prediction.imageUrl ? (
                        <img 
                          src={prediction.imageUrl} 
                          alt={prediction.fileName}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Eye className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {prediction.fileName}
                    </div>
                    <div className="text-sm text-gray-500">
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
                      <div className="text-sm font-medium text-gray-900">
                        {(prediction.confidence * 100).toFixed(1)}%
                      </div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${prediction.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(prediction._creationTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedImage(prediction.imageUrl || null)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
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
          <div key={prediction._id} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {prediction.fileName}
                </h3>
                <p className="text-xs text-gray-500">
                  {(prediction.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center ml-3">
                {prediction.imageUrl ? (
                  <img 
                    src={prediction.imageUrl} 
                    alt={prediction.fileName}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Eye className="w-6 h-6 text-gray-400" />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getParticleColor(prediction.predictedClass)}`}>
                {prediction.predictedClass}
              </span>
              <div className="text-sm font-medium text-gray-900">
                {(prediction.confidence * 100).toFixed(1)}% confidence
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              {new Date(prediction._creationTime).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-full">
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
