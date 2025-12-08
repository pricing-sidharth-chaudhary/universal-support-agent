import { Bot, RefreshCw, Database } from 'lucide-react';

export function ChatHeader({ ticketCount, onReindexClick }) {
  return (
    <header className="glass-lighter rounded-t-2xl px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-semibold text-white">AI Support Agent</h1>
          <div className="flex items-center gap-2 text-xs text-dark-400">
            <Database className="w-3 h-3" />
            <span>{ticketCount} tickets indexed</span>
          </div>
        </div>
      </div>

      <button
        onClick={onReindexClick}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-white text-sm transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        <span className="hidden sm:inline">Reindex</span>
      </button>
    </header>
  );
}

