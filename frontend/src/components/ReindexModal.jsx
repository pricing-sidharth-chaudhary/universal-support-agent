import { useState, useRef, useCallback } from 'react';
import { Upload, FileJson, CheckCircle, AlertCircle, Loader2, X, RefreshCw } from 'lucide-react';

export function ReindexModal({ isOpen, onClose, onReindexComplete, upload, isUploading, uploadProgress, error, result, reset }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    const response = await upload(selectedFile);
    
    if (response?.success) {
      setTimeout(() => {
        onReindexComplete(response.tickets_processed);
        setSelectedFile(null);
        reset();
      }, 1500);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-dark-950/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-80 animate-slide-up">
        <div className="glass rounded-xl p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary-400" />
              <h3 className="font-medium text-white">Reindex Data</h3>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!result?.success ? (
            <>
              {/* Drop Zone */}
              <div
                className={`
                  border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
                  transition-all duration-200
                  ${isDragging 
                    ? 'border-primary-400 bg-primary-500/10' 
                    : 'border-dark-600 hover:border-dark-500'
                  }
                  ${isUploading ? 'pointer-events-none opacity-60' : ''}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex items-center gap-2">
                    <FileJson className="w-5 h-5 text-primary-400" />
                    <span className="text-sm text-white truncate flex-1">{selectedFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-2">
                    <Upload className="w-6 h-6 text-dark-500 mb-2" />
                    <p className="text-dark-400 text-sm">Drop file or click</p>
                  </div>
                )}
              </div>

              {/* Progress */}
              {isUploading && (
                <div className="mt-3">
                  <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className={`
                  w-full mt-3 py-2 px-3 rounded-lg text-sm font-medium transition-all
                  flex items-center justify-center gap-2
                  ${selectedFile && !isUploading
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-dark-800 text-dark-500 cursor-not-allowed'
                  }
                `}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Upload & Reindex'
                )}
              </button>

              <p className="text-dark-500 text-xs mt-3 text-center">
                This will replace existing data
              </p>
            </>
          ) : (
            /* Success */
            <div className="text-center py-4 animate-fade-in">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-white text-sm">{result.tickets_processed} tickets indexed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

