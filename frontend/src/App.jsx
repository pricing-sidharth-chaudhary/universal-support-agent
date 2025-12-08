import { useState, useEffect } from 'react';
import { UploadModal } from './components/UploadModal';
import { ReindexModal } from './components/ReindexModal';
import { ChatWindow } from './components/ChatWindow';
import { useChat } from './hooks/useChat';
import { useFileUpload } from './hooks/useFileUpload';
import { getStatus } from './services/api';

function App() {
  const [appState, setAppState] = useState('loading'); // 'loading' | 'initial' | 'ready'
  const [ticketCount, setTicketCount] = useState(0);
  const [showReindexModal, setShowReindexModal] = useState(false);

  const { messages, isLoading: isChatLoading, send } = useChat();
  const uploadHook = useFileUpload();
  const reindexHook = useFileUpload();

  // Check initial status on mount
  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        const status = await getStatus();
        if (status && status.tickets_count > 0) {
          setTicketCount(status.tickets_count);
          setAppState('ready');
        } else {
          setAppState('initial');
        }
      } catch (error) {
        // Backend might not be running yet
        setAppState('initial');
      }
    };

    checkInitialStatus();
  }, []);

  // Handle initial upload complete
  const handleUploadComplete = (count) => {
    setTicketCount(count);
    setAppState('ready');
  };

  // Handle reindex complete
  const handleReindexComplete = (count) => {
    setTicketCount(count);
    setShowReindexModal(false);
  };

  // Show loading state briefly
  if (appState === 'loading') {
    return (
      <div className="min-h-screen dot-pattern flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dot-pattern flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Main Container */}
      <div className="w-full max-w-2xl h-[85vh] max-h-[800px]">
        <ChatWindow
          ticketCount={ticketCount}
          messages={messages}
          isLoading={isChatLoading}
          onSend={send}
          onReindexClick={() => setShowReindexModal(true)}
          isLocked={appState !== 'ready'}
        />
      </div>

      {/* Initial Upload Modal (Blocking) */}
      <UploadModal
        isOpen={appState === 'initial'}
        onUploadComplete={handleUploadComplete}
        upload={uploadHook.upload}
        isUploading={uploadHook.isUploading}
        uploadProgress={uploadHook.uploadProgress}
        error={uploadHook.error}
        result={uploadHook.result}
      />

      {/* Reindex Modal (Non-blocking) */}
      <ReindexModal
        isOpen={showReindexModal}
        onClose={() => {
          setShowReindexModal(false);
          reindexHook.reset();
        }}
        onReindexComplete={handleReindexComplete}
        upload={reindexHook.upload}
        isUploading={reindexHook.isUploading}
        uploadProgress={reindexHook.uploadProgress}
        error={reindexHook.error}
        result={reindexHook.result}
        reset={reindexHook.reset}
      />

      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}

export default App;

