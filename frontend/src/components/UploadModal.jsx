import { useState, useRef, useCallback } from 'react';
import { Upload, FileJson, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';

export function UploadModal({ isOpen, onUploadComplete, upload, isUploading, uploadProgress, error, result }) {
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
        onUploadComplete(response.tickets_processed);
      }, 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-dark-950/90 backdrop-blur-md" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
      </div>

      {/* Modal */}
      <div className="relative w-full max-w-lg animate-slide-up">
        <div className="glass rounded-2xl p-8 glow-primary">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-500 mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-white mb-2">
              AI Support Agent
            </h1>
            <p className="text-dark-400">
              Upload your historical ticket resolutions to get started
            </p>
          </div>

          {/* Upload Area */}
          {!result?.success ? (
            <>
              <div
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                  transition-all duration-300 ease-out
                  ${isDragging 
                    ? 'border-primary-400 bg-primary-500/10 scale-[1.02]' 
                    : 'border-dark-600 hover:border-dark-500 hover:bg-dark-800/50'
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
                  <div className="flex flex-col items-center">
                    <FileJson className="w-12 h-12 text-primary-400 mb-3" />
                    <p className="text-white font-medium mb-1">{selectedFile.name}</p>
                    <p className="text-dark-400 text-sm">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className={`w-12 h-12 mb-3 transition-colors ${isDragging ? 'text-primary-400' : 'text-dark-500'}`} />
                    <p className="text-white font-medium mb-1">
                      Drop your tickets file here
                    </p>
                    <p className="text-dark-400 text-sm mb-3">
                      or click to browse
                    </p>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-800 text-dark-400 text-xs">
                      <FileJson className="w-3 h-3" />
                      Supports: .json, .csv
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {isUploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-dark-400">Processing...</span>
                    <span className="text-primary-400">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-500 to-cyan-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className={`
                  w-full mt-6 py-3 px-4 rounded-xl font-medium transition-all duration-300
                  flex items-center justify-center gap-2
                  ${selectedFile && !isUploading
                    ? 'bg-gradient-to-r from-primary-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-primary-500/25 hover:scale-[1.02]'
                    : 'bg-dark-800 text-dark-500 cursor-not-allowed'
                  }
                `}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing tickets...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload & Index Tickets
                  </>
                )}
              </button>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-6 animate-fade-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Successfully Indexed!
              </h3>
              <p className="text-dark-400">
                {result.tickets_processed} support tickets are now ready
              </p>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-dark-500 text-xs mt-6">
            Your data is processed locally and used only to improve support responses
          </p>
        </div>
      </div>
    </div>
  );
}

