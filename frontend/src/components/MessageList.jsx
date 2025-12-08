import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { Loader2 } from 'lucide-react';

export function MessageList({ messages, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex gap-3 animate-fade-in">
          <div className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
          </div>
          <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-dark-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

