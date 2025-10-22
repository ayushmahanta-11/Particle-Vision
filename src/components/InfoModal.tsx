import { X } from "lucide-react";

interface InfoModalProps {
  onClose: () => void;
}

export function InfoModal({ onClose }: InfoModalProps) {
  return (
    // Backdrop (with fade-in)
    <div 
      onClick={onClose} 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      {/* Modal Content (with scale-in) */}
      <div
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
        className="bg-white dark:bg-dark-card rounded-lg shadow-xl w-full max-w-lg p-6 space-y-4 animate-scale-in"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text">About This Model</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-gray-700 dark:text-dark-subtle-text">
          This application uses a Convolutional Neural Network (CNN) trained on simulated particle jet images from the Pythia generator.
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-dark-subtle-text">
          <li>
            <strong>Model:</strong> A ResNet-inspired deep CNN built with TensorFlow/Keras.
          </li>
          <li>
            <strong>Data:</strong> The model was trained on 25x25 grayscale images from a large HDF5 dataset.
          </li>
          <li>
            <strong>Classes:</strong> It is a binary classifier that distinguishes between two types of jets:
            <ul className="list-inside list-['-_'] ml-4 mt-1">
              <li><strong>W Boson Signal:</strong> A "signal" event from a W Boson decay.</li>
              <li><strong>QCD Background:</strong> A "background" event from quantum chromodynamics.</li>
            </ul>
          </li>
          <li>
            <strong>Inference:</strong> The classification runs entirely in your browser using `onnxruntime-web`.
          </li>
        </ul>
      </div>
    </div>
  );
}