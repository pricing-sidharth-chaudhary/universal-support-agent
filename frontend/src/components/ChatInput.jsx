import { useState, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';

export function ChatInput({ onSend, isLoading, disabled }) {
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
    <form onSubmit={handleSubmit} className="p-4 border-t border-dark-700/50">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Upload tickets to start chatting...' : 'Type your question...'}
            disabled={isLoading || disabled}
            className={`
              w-full px-4 py-3 pr-12 rounded-xl
              bg-dark-800 border border-dark-700
              text-white placeholder-dark-500
              focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20
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
              ? 'bg-gradient-to-r from-primary-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-primary-500/25 hover:scale-105'
              : 'bg-dark-800 text-dark-500 cursor-not-allowed'
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

