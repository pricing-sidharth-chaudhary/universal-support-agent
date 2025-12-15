import { useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { Loader2 } from 'lucide-react';

export function MessageList({ messages, isLoading, onToolAction }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
      {messages.map((message) => (
        <MessageBubble 
          key={message.id} 
          message={message} 
          onToolAction={(link) => onToolAction(link, message.id)}
        />
      ))}

      {/* Loading indicator - only show if not already showing a processing message */}
      {isLoading && !messages.some(m => m.isProcessing) && (
        <div className="flex gap-3 animate-fade-in">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
          </div>
          <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
