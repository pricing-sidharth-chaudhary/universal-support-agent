import { useState, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';

export function ChatInput({ onSend, isLoading, disabled, placeholder }) {
  const [input, setInput] = useState('');

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  }, [input, isLoading, disabled, onSend]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Type your question...'}
            disabled={isLoading || disabled}
            className={`
              w-full px-4 py-3 pr-12 rounded-xl
              bg-gray-50 border border-gray-200
              text-gray-900 placeholder-gray-400
              focus:outline-none focus:border-bain-red/50 focus:ring-2 focus:ring-bain-red/20 focus:bg-white
              transition-all duration-200
              ${(isLoading || disabled) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isLoading || disabled}
          className={`
            p-3 rounded-xl transition-all duration-200
            flex items-center justify-center
            ${input.trim() && !isLoading && !disabled
              ? 'bg-bain-red text-white hover:bg-bain-red-dark hover:shadow-lg hover:shadow-bain-red/25 hover:scale-105'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  );
}
