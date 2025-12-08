import { useState, useCallback } from 'react';
import { uploadTickets, getStatus } from '../services/api';

/**
 * Custom hook for managing file upload state
 */
export function useFileUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const upload = useCallback(async (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['.json', '.csv'];
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(fileExtension)) {
      setError('Please upload a JSON or CSV file');
      return { success: false };
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setResult(null);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await uploadTickets(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setResult(response);

      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to upload file. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsUploading(false);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const status = await getStatus();
      return status;
    } catch (err) {
      console.error('Failed to check status:', err);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
    setResult(null);
  }, []);

  return {
    isUploading,
    uploadProgress,
    error,
    result,
    upload,
    checkStatus,
    reset,
  };
}

